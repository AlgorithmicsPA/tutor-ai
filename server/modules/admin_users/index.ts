/**
 * Módulo admin_users — admin CRUD sobre la tabla `users`.
 *
 * Entry point del módulo. Exporta `registerAdminUsersModule(app)` que registra
 * todos los endpoints HTTP del feature en el Express app. Es el ÚNICO símbolo
 * que el server raíz debe importar para activar el módulo.
 */
import type { Express } from "express";
import { registerAdminUsersRoutes } from "./routes";

export { registerAdminUsersRoutes } from "./routes";
export {
  getAllUsers,
  getUserByUsername,
  createUser,
  updateUser,
  deleteUser,
  hashPassword,
  sanitizeUser,
} from "./service";

export function registerAdminUsersModule(app: Express): void {
  registerAdminUsersRoutes(app);
}
