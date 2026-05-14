/**
 * Módulo tutor — chat IA principal del producto.
 *
 * Entry point del módulo. Exporta `registerTutorModule(app)` que registra
 * todas las rutas HTTP del feature en el Express app. Es el ÚNICO símbolo
 * que el server raíz debe importar para activar el módulo.
 *
 * Internals (`service`, `openai-client`) quedan encapsulados; otros módulos
 * que necesiten el LLM o el scoring importan desde acá.
 */
import type { Express } from "express";
import { registerTutorRoutes } from "./routes";

export { registerTutorRoutes } from "./routes";
export { runTutorChat, scoreQuiz } from "./service";
export { openai, geminiClient, OPENAI_MODEL, GEMINI_MODEL } from "./openai-client";

export function registerTutorModule(app: Express): void {
  registerTutorRoutes(app);
}
