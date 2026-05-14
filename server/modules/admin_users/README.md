# Módulo `admin_users`

Admin CRUD de usuarios (listar, crear, actualizar, borrar). Extraído de `server/routes.ts` en la **Fase 5** de modularización (2026-05-14).

## Qué hace

- Lista todos los usuarios (sin password).
- Crea un usuario nuevo hasheando la contraseña con scrypt (mismo formato que `server/auth.ts`).
- Actualiza name / role / password de un usuario.
- Borra un usuario por id.

## Endpoints

| Verbo | Path | Quién | Descripción |
|---|---|---|---|
| GET    | `/api/admin/users`      | admin | lista usuarios (sin password) |
| POST   | `/api/admin/users`      | admin | crea usuario nuevo |
| PUT    | `/api/admin/users/:id`  | admin | actualiza name/role/password |
| DELETE | `/api/admin/users/:id`  | admin | borra usuario |

## Estructura

```
modules/admin_users/
├── index.ts        ← export registerAdminUsersModule(app)
├── routes.ts       ← Express handlers
├── service.ts      ← wrapper del storage + hashPassword + sanitizeUser
└── README.md
```

## Dependencias

- `@shared/schema` — tipo `InsertUser`.
- `../../storage` — repository monolítico (Drizzle). Cuando se modularice storage, solo cambia `service.ts`.
- `crypto` (node) — scrypt para hashear passwords. Formato `${hex(hash)}.${hex(salt)}`, idéntico a `server/auth.ts`. Si cambia ahí, cambiar acá.

## Cómo se activa

En `server/routes.ts`:

```ts
import { registerAdminUsersModule } from "./modules/admin_users";
// ...
registerAdminUsersModule(app);
```

## Cómo se prueba

```bash
# health
curl -sf http://localhost:3001/healthz

# listar (devuelve [] si DB vacía o ya con users)
curl -sf http://localhost:3001/api/admin/users

# crear
curl -sf -X POST http://localhost:3001/api/admin/users \
  -H 'Content-Type: application/json' \
  -d '{"username":"test","password":"test1234","role":"student","name":"Test"}'

# update
curl -sf -X PUT http://localhost:3001/api/admin/users/2 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test 2"}'

# delete
curl -sf -X DELETE http://localhost:3001/api/admin/users/2
```

## Cómo se desinstala

1. Borrar de `server/routes.ts` la llamada a `registerAdminUsersModule(app)` y el import.
2. Re-pegar los handlers viejos desde el git history previo al commit Fase 5, o dejar el feature apagado.
3. `npm run build` + `deploy-arm.sh tutorai`.

Notar: la tabla Drizzle (`users`) NO la maneja este módulo — vive en `shared/schema.ts` y la comparte con `auth` y `admin-progress`. Desinstalar el módulo no borra datos ni rompe login.

## Notas

- Los endpoints HOY no exigen middleware de auth/admin — replican el comportamiento previo a Fase 5 (mismo monolito). Endurecer con `requireAuth` + `requireAdmin` se trackea aparte (no scope de Fase 5, no romper compat con el admin frontend actual).
- `hashPassword` está duplicado a propósito con `server/auth.ts` para mantener el módulo autocontenido. Si auth migra a un módulo `auth/`, ambos deben importar de un único `auth/service.ts`.
- Fase 5 del plan en `/home/ubuntu/projects/tutorai/MODULAR_PLAN.md`.
