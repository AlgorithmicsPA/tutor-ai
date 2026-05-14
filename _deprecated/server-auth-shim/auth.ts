/**
 * @deprecated — Wrapper de compatibilidad de la Fase 8 de modularización
 * (2026-05-14). La implementación se movió a `server/modules/auth/`.
 *
 * No quedan consumers actuales de este archivo (verificado con `grep` antes
 * del move). Se preserva ~2-4 semanas como red por si algún script externo,
 * test o branch viejo lo importa. Después de ese período se borra junto con
 * el resto de `_deprecated/`.
 *
 * Para auth nueva: importar `registerAuthModule` (entry) o `hashPassword` /
 * `comparePasswords` / `sanitizeUser` directamente desde `./modules/auth`.
 */
import type { Express } from "express";
import { registerAuthModule } from "./modules/auth";

export {
  hashPassword,
  comparePasswords,
  sanitizeUser,
} from "./modules/auth";

/** @deprecated usar `registerAuthModule` de `./modules/auth` */
export function setupAuth(app: Express): void {
  registerAuthModule(app);
}
