/**
 * HTTP routes del módulo progress.
 *
 * Endpoints:
 *   - GET  /api/progress/:userId/:lessonId — devuelve progreso (o vacío si no existe)
 *   - POST /api/progress                    — upsert de progreso (crea o actualiza)
 *
 * Mantiene el shape de response exacto que ya consume el frontend.
 */
import type { Express } from "express";
import { insertUserProgressSchema } from "@shared/schema";
import { requireAuth } from "../../core/auth-middleware";
import {
  getUserProgress,
  createUserProgress,
  updateUserProgress,
} from "./service";

export function registerProgressRoutes(app: Express): void {
  // Get user progress for a specific lesson
  app.get("/api/progress/:userId/:lessonId", requireAuth, async (req, res) => {
    try {
      const { userId, lessonId } = req.params;

      // IDOR guard: solo el dueño (o un admin) puede leer este progreso.
      // El frontend pasa siempre `user.id.toString()` (ver lesson-view.tsx),
      // así que para el flujo legítimo esto no cambia nada.
      const authUser = req.user as { id: number; role?: string };
      if (authUser.role !== "admin" && String(authUser.id) !== String(userId)) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      const progress = await getUserProgress(userId, lessonId);

      if (!progress) {
        // Return empty progress if not found
        return res.json({
          userId,
          lessonId,
          quizScores: [],
          completedItems: [],
          lastPosition: 0,
          completed: false,
        });
      }

      res.json(progress);
    } catch (error: any) {
      console.error("Failed to fetch progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // Create or update user progress (upsert)
  app.post("/api/progress", requireAuth, async (req, res) => {
    try {
      const parsed = insertUserProgressSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid progress data",
          details: parsed.error.format(),
        });
      }

      // IDOR guard: el progreso se atribuye SIEMPRE al usuario autenticado.
      // Un usuario normal no puede falsificar el progreso de otro vía `userId`
      // del body. El frontend ya manda su propio id (ver LessonRenderer.tsx),
      // así que esto es transparente para el flujo legítimo. Un admin puede
      // seguir apuntando a cualquier `userId`.
      const authUser = req.user as { id: number; role?: string };
      const ownUserId = String(authUser.id);
      const { userId: bodyUserId, lessonId, ...progressData } = parsed.data;
      const userId =
        authUser.role === "admin" ? bodyUserId : ownUserId;

      // Check if progress already exists
      const existing = await getUserProgress(userId, lessonId);

      if (existing) {
        // Update existing progress with full data
        const updated = await updateUserProgress(existing.id, {
          userId,
          lessonId,
          ...progressData,
        });
        return res.json(updated);
      } else {
        // Create new progress (con el userId resuelto, no el del body crudo)
        const created = await createUserProgress({
          userId,
          lessonId,
          ...progressData,
        });
        return res.status(201).json(created);
      }
    } catch (error: any) {
      console.error("Failed to save progress:", error);
      res.status(500).json({ error: "Failed to save progress" });
    }
  });
}
