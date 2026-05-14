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
