import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { registerNewsModule } from "./modules/news";
import { registerTutorModule } from "./modules/tutor";
import { registerLessonsModule } from "./modules/lessons";
import { registerProgressModule } from "./modules/progress";
import { registerAdminUsersModule } from "./modules/admin_users";

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
