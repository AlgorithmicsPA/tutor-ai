# auth — autenticación local con Passport + express-session

## Qué hace

Provee los 4 endpoints HTTP de autenticación del backend tutorai:

- `POST /api/register` — crea un usuario nuevo (hash scrypt). Loguea automáticamente al usuario recién creado y devuelve `{ id, username, name, role }` sin `password`.
- `POST /api/login` — autentica con `passport-local`, inicia sesión.
- `POST /api/logout` — destruye la sesión.
- `GET /api/user` — devuelve el usuario autenticado o `401` si no hay sesión.

Además, como side-effect de `registerAuthModule(app)`:

- Monta `express-session` con cookie de 7 días, secret en `process.env.SESSION_SECRET`, session store Postgres (compartido con el storage monolítico — tabla `session`).
- Monta `passport.initialize()` + `passport.session()` y registra el `LocalStrategy` + `serializeUser` / `deserializeUser` por `user.id`.
- Setea `app.set("trust proxy", 1)` para que la cookie respete el header `X-Forwarded-Proto` que pone nginx (HTTPS terminado afuera del proceso Node).

Estos side-effects son los que habilitan `req.isAuthenticated()` y `req.user` en el resto de los módulos (news, lessons, progress, admin_users, admin_progress) — todos asumen que `auth` ya corrió antes que ellos.

## Cómo se instala

`auth` es un módulo del backend tutorai y se activa con un único import en `server/routes.ts`:

```ts
import { registerAuthModule } from "./modules/auth";
// …
registerAuthModule(app);
```

Después del `registerAuthModule(app)`, todos los módulos posteriores tienen acceso a sesión activa.

**Importante**: `auth` debe registrarse ANTES que los módulos que dependen de `req.user` / `req.isAuthenticated()` (news, lessons, etc.). Si se invierte el orden, esos módulos siguen funcionando, pero los handlers que cheque `req.isAuthenticated()` van a devolver `false` aunque haya sesión.

## Dependencias

### Runtime (npm)
- `passport` + `passport-local` — estrategia local username/password.
- `express-session` — manejo de sesión + cookie.
- `connect-pg-simple` — session store sobre Postgres (instanciado en `server/storage.ts`, importado vía `./storage`).
- `crypto` (node) — scrypt para hashear passwords. Formato `${hex(hash)}.${hex(salt)}`.

### Env
- `SESSION_SECRET` — secret de firma de la cookie. Tiene que existir en `shared/.env`. Sin esto, `express-session` lanza error al primer request.

### Otros módulos
- `server/storage.ts` (monolítico) — provee `getUser`, `getUserByUsername`, `createUser`, `sessionStore`. El módulo importa solo a través de `./storage.ts` para que el día que el storage se modularice no haya que tocar `routes.ts`.

## Cómo se prueba

Smoke test rápido contra producción (https://tutorai.duckdns.org):

```bash
# Login con la única usuaria productiva (Yanina). Pablo tiene la password.
curl -i -c /tmp/tutorai-cookies.txt \
  -H 'Content-Type: application/json' \
  -X POST https://tutorai.duckdns.org/api/login \
  -d '{"username":"yanina","password":"<password>"}'
# Esperado: 200 + body JSON con id/username/name/role + Set-Cookie: connect.sid=...

# Confirmar sesión activa:
curl -i -b /tmp/tutorai-cookies.txt https://tutorai.duckdns.org/api/user
# Esperado: 200 + JSON del usuario.

# Probar /api/user sin cookie:
curl -i https://tutorai.duckdns.org/api/user
# Esperado: 401.

# Logout:
curl -i -b /tmp/tutorai-cookies.txt -X POST https://tutorai.duckdns.org/api/logout
# Esperado: 200 {"ok":true}.
```

End-to-end manual: login desde el frontend, navegar a `/lecciones` y a `/noticias`, verificar que ambas requieren sesión y muestran data.

## Cómo se desinstala

1. Sacar la línea `import { registerAuthModule } from "./modules/auth";` y la llamada `registerAuthModule(app);` de `server/routes.ts`.
2. Borrar `server/modules/auth/`.
3. (Opcional) `DROP TABLE session;` en Postgres si no se va a reactivar.

⚠️ Sin `auth` el backend deja de tener sesión: el frontend no puede loguearse, todos los endpoints que checan `req.user` empiezan a 401. Solo desinstalar si se reemplaza por otro proveedor (OAuth, magic links, etc.).

## Notas

- El hash scrypt usa el mismo formato que el módulo `admin_users/service.ts` (que también hashea cuando se crea un usuario desde el admin). Hoy esa función está duplicada — TODO de unificación: cuando `admin_users` se refactorice, debe importar `hashPassword` desde `./modules/auth`.
- `Express.User` se declara como `extends SelectUser` (drizzle) acá vía `declare global`. Esto es global a TODO el server, por eso vive en este módulo (es el dueño de Passport).
- `trust proxy` está en `1` (nginx local) — no subir el número a `true` para producción detrás de CDN sin pensarlo: rompe la cookie por dirección IP visible.
- El módulo NO expone `requireAuth` middleware reusable. Cada módulo que lo necesita define su propio inline (`function requireAuth(req, res, next) { if (!req.isAuthenticated?.()) return res.sendStatus(401); next(); }`). Cuando aparezca el tercer copy, vale extraerlo acá.
