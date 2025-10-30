import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { 
  tutorRequestSchema, 
  gradeRequestSchema,
  insertLessonSchema,
  insertUserProgressSchema,
  generateLessonRequestSchema,
  type TutorResponse,
  type GradeResponse,
  type Lesson,
  type GenerateLessonResponse
} from "@shared/schema";
import { storage } from "./storage";

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

  // Lesson CRUD endpoints
  
  // Get all published lessons
  app.get("/api/lessons", async (_req, res) => {
    try {
      const lessons = await storage.getPublishedLessons();
      res.json(lessons);
    } catch (error: any) {
      console.error("Failed to fetch lessons:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  // Get single lesson by lessonId
  app.get("/api/lessons/:lessonId", async (req, res) => {
    try {
      const lesson = await storage.getLessonByLessonId(req.params.lessonId);
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
  app.post("/api/lessons", async (req, res) => {
    try {
      const parsed = insertLessonSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid lesson data", 
          details: parsed.error.format() 
        });
      }

      const lesson = await storage.createLesson(parsed.data);
      res.status(201).json(lesson);
    } catch (error: any) {
      console.error("Failed to create lesson:", error);
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  // Update lesson
  app.put("/api/lessons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid lesson ID" });
      }

      const parsed = insertLessonSchema.partial().safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid lesson data", 
          details: parsed.error.format() 
        });
      }

      const lesson = await storage.updateLesson(id, parsed.data);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      res.json(lesson);
    } catch (error: any) {
      console.error("Failed to update lesson:", error);
      res.status(500).json({ error: "Failed to update lesson" });
    }
  });

  // Delete lesson
  app.delete("/api/lessons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid lesson ID" });
      }

      const success = await storage.deleteLesson(id);
      if (!success) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to delete lesson:", error);
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });

  // Helper function to map image descriptions to generated images
  const getEducationalImage = (description: string): string => {
    const lowerDesc = description.toLowerCase();
    
    // Map keywords to appropriate generated images
    if (lowerDesc.includes('robot') || lowerDesc.includes('profesor') || lowerDesc.includes('teacher') || lowerDesc.includes('clase')) {
      return '/attached_assets/generated_images/Robot_teacher_with_diverse_children_bc4de1b4.png';
    } else if (lowerDesc.includes('cómo funciona') || lowerDesc.includes('how ai works') || lowerDesc.includes('diagrama') || lowerDesc.includes('explicación')) {
      return '/attached_assets/generated_images/How_AI_works_simple_diagram_62b5bad7.png';
    } else if (lowerDesc.includes('chatgpt') && !lowerDesc.includes('gemini') && !lowerDesc.includes('vs')) {
      return '/attached_assets/generated_images/ChatGPT_friendly_character_illustration_431b9259.png';
    } else if (lowerDesc.includes('gemini') && !lowerDesc.includes('chatgpt') && !lowerDesc.includes('vs')) {
      return '/attached_assets/generated_images/Gemini_friendly_star_character_8a90e0c2.png';
    } else if ((lowerDesc.includes('chatgpt') && lowerDesc.includes('gemini')) || lowerDesc.includes('comparación') || lowerDesc.includes('vs') || lowerDesc.includes('diferencia')) {
      return '/attached_assets/generated_images/ChatGPT_vs_Gemini_comparison_illustration_b8018ed9.png';
    }
    
    // Default to the AI explanation diagram
    return '/attached_assets/generated_images/How_AI_works_simple_diagram_62b5bad7.png';
  };

  // Generate lesson content automatically using AI
  app.post("/api/lessons/generate", async (req, res) => {
    try {
      const parsed = generateLessonRequestSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid generation request", 
          details: parsed.error.format() 
        });
      }

      const { title, age, objectives, lang } = parsed.data;

      // Create a detailed prompt for the AI to generate structured lesson content
      const prompt = `Eres un experto en educación infantil creando lecciones sobre Inteligencia Artificial para niños de ${age} años.

Título de la lección: "${title}"
Objetivos de aprendizaje:
${objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Genera una lección interactiva y educativa con los siguientes elementos en JSON:

1. Comienza con 2-3 mensajes del tutor (type: "tutor_say") explicando conceptos básicos de forma amigable y simple
2. Incluye 2-3 quizzes (type: "quiz") con preguntas de opción múltiple relacionadas al tema (4 opciones cada una)
3. Agrega 1-2 prompts de reflexión (type: "reflection") para que los niños piensen sobre lo aprendido
4. Incluye marcadores de imágenes (type: "show_image") donde se necesiten ilustraciones (usa src: "GENERATE_IMAGE: <descripción detallada de la imagen>")

Formato JSON esperado:
{
  "timeline": [
    {"type": "tutor_say", "text": "...", "voice": true, "role": "guide"},
    {"type": "quiz", "question": "...", "choices": ["opción 1", "opción 2", "opción 3", "opción 4"], "answer": 0},
    {"type": "show_image", "src": "GENERATE_IMAGE: ilustración colorida de...", "alt": "..."},
    {"type": "reflection", "prompt": "..."}
  ]
}

IMPORTANTE:
- Los mensajes del tutor deben ser cortos, claros y motivadores
- Las preguntas de quiz deben estar adaptadas a la edad ${age}
- Usa lenguaje simple y ejemplos concretos
- Para cada imagen, describe detalladamente lo que debe mostrar (será generada automáticamente)
- Incluye al menos 8-10 items en total en el timeline
- Varía el tipo de items para mantener el interés

Responde SOLO con el JSON, sin texto adicional.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { 
            role: "system", 
            content: "Eres un experto diseñador de contenido educativo para niños. Generas JSON estructurado válido siguiendo exactamente el formato solicitado." 
          },
          { role: "user", content: prompt }
        ],
        max_completion_tokens: 8192,
        response_format: { type: "json_object" },
      });

      const generatedContent = response.choices[0]?.message?.content;
      if (!generatedContent) {
        throw new Error("No se pudo generar contenido");
      }

      const parsedContent: GenerateLessonResponse = JSON.parse(generatedContent);
      
      // Process timeline to replace GENERATE_IMAGE markers with actual image paths
      const processedTimeline = parsedContent.timeline.map((item: any) => {
        if (item.type === "show_image" && item.src?.startsWith("GENERATE_IMAGE:")) {
          const description = item.src.replace("GENERATE_IMAGE:", "").trim();
          const imagePath = getEducationalImage(description);
          
          return {
            ...item,
            src: imagePath,
          };
        }
        return item;
      });
      
      res.json({ timeline: processedTimeline });
    } catch (error: any) {
      console.error("Failed to generate lesson:", error);
      res.status(500).json({ 
        error: "Failed to generate lesson",
        message: error.message 
      });
    }
  });

  // User Progress endpoints
  
  // Get user progress for a specific lesson
  app.get("/api/progress/:userId/:lessonId", async (req, res) => {
    try {
      const { userId, lessonId } = req.params;
      const progress = await storage.getUserProgress(userId, lessonId);
      
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
          details: parsed.error.format() 
        });
      }

      const { userId, lessonId, ...progressData } = parsed.data;
      
      // Check if progress already exists
      const existing = await storage.getUserProgress(userId, lessonId);
      
      if (existing) {
        // Update existing progress with full data
        const updated = await storage.updateUserProgress(existing.id, {
          userId,
          lessonId,
          ...progressData,
        });
        return res.json(updated);
      } else {
        // Create new progress
        const created = await storage.createUserProgress(parsed.data);
        return res.status(201).json(created);
      }
    } catch (error: any) {
      console.error("Failed to save progress:", error);
      res.status(500).json({ error: "Failed to save progress" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
