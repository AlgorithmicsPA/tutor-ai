/**
 * Módulo lessons — CRUD de lecciones + generación con IA.
 *
 * Entry point del módulo. Exporta `registerLessonsModule(app)` que registra
 * todos los endpoints HTTP del feature en el Express app. Es el ÚNICO símbolo
 * que el server raíz debe importar para activar el módulo.
 *
 * Reuso: el cliente OpenAI (`openai`) viene del módulo `tutor/openai-client.ts`
 * (Fase 2) — NO se duplica el SDK ni la config.
 */
import type { Express } from "express";
import { registerLessonsRoutes } from "./routes";

export { registerLessonsRoutes } from "./routes";
export { generateLesson } from "./generator";
export {
  getPublishedLessons,
  getAllLessons,
  getLessonByLessonId,
  createLesson,
  updateLesson,
  deleteLesson,
} from "./service";

export function registerLessonsModule(app: Express): void {
  registerLessonsRoutes(app);
}
