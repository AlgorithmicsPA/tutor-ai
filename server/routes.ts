import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { registerNewsModule } from "./modules/news";
import { registerTutorModule } from "./modules/tutor";
import { registerLessonsModule } from "./modules/lessons";
import { registerProgressModule } from "./modules/progress";
import { registerAdminUsersModule } from "./modules/admin_users";
import { registerAdminProgressModule } from "./modules/admin_progress";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes: /api/register, /api/login, /api/logout, /api/user
  // Reference: blueprint:javascript_auth_all_persistance
  setupAuth(app);

  // AI Weekly News routes (módulo aislado, ver server/modules/news/README.md)
  registerNewsModule(app);

  // AI Tutor chat + Quiz grading (módulo aislado, ver server/modules/tutor/README.md)
  registerTutorModule(app);

  // Lessons CRUD + generación con IA (módulo aislado, ver server/modules/lessons/README.md)
  registerLessonsModule(app);

  // User Progress tracking (módulo aislado, ver server/modules/progress/README.md)
  registerProgressModule(app);

  // Admin: user CRUD (módulo aislado, ver server/modules/admin_users/README.md)
  registerAdminUsersModule(app);

  // Admin: progress summary (módulo aislado, ver server/modules/admin_progress/README.md)
  registerAdminProgressModule(app);

  // Health check endpoint
  app.get("/healthz", (_req, res) => {
    res.json({
      ok: true,
      providers: {
        openai: !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        gemini: !!process.env.GEMINI_API_KEY,
      }
    });
  });

  // Lesson CRUD endpoints — MOVED to server/modules/lessons/ (Fase 3, 2026-05-14)
  // User Progress endpoints — MOVED to server/modules/progress/ (Fase 4, 2026-05-14)
  // Admin User Management — MOVED to server/modules/admin_users/ (Fase 5, 2026-05-14)
  // Admin Progress Tracking — MOVED to server/modules/admin_progress/ (Fase 6, 2026-05-14)

  const httpServer = createServer(app);
  return httpServer;
}
