/**
 * Router raíz del backend tutorai.
 *
 * Tras la Fase 8 de modularización (2026-05-14), este archivo NO contiene
 * lógica de negocio ni handlers — solo cablea los módulos del feature stack.
 * El último que faltaba — `auth` — ya vive en `server/modules/auth/`. Ya no
 * hay imports a `./auth`, `./storage` u otros archivos legacy del server raíz
 * desde acá.
 *
 * El orden de registro IMPORTA: `auth` instala session + Passport como
 * middleware de Express y todos los módulos siguientes asumen que
 * `req.isAuthenticated()` y `req.user` están disponibles. Mantener auth
 * primero.
 *
 * Para agregar un feature nuevo: crear `server/modules/<nombre>/` siguiendo
 * el patrón de `auth/` o `admin_progress/`, importar el `registerXxxModule`
 * acá, y agregarlo a la lista de abajo.
 */
import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerAuthModule } from "./modules/auth";
import { registerNewsModule } from "./modules/news";
import { registerTutorModule } from "./modules/tutor";
import { registerLessonsModule } from "./modules/lessons";
import { registerProgressModule } from "./modules/progress";
import { registerAdminUsersModule } from "./modules/admin_users";
import { registerAdminProgressModule } from "./modules/admin_progress";
import { registerHealthModule } from "./modules/health";

export async function registerRoutes(app: Express): Promise<Server> {
  registerAuthModule(app);
  registerNewsModule(app);
  registerTutorModule(app);
  registerLessonsModule(app);
  registerProgressModule(app);
  registerAdminUsersModule(app);
  registerAdminProgressModule(app);
  registerHealthModule(app);

  return createServer(app);
}
