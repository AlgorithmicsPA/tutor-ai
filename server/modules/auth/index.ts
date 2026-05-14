/**
 * Módulo auth — Passport LocalStrategy + express-session sobre Postgres.
 *
 * Entry point del módulo. Exporta `registerAuthModule(app)` que registra
 * session middleware + Passport + los 4 endpoints del feature en el Express
 * app. Es el ÚNICO símbolo que el server raíz debe importar para activar el
 * módulo.
 *
 * Después de llamar `registerAuthModule(app)`, el resto de los módulos puede
 * usar `req.isAuthenticated()` y `req.user` (Passport instala estos helpers
 * como side-effect de session/passport.session middleware).
 */
import type { Express } from "express";
import { registerAuthRoutes } from "./routes";

export { registerAuthRoutes } from "./routes";
export {
  hashPassword,
  comparePasswords,
  sanitizeUser,
} from "./service";

export function registerAuthModule(app: Express): void {
  registerAuthRoutes(app);
}
