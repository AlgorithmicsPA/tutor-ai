/**
 * Storage layer del módulo news.
 *
 * Cubre TODA la persistencia que necesita el módulo news:
 *  - User interests (`userInterests`, `userCustomInterests`)
 *  - Weekly raw news (`weeklyNews`)
 *  - News classes generadas por user (`newsClasses`)
 *  - Feedback de noticias (`newsFeedback`)
 *
 * Fase 9.5 (2026-05-14): split del storage monolítico `core/storage.ts` por
 * feature. Antes vivían dentro de `DbStorage`. Mantenemos todo agrupado bajo
 * `news/` porque comparten dominio y siempre se usan juntos (ver `news/routes.ts`,
 * `news/job.ts`).
 */
import { and, desc, eq } from "drizzle-orm";
import type {
  UserInterest,
  UserCustomInterest,
  WeeklyNews,
  InsertWeeklyNews,
  NewsClass,
  NewsClassContent,
  NewsFeedback,
  InsertNewsFeedback,
} from "@shared/schema";
import {
  userInterests,
  userCustomInterests,
  weeklyNews,
  newsClasses,
  newsFeedback,
} from "@shared/schema";
import { getDb } from "../../core/db";

// ===== User interests =====
export async function getUserInterests(userId: number): Promise<UserInterest[]> {
  return await getDb().select().from(userInterests).where(eq(userInterests.userId, userId));
}

export async function setUserInterests(
  userId: number,
  topics: string[],
): Promise<UserInterest[]> {
  await getDb().delete(userInterests).where(eq(userInterests.userId, userId));
  if (topics.length === 0) return [];
  const rows = topics.map((topic) => ({ userId, topic, score: 0 }));
  return await getDb().insert(userInterests).values(rows).returning();
}

export async function getUserCustomInterests(userId: number): Promise<UserCustomInterest[]> {
  return await getDb()
    .select()
    .from(userCustomInterests)
    .where(eq(userCustomInterests.userId, userId));
}

export async function setUserCustomInterests(
  userId: number,
  texts: string[],
): Promise<UserCustomInterest[]> {
  await getDb().delete(userCustomInterests).where(eq(userCustomInterests.userId, userId));
  const clean = texts.map((t) => t.trim()).filter((t) => t.length > 0 && t.length <= 200);
  if (clean.length === 0) return [];
  const rows = clean.slice(0, 10).map((text) => ({ userId, text }));
  return await getDb().insert(userCustomInterests).values(rows).returning();
}

export async function bumpUserInterestScore(
  userId: number,
  topic: string,
  delta: number,
): Promise<void> {
  const existing = await getDb()
    .select()
    .from(userInterests)
    .where(and(eq(userInterests.userId, userId), eq(userInterests.topic, topic)));
  if (existing[0]) {
    await getDb()
      .update(userInterests)
      .set({ score: existing[0].score + delta, updatedAt: new Date() })
      .where(eq(userInterests.id, existing[0].id));
  } else {
    await getDb().insert(userInterests).values({ userId, topic, score: delta });
  }
}

// ===== Weekly raw news =====
export async function getWeeklyNewsByWeek(weekOf: string): Promise<WeeklyNews[]> {
  return await getDb()
    .select()
    .from(weeklyNews)
    .where(eq(weeklyNews.weekOf, weekOf))
    .orderBy(desc(weeklyNews.publishedAt));
}

export async function createWeeklyNews(news: InsertWeeklyNews): Promise<WeeklyNews> {
  const result = await getDb().insert(weeklyNews).values(news).returning();
  return result[0];
}

export async function getWeeklyNewsById(id: number): Promise<WeeklyNews | undefined> {
  const result = await getDb().select().from(weeklyNews).where(eq(weeklyNews.id, id));
  return result[0];
}

// ===== Clase semanal por user =====
export async function getNewsClass(
  userId: number,
  weekOf: string,
): Promise<NewsClass | undefined> {
  const result = await getDb()
    .select()
    .from(newsClasses)
    .where(and(eq(newsClasses.userId, userId), eq(newsClasses.weekOf, weekOf)));
  return result[0];
}

export async function createNewsClass(
  userId: number,
  weekOf: string,
  content: NewsClassContent,
): Promise<NewsClass> {
  const result = await getDb()
    .insert(newsClasses)
    .values({ userId, weekOf, content })
    .returning();
  return result[0];
}

// ===== Feedback =====
export async function createNewsFeedback(
  feedback: InsertNewsFeedback,
): Promise<NewsFeedback> {
  const result = await getDb().insert(newsFeedback).values(feedback).returning();
  return result[0];
}
