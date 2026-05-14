/**
 * Módulo progress — tracking de progreso de alumnos por lección.
 *
 * Entry point del módulo. Exporta `registerProgressModule(app)` que registra
 * todos los endpoints HTTP del feature en el Express app. Es el ÚNICO símbolo
 * que el server raíz debe importar para activar el módulo.
 */
import type { Express } from "express";
import { registerProgressRoutes } from "./routes";

export { registerProgressRoutes } from "./routes";
export {
  getUserProgress,
  createUserProgress,
  updateUserProgress,
} from "./service";

export function registerProgressModule(app: Express): void {
  registerProgressRoutes(app);
}
