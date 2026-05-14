/**
 * Módulo health — endpoint de salud del backend tutorai.
 *
 * Entry point del módulo. Exporta `registerHealthModule(app)` que registra
 * el endpoint `/healthz` en el Express app. Es el ÚNICO símbolo que el
 * server raíz debe importar para activar el módulo.
 */
import type { Express } from "express";
import { registerHealthRoutes } from "./routes";

export { registerHealthRoutes } from "./routes";

export function registerHealthModule(app: Express): void {
  registerHealthRoutes(app);
}
