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
import {
  getUserProgress,
  createUserProgress,
  updateUserProgress,
} from "./service";

export function registerProgressRoutes(app: Express): void {
  // Get user progress for a specific lesson
  app.get("/api/progress/:userId/:lessonId", async (req, res) => {
    try {
      const { userId, lessonId } = req.params;
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
  app.post("/api/progress", async (req, res) => {
    try {
      const parsed = insertUserProgressSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid progress data",
          details: parsed.error.format(),
        });
      }

      const { userId, lessonId, ...progressData } = parsed.data;

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
        // Create new progress
        const created = await createUserProgress(parsed.data);
        return res.status(201).json(created);
      }
    } catch (error: any) {
      console.error("Failed to save progress:", error);
      res.status(500).json({ error: "Failed to save progress" });
    }
  });
}
