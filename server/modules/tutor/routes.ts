/**
 * HTTP routes del módulo tutor.
 *
 * Endpoints:
 *   - POST /api/tutor  — chat con el tutor IA (OpenAI → fallback Gemini)
 *   - POST /api/grade  — score de respuestas tipo quiz
 *
 * Mantiene el shape de response exacto que ya consume el frontend.
 */
import type { Express } from "express";
import {
  tutorRequestSchema,
  gradeRequestSchema,
  type TutorResponse,
  type GradeResponse,
} from "@shared/schema";
import { requireAuth } from "../../core/auth-middleware";
import { runTutorChat, scoreQuiz } from "./service";

export function registerTutorRoutes(app: Express): void {
  // AI Tutor chat endpoint
  app.post("/api/tutor", requireAuth, async (req, res) => {
    try {
      const parsed = tutorRequestSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: parsed.error.format(),
        });
      }

      const { messages, system } = parsed.data;

      const { reply, usedProvider } = await runTutorChat({ messages, system });

      // El tutor NO puede fallar en HTTP 200. Cuando ningún proveedor contestó,
      // `runTutorChat` devuelve un texto enlatado que se lee igual que una respuesta real:
      // ese era el motivo de que el chat se rompiera en silencio durante días (nginx veía
      // 200, el guardian veía el proceso online, nadie miraba el cuerpo). El texto se sigue
      // mandando para que el frontend tenga algo que mostrar, pero el status dice la verdad
      // y el log queda grepeable.
      if (usedProvider === "fallback") {
        console.error(
          "[tutor] LLM_UNAVAILABLE: ningun proveedor contesto, se responde 503 en vez de texto enlatado",
        );
        return res.status(503).json({ error: "llm_unavailable", reply });
      }

      const responseData: TutorResponse = { reply };
      res.json(responseData);
    } catch (error: any) {
      console.error("[tutor] LLM_UNAVAILABLE (error inesperado):", error);
      res.status(503).json({
        error: "llm_unavailable",
        reply: "Lo siento, tuve un problema técnico. ¿Podrías repetir tu última respuesta?",
      });
    }
  });

  // Quiz grading endpoint
  app.post("/api/grade", requireAuth, (req, res) => {
    try {
      const parsed = gradeRequestSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: parsed.error.format(),
        });
      }

      const { itemType, answerIndex, userIndex } = parsed.data;

      let score = 0;
      if (itemType === "quiz") {
        score = scoreQuiz(answerIndex, userIndex);
      }

      const responseData: GradeResponse = { score };
      res.json(responseData);
    } catch (error: any) {
      console.error("Grade API error:", error);
      res.status(500).json({
        error: "Failed to grade response",
        message: error.message,
      });
    }
  });
}
