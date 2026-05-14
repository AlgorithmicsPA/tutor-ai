/**
 * Módulo news — clase semanal de noticias de IA
 *
 * Entry point del módulo. Exporta `registerNewsModule(app)` que:
 *   - registra todas las rutas HTTP del feature en el Express app
 *   - es el ÚNICO símbolo que el server raíz debe importar
 *
 * El resto de la API interna (job, generator, rss, topics) queda encapsulada
 * dentro del módulo. Si otro módulo necesita usarla, debe importar desde acá.
 */
import type { Express } from "express";
import { registerNewsRoutes } from "./routes";

export { registerNewsRoutes } from "./routes";
export { runWeeklyFetch } from "./job";
export { generateNewsClass } from "./generator";
export { scoreNewsForUser } from "./topics";
export { weekOfMonday } from "./rss";

export function registerNewsModule(app: Express): void {
  registerNewsRoutes(app);
}
