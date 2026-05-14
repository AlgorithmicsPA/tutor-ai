# `_deprecated/` — wrappers de compat de la modularización

Archivos / paths viejos que quedaron como wrappers o re-exports tras la migración
modular (regla CLAUDE.md global: backwards compat 2-4 semanas).

## Vigentes

### 2026-05-14 — Fase 1: módulo `news`

- **Movido**: `server/news/` → `server/modules/news/`
- **Wrappers vivos** (re-export, deprecados, **no editar**):
  - `server/news/routes.ts` → `server/modules/news/routes`
  - `server/news/job.ts` → `server/modules/news/job`
  - `server/news/generator.ts` → `server/modules/news/generator`
  - `server/news/rss.ts` → `server/modules/news/rss`
  - `server/news/topics.ts` → `server/modules/news/topics`
- **Borrar a partir de**: 2026-06-11 (4 semanas).
- **Cómo borrar**:
  1. `grep -r "server/news" code/server code/client` — debe dar 0 resultados (todos los imports deben apuntar a `modules/news`).
  2. `rm -rf code/server/news/`
  3. Eliminar esta entrada del README.

### 2026-05-14 — Fase 9: cleanup + core

- **Movidos**:
  - `server/storage.ts` → `server/core/storage.ts` (+ shim `server/storage.ts` que re-exporta `storage` y los tipos).
  - `server/postgres-startup.ts` → `server/core/postgres-startup.ts` (import en `server/index.ts` ya actualizado).
  - `server/auth.ts` → `_deprecated/server-auth-shim/auth.ts` (wrapper Fase 8 sin consumers, ver `server-auth-shim/README.md`).
- **Wrappers vivos** (re-export, deprecados, **no editar**):
  - `server/storage.ts` → `server/core/storage.ts`
- **Borrar a partir de**: 2026-06-11 (4 semanas).
- **Cómo borrar**:
  1. `grep -rn 'from .*[\"'\'']\.\+/storage[\"'\'']' code/server code/client` — debe apuntar todo a `core/storage` o a `modules/<X>/storage`.
  2. `rm -f code/server/storage.ts`
  3. `rm -rf code/_deprecated/server-auth-shim/`
  4. Eliminar esta entrada del README.

### Pendiente — Fase 9.5: split storage por feature

`server/core/storage.ts` sigue monolítico (`DbStorage implements IStorage`,
~290 LOC). El plan modular ideal es partir cada grupo de queries al
`modules/<X>/storage.ts` correspondiente (users → `modules/auth/`,
lessons → `modules/lessons/`, progress → `modules/progress/`, news →
`modules/news/`). Hoy todos los módulos consumen vía el facade
(`storage.getUser()`, `storage.getAllLessons()`, etc.) y comparten el
mismo `_pool` / `_db` singleton + `sessionStore`. Split = romper la
clase + cambiar 9 import sites + reescribir el `sessionStore` wiring.
**Riesgo alto, beneficio bajo en este momento** → diferido como Fase 9.5.
