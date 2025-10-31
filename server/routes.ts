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
  type GenerateLessonResponse,
  type InsertUser
} from "@shared/schema";
import { storage } from "./storage";
import { setupAuth } from "./auth";

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
  // Setup authentication routes: /api/register, /api/login, /api/logout, /api/user
  // Reference: blueprint:javascript_auth_all_persistance
  setupAuth(app);
  
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
      let usedProvider = "openai";

      const chatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        ...(system ? [{ role: "system" as const, content: system }] : []),
        ...messages.map(m => ({ role: m.role as "system" | "user" | "assistant", content: m.content })),
      ];

      try {
        // Try OpenAI first
        const response = await openai.chat.completions.create({
          model: "gpt-5", // Using gpt-5 released August 7, 2025
          messages: chatMessages,
          max_completion_tokens: 8192,
        });

        reply = response.choices[0]?.message?.content || "Lo siento, no pude generar una respuesta.";
      } catch (openaiError: any) {
        console.log("OpenAI error, attempting Gemini fallback:", openaiError.code || openaiError.message);
        
        // If content filter or any OpenAI error, fallback to Gemini
        if (geminiClient) {
          try {
            const geminiModel = geminiClient.getGenerativeModel({ model: "gemini-2.5-flash" });
            
            const geminiMessages = chatMessages
              .filter(m => m.role !== "system")
              .map(m => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }]
              }));

            const systemInstruction = chatMessages.find(m => m.role === "system")?.content;

            const geminiResponse = await geminiModel.generateContent({
              contents: geminiMessages,
              systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
              generationConfig: {
                maxOutputTokens: 8192,
                temperature: 0.7,
              }
            });

            reply = geminiResponse.response.text();
            usedProvider = "gemini";
            console.log("Successfully used Gemini fallback");
          } catch (geminiError: any) {
            console.error("Gemini fallback also failed:", geminiError);
            // Both failed - return a friendly default message instead of throwing
            const isContentFilter = openaiError.code === "content_filter" || openaiError.message?.includes("content") || openaiError.message?.includes("filter");
            reply = isContentFilter 
              ? "Perfecto, entiendo. ¿Podrías darme más detalles sobre el proyecto?"
              : "¡Claro! Cuéntame más sobre lo que necesitas.";
            usedProvider = "fallback";
          }
        } else {
          // No Gemini available - use friendly fallback
          const isContentFilter = openaiError.code === "content_filter" || openaiError.message?.includes("content") || openaiError.message?.includes("filter");
          reply = isContentFilter 
            ? "Entendido. ¿Puedes contarme más sobre el público objetivo?"
            : "¡Perfecto! ¿Qué más información puedes compartir?";
          usedProvider = "fallback";
          console.log("Using fallback message, no Gemini API key available");
        }
      }

      const responseData: TutorResponse = { reply };
      res.json(responseData);

    } catch (error: any) {
      console.error("Tutor API unexpected error:", error);
      // Last resort - return a valid response instead of 500
      res.json({ 
        reply: "Lo siento, tuve un problema técnico. ¿Podrías repetir tu última respuesta?"
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
  
  // Get all published lessons (for students)
  app.get("/api/lessons", async (_req, res) => {
    try {
      const lessons = await storage.getPublishedLessons();
      res.json(lessons);
    } catch (error: any) {
      console.error("Failed to fetch lessons:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  // Get all lessons including unpublished (for admin)
  app.get("/api/admin/lessons", async (_req, res) => {
    try {
      const lessons = await storage.getAllLessons();
      res.json(lessons);
    } catch (error: any) {
      console.error("Failed to fetch admin lessons:", error);
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

  // Generate lesson content automatically using AI - ENHANCED VERSION
  app.post("/api/lessons/generate", async (req, res) => {
    try {
      const parsed = generateLessonRequestSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid generation request", 
          details: parsed.error.format() 
        });
      }

      const { 
        title, 
        age, 
        objectives, 
        lang,
        audience = "children",
        duration = 30,
        level = "beginner",
        type = "mixed",
        generateImages = true
      } = parsed.data;

      // Calculate number of modules based on duration
      const moduleCount = Math.max(1, Math.floor(duration / 15)); // 1 module per 15 minutes
      const minutesPerModule = Math.floor(duration / moduleCount);

      // Determine audience description
      const audienceMap = {
        children: "niños de 7-9 años",
        teens: "adolescentes de 13-17 años",
        adults: "adultos (18+ años)",
        professional: "profesionales y especialistas"
      };
      const audienceDesc = audienceMap[audience] || audienceMap.children;

      // Determine lesson type mix
      const typeMix = type === "theory" ? "80% teoría, 20% práctica" :
                      type === "practice" ? "30% teoría, 70% práctica" :
                      "50% teoría, 50% práctica";

      // Create a comprehensive prompt for generating modular, interactive lessons
      const prompt = `Eres un experto diseñador de contenido educativo creando una lección sobre Inteligencia Artificial.

METADATOS DE LA LECCIÓN:
- Título: "${title}"
- Audiencia: ${audienceDesc}
- Duración total: ${duration} minutos
- Nivel: ${level}
- Tipo: ${type} (${typeMix})
- Idioma: ${lang}

OBJETIVOS DE APRENDIZAJE:
${objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

ESTRUCTURA REQUERIDA:
Crea ${moduleCount} módulos de aproximadamente ${minutesPerModule} minutos cada uno. Cada módulo debe tener:
- Un título descriptivo
- Una descripción breve
- Un tipo apropiado (introduction, theory, practice, project, assessment, conclusion)
- Un timeline con items variados

TIPOS DE ITEMS DISPONIBLES (usa TODOS estos tipos para crear lecciones dinámicas):

1. **theory_block**: Bloques de teoría con contenido rico
   - Usa para explicaciones conceptuales profundas
   - Incluye keyPoints (3-5 puntos clave)
   - Agrega imagePrompt para ilustraciones conceptuales

2. **tutor_say**: Mensajes del tutor (usa moderadamente, prefiere theory_block para contenido extenso)
   - Mensajes cortos y motivadores
   - role: "guide" o "coach"

3. **show_image**: Imágenes ilustrativas
   - Usa imagePrompt: "descripción detallada de la imagen" 
   - La imagen se generará automáticamente

4. **comparison**: Comparaciones lado a lado (NUEVO)
   - Perfecto para contrastar conceptos (GPT vs Gemini, antes vs después, etc.)
   - Incluye leftSide y rightSide con título, content, e imagePrompt

5. **quiz**: Preguntas de opción múltiple
   - 4 opciones cada una
   - Incluye explanation (por qué la respuesta es correcta)

6. **prompt_editor**: Editor de prompts interactivo (NUEVO - ideal para práctica)
   - challenge: qué debe lograr el estudiante
   - star terPrompt: prompt inicial para modificar
   - hints: pistas para ayudar
   - expectedConcepts: palabras clave que debe incluir

7. **chat_simulator**: Simulador de chat con IA (NUEVO - muy interactivo)
   - scenario: contexto de la simulación
   - systemPrompt: cómo debe comportarse la IA
   - expectedTopics: temas que el estudiante debe cubrir
   - minMessages: número mínimo de mensajes

8. **timeline_interactive**: Línea de tiempo interactiva (NUEVO)
   - Perfecto para historia de la IA, evolución de modelos
   - events: array de eventos con fecha, título, descripción

9. **hotspot_diagram**: Diagrama con puntos clicables (NUEVO)
   - imageSrc o imagePrompt para el diagrama base
   - hotspots: puntos interactivos con información

10. **mini_project**: Mini proyecto guiado (NUEVO - para práctica profunda)
    - description: qué van a construir
    - steps: pasos del proyecto con hints
    - estimatedTime: minutos estimados
    - difficulty: beginner/intermediate/advanced

11. **reflection**: Prompts de reflexión
    - Para que piensen sobre lo aprendido

DISTRIBUCIÓN RECOMENDADA POR MÓDULO:
- Módulo 1 (Introducción): theory_block, show_image, quiz ligero
- Módulos intermedios (Teoría): theory_block, comparison, timeline_interactive, quiz
- Módulos de práctica: prompt_editor, chat_simulator, mini_project
- Módulo final: mini_project o assessment con quiz final

FORMATO JSON ESPERADO:
{
  "modules": [
    {
      "id": "module-1",
      "title": "Introducción a...",
      "description": "En este módulo...",
      "estimatedMinutes": ${minutesPerModule},
      "type": "introduction",
      "timeline": [
        {"type": "theory_block", "title": "...", "content": "...", "keyPoints": ["...", "..."], "imagePrompt": "..."},
        {"type": "comparison", "title": "...", "leftSide": {...}, "rightSide": {...}},
        {"type": "quiz", "question": "...", "choices": [...], "answer": 0, "explanation": "..."}
      ]
    }
  ]
}

IMPORTANTE:
- Cada módulo debe tener 4-8 items en su timeline
- Varía los tipos de items para mantener el interés
- Para ${audience}, ajusta el lenguaje y complejidad apropiadamente
- Nivel ${level}: ${level === "beginner" ? "conceptos básicos, ejemplos simples" : level === "intermediate" ? "profundiza conceptos, casos prácticos" : "teoría avanzada, proyectos complejos"}
- Incluye al menos 1 prompt_editor y 1 chat_simulator para práctica interactiva
- Los mini_project son ideales para módulos de práctica final
- USA imagePrompt en lugar de src para que se generen imágenes automáticamente
- El contenido debe ser educativo, preciso y adaptado a ${audienceDesc}

Responde SOLO con el JSON de los módulos, sin texto adicional.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { 
            role: "system", 
            content: "Eres un diseñador experto de contenido educativo interactivo. Generas JSON estructurado válido con lecciones modulares y variadas. Siempre incluyes los nuevos tipos de items interactivos (prompt_editor, chat_simulator, comparison, timeline_interactive, mini_project) para crear experiencias de aprendizaje dinámicas." 
          },
          { role: "user", content: prompt }
        ],
        max_completion_tokens: 16384,
        response_format: { type: "json_object" },
      });

      const generatedContent = response.choices[0]?.message?.content;
      if (!generatedContent) {
        throw new Error("No se pudo generar contenido");
      }

      const parsedContent: GenerateLessonResponse = JSON.parse(generatedContent);
      
      // Process modules to handle image generation
      if (parsedContent.modules && generateImages) {
        parsedContent.modules = parsedContent.modules.map(module => ({
          ...module,
          timeline: module.timeline.map((item: any) => {
            // Handle show_image with imagePrompt
            if (item.type === "show_image" && item.imagePrompt) {
              return {
                ...item,
                src: getEducationalImage(item.imagePrompt),
              };
            }
            // Handle theory_block with imagePrompt
            if (item.type === "theory_block" && item.imagePrompt) {
              return {
                ...item,
                imageSrc: getEducationalImage(item.imagePrompt),
              };
            }
            // Handle comparison with imagePrompts
            if (item.type === "comparison") {
              return {
                ...item,
                leftSide: item.leftSide.imagePrompt ? {
                  ...item.leftSide,
                  imageSrc: getEducationalImage(item.leftSide.imagePrompt),
                } : item.leftSide,
                rightSide: item.rightSide.imagePrompt ? {
                  ...item.rightSide,
                  imageSrc: getEducationalImage(item.rightSide.imagePrompt),
                } : item.rightSide,
              };
            }
            // Handle timeline events with imagePrompts
            if (item.type === "timeline_interactive" && item.events) {
              return {
                ...item,
                events: item.events.map((event: any) => 
                  event.imagePrompt ? {
                    ...event,
                    imageSrc: getEducationalImage(event.imagePrompt),
                  } : event
                ),
              };
            }
            // Handle hotspot_diagram with imagePrompt
            if (item.type === "hotspot_diagram" && item.imagePrompt) {
              return {
                ...item,
                imageSrc: getEducationalImage(item.imagePrompt),
              };
            }
            return item;
          }),
        }));
      }
      
      res.json(parsedContent);
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

  // Admin: User Management Endpoints
  
  // Get all users (admin only)
  app.get("/api/admin/users", async (_req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      // Remove password from response
      const sanitizedUsers = allUsers.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Create new user (admin only)
  app.post("/api/admin/users", async (req, res) => {
    try {
      const { username, password, name, role } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "El nombre de usuario ya existe" });
      }

      // Hash password using same format as auth.ts
      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);
      
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

      const user = await storage.createUser({
        username,
        password: hashedPassword,
        role: role || "student",
        name,
      });

      // Remove password from response
      const { password: _, ...sanitizedUser } = user;
      res.status(201).json(sanitizedUser);
    } catch (error: any) {
      console.error("Failed to create user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Update user (admin only)
  app.put("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { name, role, password } = req.body;
      
      const updateData: Partial<InsertUser> = {};
      if (name !== undefined) updateData.name = name;
      if (role !== undefined) updateData.role = role;
      
      if (password) {
        // Hash new password if provided using same format as auth.ts
        const { scrypt, randomBytes } = await import("crypto");
        const { promisify } = await import("util");
        const scryptAsync = promisify(scrypt);
        
        const salt = randomBytes(16).toString("hex");
        const buf = (await scryptAsync(password, salt, 64)) as Buffer;
        updateData.password = `${buf.toString("hex")}.${salt}`;
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const { password: _, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error: any) {
      console.error("Failed to update user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json({ ok: true });
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Admin: Progress Tracking Endpoint
  app.get("/api/admin/progress", async (_req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allLessons = await storage.getAllLessons();
      const publishedLessons = allLessons.filter(l => l.published);
      
      const progressData = [];
      
      for (const user of allUsers) {
        if (user.role !== "student") continue;
        
        let completedCount = 0;
        let totalScore = 0;
        let quizCount = 0;
        let lastActivity = null;
        
        for (const lesson of publishedLessons) {
          const progress = await storage.getUserProgress(user.id.toString(), lesson.lessonId);
          
          if (progress) {
            if (progress.completed) completedCount++;
            
            // Handle quiz scores - they might be stored as numbers or objects {index, score}
            if (progress.quizScores && Array.isArray(progress.quizScores) && progress.quizScores.length > 0) {
              try {
                const scores = progress.quizScores.map(s => {
                  // Handle both object format {index, score} and legacy number format
                  return typeof s === 'object' && s !== null && 'score' in s ? s.score : (typeof s === 'number' ? s : 0);
                });
                
                if (scores.length > 0) {
                  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                  totalScore += avgScore;
                  quizCount++;
                }
              } catch (error) {
                // Skip malformed quiz scores
                console.warn(`Malformed quiz scores for user ${user.id}, lesson ${lesson.lessonId}`, error);
              }
            }
            
            if (progress.updatedAt && (!lastActivity || new Date(progress.updatedAt) > new Date(lastActivity))) {
              lastActivity = progress.updatedAt;
            }
          }
        }
        
        progressData.push({
          userId: user.id,
          userName: user.name || user.username,
          username: user.username,
          lessonsCompleted: completedCount,
          totalLessons: publishedLessons.length,
          averageScore: quizCount > 0 ? (totalScore / quizCount) * 100 : 0,
          lastActivity: lastActivity,
        });
      }
      
      res.json(progressData);
    } catch (error: any) {
      console.error("Failed to fetch progress data:", error);
      res.status(500).json({ error: "Failed to fetch progress data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
