/**
 * Router raíz del backend tutorai.
 *
 * Tras la Fase 7 de modularización (2026-05-14), este archivo NO contiene
 * lógica de negocio ni handlers — solo cablea los módulos del feature stack.
 * Cada módulo vive en `server/modules/<nombre>/` con su propio README.
 *
 * Para agregar un feature nuevo: crear `server/modules/<nombre>/` siguiendo
 * el patrón de `admin_progress/` o `health/`, importar el `registerXxxModule`
 * acá, y agregarlo a la lista de abajo.
 */
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { registerNewsModule } from "./modules/news";
import { registerTutorModule } from "./modules/tutor";
import { registerLessonsModule } from "./modules/lessons";
import { registerProgressModule } from "./modules/progress";
import { registerAdminUsersModule } from "./modules/admin_users";
import { registerAdminProgressModule } from "./modules/admin_progress";
import { registerHealthModule } from "./modules/health";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  registerNewsModule(app);
  registerTutorModule(app);
  registerLessonsModule(app);
  registerProgressModule(app);
  registerAdminUsersModule(app);
  registerAdminProgressModule(app);
  registerHealthModule(app);

  return createServer(app);
}
