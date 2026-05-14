/**
 * Módulo admin_progress — admin: resumen de progreso por usuario.
 *
 * Entry point del módulo. Exporta `registerAdminProgressModule(app)` que
 * registra los endpoints HTTP del feature en el Express app. Es el ÚNICO
 * símbolo que el server raíz debe importar para activar el módulo.
 */
import type { Express } from "express";
import { registerAdminProgressRoutes } from "./routes";

export { registerAdminProgressRoutes } from "./routes";
export { getProgressSummary } from "./service";
export type { UserProgressSummary } from "./service";

export function registerAdminProgressModule(app: Express): void {
  registerAdminProgressRoutes(app);
}
