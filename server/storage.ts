/**
 * @deprecated — Re-export shim de la Fase 9 de modularización (2026-05-14).
 *
 * La implementación se movió a `server/core/storage.ts`. Este archivo se
 * preserva ~2-4 semanas como red de compatibilidad para imports legacy
 * (`from "./storage"`, `from "../../storage"`, etc.) y se borra junto con el
 * resto de wrappers de `_deprecated/`.
 *
 * Para código nuevo: importar desde `./core/storage` (o `../core/storage`,
 * según profundidad). Mejor todavía: usar la storage layer del módulo
 * correspondiente (`modules/<feature>/storage.ts`) cuando exista — el split
 * por feature queda como Fase 9.5 pendiente.
 */
export * from "./core/storage";
export { storage } from "./core/storage";
