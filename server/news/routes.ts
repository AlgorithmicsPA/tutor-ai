/**
 * DEPRECADO 2026-05-14 — el código se movió a `server/modules/news/`.
 *
 * Este archivo queda como wrapper de compatibilidad por 2-4 semanas
 * (regla CLAUDE.md global: arquitectura modular, backwards compat al migrar).
 * Cualquier import nuevo debe apuntar a `server/modules/news`.
 *
 * Ver _deprecated/README.md.
 */
export { registerNewsRoutes } from "../modules/news/routes";
