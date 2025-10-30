import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { 
  tutorRequestSchema, 
  gradeRequestSchema,
  type TutorResponse,
  type GradeResponse 
} from "@shared/schema";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access
// without requiring your own OpenAI API key. Charges are billed to your Replit credits.
// Reference: javascript_openai_ai_integrations blueprint
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

// Gemini provider for alternative AI backend
// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user
const geminiClient = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// Scoring helper function
function scoreQuiz(answerIdx: number, userIdx: number): number {
  return answerIdx === userIdx ? 1 : 0;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
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

  // AI Tutor chat endpoint
  app.post("/api/tutor", async (req, res) => {
    try {
      const parsed = tutorRequestSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: parsed.error.format() 
        });
      }

      const { messages, provider = "openai", system } = parsed.data;

      let reply: string;

      if (provider === "gemini" && geminiClient) {
        // Use Gemini with proper SDK usage
        const model = geminiClient.getGenerativeModel({ 
          model: "gemini-2.5-flash" 
        });
        
        const content = [
          system ? `[SYSTEM]\n${system}\n\n` : "",
          ...messages.map(m => `[${m.role.toUpperCase()}] ${m.content}`)
        ].join("\n");

        const response = await model.generateContent(content);
        reply = response.response.text() || "Lo siento, no pude generar una respuesta.";
      } else {
        // Use OpenAI (default)
        const chatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          ...(system ? [{ role: "system" as const, content: system }] : []),
          ...messages.map(m => ({ role: m.role as "system" | "user" | "assistant", content: m.content })),
        ];

        const response = await openai.chat.completions.create({
          model: "gpt-5", // Using gpt-5 released August 7, 2025
          messages: chatMessages,
          max_completion_tokens: 8192,
        });

        reply = response.choices[0]?.message?.content || "Lo siento, no pude generar una respuesta.";
      }

      const responseData: TutorResponse = { reply };
      res.json(responseData);

    } catch (error: any) {
      console.error("Tutor API error:", error);
      res.status(500).json({ 
        error: "Failed to process tutor request",
        message: error.message 
      });
    }
  });

  // Quiz grading endpoint
  app.post("/api/grade", (req, res) => {
    try {
      const parsed = gradeRequestSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: parsed.error.format() 
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
        message: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
