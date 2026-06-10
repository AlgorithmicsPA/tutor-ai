/**
 * HTTP routes del módulo admin_progress (admin: resumen de progreso por user).
 *
 * Endpoint:
 *   - GET /api/admin/progress  — lista resumen de progreso de todos los students
 *
 * Mantiene el shape de response exacto que consume el admin frontend
 * (`/admin/progress`).
 */
import type { Express } from "express";
import { requireAuth, requireAdmin } from "../../core/auth-middleware";
import { getProgressSummary } from "./service";

export function registerAdminProgressRoutes(app: Express): void {
  // Admin: Progress Tracking Endpoint
  app.get("/api/admin/progress", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const progressData = await getProgressSummary();
      res.json(progressData);
    } catch (error: any) {
      console.error("Failed to fetch progress data:", error);
      res.status(500).json({ error: "Failed to fetch progress data" });
    }
  });
}
