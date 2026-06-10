/**
 * HTTP routes del módulo lessons.
 *
 * Endpoints:
 *   - GET    /api/lessons              — published lessons (students)
 *   - GET    /api/admin/lessons        — all lessons including unpublished
 *   - GET    /api/lessons/:lessonId    — single lesson by lessonId (string)
 *   - POST   /api/lessons              — create
 *   - PUT    /api/lessons/:id          — update (numeric id)
 *   - DELETE /api/lessons/:id          — delete (numeric id)
 *   - POST   /api/lessons/generate     — generate via OpenAI + persist
 *
 * Mantiene el shape de response exacto que ya consume el frontend.
 */
import type { Express } from "express";
import {
  insertLessonSchema,
  generateLessonRequestSchema,
} from "@shared/schema";
import { requireAuth, requireAdmin } from "../../core/auth-middleware";
import {
  getPublishedLessons,
  getAllLessons,
  getLessonByLessonId,
  createLesson,
  updateLesson,
  deleteLesson,
} from "./service";
import { generateLesson } from "./generator";

export function registerLessonsRoutes(app: Express): void {
  // List published lessons (students)
  app.get("/api/lessons", requireAuth, async (_req, res) => {
    try {
      const lessons = await getPublishedLessons();
      res.json(lessons);
    } catch (error: any) {
      console.error("Failed to fetch lessons:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  // List all lessons (admin, includes unpublished)
  app.get("/api/admin/lessons", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const lessons = await getAllLessons();
      res.json(lessons);
    } catch (error: any) {
      console.error("Failed to fetch admin lessons:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  // Get single lesson by lessonId (string)
  app.get("/api/lessons/:lessonId", requireAuth, async (req, res) => {
    try {
      const lesson = await getLessonByLessonId(req.params.lessonId);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error: any) {
      console.error("Failed to fetch lesson:", error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  // Create new lesson
  app.post("/api/lessons", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertLessonSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid lesson data",
          details: parsed.error.format(),
        });
      }

      const lesson = await createLesson(parsed.data);
      res.status(201).json(lesson);
    } catch (error: any) {
      console.error("Failed to create lesson:", error);
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  // Update lesson (numeric id)
  app.put("/api/lessons/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid lesson ID" });
      }

      const parsed = insertLessonSchema.partial().safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid lesson data",
          details: parsed.error.format(),
        });
      }

      const lesson = await updateLesson(id, parsed.data);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      res.json(lesson);
    } catch (error: any) {
      console.error("Failed to update lesson:", error);
      res.status(500).json({ error: "Failed to update lesson" });
    }
  });

  // Delete lesson (numeric id)
  app.delete("/api/lessons/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid lesson ID" });
      }

      const success = await deleteLesson(id);
      if (!success) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to delete lesson:", error);
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });

  // Generate lesson content automatically using AI
  app.post("/api/lessons/generate", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = generateLessonRequestSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid generation request",
          details: parsed.error.format(),
        });
      }

      const result = await generateLesson(parsed.data);
      res.json(result);
    } catch (error: any) {
      console.error("Failed to generate lesson:", error);
      res.status(500).json({
        error: "Failed to generate lesson",
        message: error.message,
      });
    }
  });
}
