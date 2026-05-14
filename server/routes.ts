import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  insertUserProgressSchema,
  type InsertUser
} from "@shared/schema";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { registerNewsModule } from "./modules/news";
import { registerTutorModule } from "./modules/tutor";
import { registerLessonsModule } from "./modules/lessons";

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
