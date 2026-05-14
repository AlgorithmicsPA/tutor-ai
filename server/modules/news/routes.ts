import type { Express } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { AVAILABLE_TOPICS, TOPIC_LABELS } from "@shared/schema";
import { weekOfMonday } from "./rss";
import { runWeeklyFetch } from "./job";
import { generateNewsClass } from "./generator";
import { scoreNewsForUser } from "./topics";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ error: "No autenticado" });
  }
  next();
}

const setInterestsSchema = z.object({
  topics: z.array(z.string()).max(AVAILABLE_TOPICS.length),
  custom: z.array(z.string().max(200)).max(10).optional(),
});

const feedbackSchema = z.object({
  newsId: z.number().optional(),
  topic: z.string().optional(),
  rating: z.enum(["loved", "meh", "boring"]),
});

export function registerNewsRoutes(app: Express) {
  // Tópicos disponibles para onboarding
  app.get("/api/news/topics", (_req, res) => {
    res.json({
      topics: AVAILABLE_TOPICS.map(id => ({ id, label: TOPIC_LABELS[id] })),
    });
  });

  // Mis intereses (preset + custom)
  app.get("/api/news/interests", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const [interests, custom] = await Promise.all([
        storage.getUserInterests(userId),
        storage.getUserCustomInterests(userId),
      ]);
      res.json({ interests, custom });
    } catch (err: any) {
      console.error("get interests:", err);
      res.status(500).json({ error: "Failed to fetch interests" });
    }
  });

  // Setear mis intereses (onboarding) — preset + textos libres
  app.post("/api/news/interests", requireAuth, async (req, res) => {
    try {
      const parsed = setInterestsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid topics" });
      }
      const userId = req.user!.id;
      const valid = parsed.data.topics.filter(t => (AVAILABLE_TOPICS as readonly string[]).includes(t));
      const [interests, custom] = await Promise.all([
        storage.setUserInterests(userId, valid),
        storage.setUserCustomInterests(userId, parsed.data.custom || []),
      ]);
      res.json({ interests, custom });
    } catch (err: any) {
      console.error("set interests:", err);
      res.status(500).json({ error: "Failed to save interests" });
    }
  });

  // Todas las noticias crudas de la semana (para la vista completa)
  app.get("/api/news/all", requireAuth, async (_req, res) => {
    try {
      const week = weekOfMonday();
      const news = await storage.getWeeklyNewsByWeek(week);
      res.json({ week, total: news.length, news });
    } catch (err: any) {
      console.error("all news error:", err);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  // Clase de noticias de la semana (genera on-demand si no existe)
  app.get("/api/news/weekly", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const week = weekOfMonday();

      // Cache por user
      const existing = await storage.getNewsClass(user.id, week);
      if (existing) {
        return res.json({ week, class: existing, cached: true });
      }

      // Asegurar que haya noticias para la semana
      let weekNews = await storage.getWeeklyNewsByWeek(week);
      if (weekNews.length < 5) {
        await runWeeklyFetch();
        weekNews = await storage.getWeeklyNewsByWeek(week);
      }

      if (weekNews.length === 0) {
        return res.status(503).json({ error: "No hay noticias disponibles esta semana, probá más tarde" });
      }

      // Ordenar por interés del user
      const interests = await storage.getUserInterests(user.id);
      const custom = await storage.getUserCustomInterests(user.id);
      const scored = weekNews
        .map(n => ({ news: n, score: scoreNewsForUser(n.topics || [], interests) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(x => x.news);

      const content = await generateNewsClass(
        user.name || user.username,
        scored,
        interests.map(i => i.topic),
        custom.map(c => c.text),
      );

      const saved = await storage.createNewsClass(user.id, week, content);
      res.json({ week, class: saved, cached: false });
    } catch (err: any) {
      console.error("weekly news error:", err);
      res.status(500).json({ error: "Failed to build weekly news", message: err.message });
    }
  });

  // Feedback de una noticia (me encantó / zafa / aburrida)
  app.post("/api/news/feedback", requireAuth, async (req, res) => {
    try {
      const parsed = feedbackSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid feedback" });
      }
      const { newsId, topic, rating } = parsed.data;
      const userId = req.user!.id;

      const fb = await storage.createNewsFeedback({ userId, newsId, topic, rating });

      // Actualizar el score de interés según el topic
      const topicsToUpdate: string[] = [];
      if (topic) topicsToUpdate.push(topic);
      if (newsId) {
        const news = await storage.getWeeklyNewsById(newsId);
        if (news?.topics) topicsToUpdate.push(...news.topics);
      }

      const delta = rating === "loved" ? 2 : rating === "meh" ? 0 : -1;
      if (delta !== 0) {
        const unique = Array.from(new Set(topicsToUpdate));
        for (const t of unique) {
          await storage.bumpUserInterestScore(userId, t, delta);
        }
      }

      res.json({ ok: true, feedback: fb });
    } catch (err: any) {
      console.error("feedback error:", err);
      res.status(500).json({ error: "Failed to save feedback" });
    }
  });

  // Endpoint interno para el cron (protegido con token)
  app.post("/api/internal/news/fetch", async (req, res) => {
    const token = req.header("x-internal-token");
    if (!token || token !== process.env.INTERNAL_CRON_TOKEN) {
      return res.status(401).json({ error: "Invalid token" });
    }
    try {
      const result = await runWeeklyFetch();
      res.json({ ok: true, ...result });
    } catch (err: any) {
      console.error("internal fetch error:", err);
      res.status(500).json({ error: err.message });
    }
  });
}
