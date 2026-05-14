# `server/auth.ts` — wrapper deprecated (Fase 8 modularización)

Wrapper de compatibilidad creado el 2026-05-14 durante la Fase 8 (módulo
`auth`). La implementación real vive en `server/modules/auth/`.

## Estado

- **0 consumers activos** al 2026-05-14 (verificado con
  `grep -rn "from .*server/auth\"" code/ && grep -rn 'require.*server/auth' code/`
  → ambos sin resultados, salvo el propio `auth.ts.bak.fase8`).
- Se movió a `_deprecated/` el 2026-05-14 (Fase 9).
- **Borrar a partir de**: 2026-06-11 (4 semanas).
- **Cómo borrar**: `rm -rf _deprecated/server-auth-shim/` + entrada de este
  README en `_deprecated/README.md`.

## Path original

`server/auth.ts` — re-exportaba `hashPassword`, `comparePasswords`,
`sanitizeUser` y `setupAuth(app)` desde `./modules/auth`.

## Reemplazo

Para auth nueva, importar directo desde `server/modules/auth`:

```ts
import {
  registerAuthModule,
  hashPassword,
  comparePasswords,
  sanitizeUser,
} from "./modules/auth";
```
