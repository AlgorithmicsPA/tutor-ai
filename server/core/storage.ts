import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import {
  type Lesson,
  type InsertLesson,
  type UserProgress,
  type InsertUserProgress,
  type User,
  type InsertUser,
  type UserInterest,
  type InsertUserInterest,
  type UserCustomInterest,
  type WeeklyNews,
  type InsertWeeklyNews,
  type NewsClass,
  type NewsClassContent,
  type NewsFeedback,
  type InsertNewsFeedback,
  lessons,
  userProgress,
  users,
  userInterests,
  userCustomInterests,
  weeklyNews,
  newsClasses,
  newsFeedback,
} from "@shared/schema";

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

function getDb() {
  if (!_db) {
    _db = drizzle(getPool());
  }
  return _db;
}

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Lesson CRUD
  getAllLessons(): Promise<Lesson[]>;
  getPublishedLessons(): Promise<Lesson[]>;
  getLessonById(id: number): Promise<Lesson | undefined>;
  getLessonByLessonId(lessonId: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<boolean>;
  
  // User Progress CRUD
  getUserProgress(userId: string, lessonId: string): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: number, progress: Partial<InsertUserProgress>): Promise<UserProgress | undefined>;

  // User CRUD
  getAllUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // News: intereses del usuario
  getUserInterests(userId: number): Promise<UserInterest[]>;
  setUserInterests(userId: number, topics: string[]): Promise<UserInterest[]>;
  bumpUserInterestScore(userId: number, topic: string, delta: number): Promise<void>;
  getUserCustomInterests(userId: number): Promise<UserCustomInterest[]>;
  setUserCustomInterests(userId: number, texts: string[]): Promise<UserCustomInterest[]>;

  // News: noticias semanales
  getWeeklyNewsByWeek(weekOf: string): Promise<WeeklyNews[]>;
  createWeeklyNews(news: InsertWeeklyNews): Promise<WeeklyNews>;
  getWeeklyNewsById(id: number): Promise<WeeklyNews | undefined>;

  // News: clase semanal por user
  getNewsClass(userId: number, weekOf: string): Promise<NewsClass | undefined>;
  createNewsClass(userId: number, weekOf: string, content: NewsClassContent): Promise<NewsClass>;

  // News: feedback
  createNewsFeedback(feedback: InsertNewsFeedback): Promise<NewsFeedback>;

  // Session store
  sessionStore: session.Store;
}

export class DbStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: getPool(),
      createTableIfMissing: true,
    });
  }

  // User methods
  async getAllUsers(): Promise<User[]> {
    return await getDb().select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await getDb().select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await getDb()
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await getDb().insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await getDb()
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await getDb().delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Lesson methods
  async getAllLessons(): Promise<Lesson[]> {
    return await getDb().select().from(lessons);
  }

  async getPublishedLessons(): Promise<Lesson[]> {
    return await getDb().select().from(lessons).where(eq(lessons.published, true));
  }

  async getLessonById(id: number): Promise<Lesson | undefined> {
    const result = await getDb().select().from(lessons).where(eq(lessons.id, id));
    return result[0];
  }

  async getLessonByLessonId(lessonId: string): Promise<Lesson | undefined> {
    const result = await getDb().select().from(lessons).where(eq(lessons.lessonId, lessonId));
    return result[0];
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const result = await getDb().insert(lessons).values(lesson).returning();
    return result[0];
  }

  async updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const result = await getDb()
      .update(lessons)
      .set({ ...lesson, updatedAt: new Date() })
      .where(eq(lessons.id, id))
      .returning();
    return result[0];
  }

  async deleteLesson(id: number): Promise<boolean> {
    const result = await getDb().delete(lessons).where(eq(lessons.id, id)).returning();
    return result.length > 0;
  }

  // User Progress methods
  async getUserProgress(userId: string, lessonId: string): Promise<UserProgress | undefined> {
    const result = await getDb()
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.lessonId, lessonId)));
    return result[0];
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const result = await getDb().insert(userProgress).values(progress).returning();
    return result[0];
  }

  async updateUserProgress(
    id: number,
    progress: Partial<InsertUserProgress>
  ): Promise<UserProgress | undefined> {
    const result = await getDb()
      .update(userProgress)
      .set({ ...progress, updatedAt: new Date() })
      .where(eq(userProgress.id, id))
      .returning();
    return result[0];
  }

  // ===== News: user interests =====
  async getUserInterests(userId: number): Promise<UserInterest[]> {
    return await getDb().select().from(userInterests).where(eq(userInterests.userId, userId));
  }

  async setUserInterests(userId: number, topics: string[]): Promise<UserInterest[]> {
    // Reemplaza completamente el set de intereses
    await getDb().delete(userInterests).where(eq(userInterests.userId, userId));
    if (topics.length === 0) return [];
    const rows = topics.map(topic => ({ userId, topic, score: 0 }));
    return await getDb().insert(userInterests).values(rows).returning();
  }

  async getUserCustomInterests(userId: number): Promise<UserCustomInterest[]> {
    return await getDb().select().from(userCustomInterests).where(eq(userCustomInterests.userId, userId));
  }

  async setUserCustomInterests(userId: number, texts: string[]): Promise<UserCustomInterest[]> {
    await getDb().delete(userCustomInterests).where(eq(userCustomInterests.userId, userId));
    const clean = texts.map(t => t.trim()).filter(t => t.length > 0 && t.length <= 200);
    if (clean.length === 0) return [];
    const rows = clean.slice(0, 10).map(text => ({ userId, text }));
    return await getDb().insert(userCustomInterests).values(rows).returning();
  }

  async bumpUserInterestScore(userId: number, topic: string, delta: number): Promise<void> {
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

  // ===== News: weekly raw news =====
  async getWeeklyNewsByWeek(weekOf: string): Promise<WeeklyNews[]> {
    return await getDb()
      .select()
      .from(weeklyNews)
      .where(eq(weeklyNews.weekOf, weekOf))
      .orderBy(desc(weeklyNews.publishedAt));
  }

  async createWeeklyNews(news: InsertWeeklyNews): Promise<WeeklyNews> {
    const result = await getDb().insert(weeklyNews).values(news).returning();
    return result[0];
  }

  async getWeeklyNewsById(id: number): Promise<WeeklyNews | undefined> {
    const result = await getDb().select().from(weeklyNews).where(eq(weeklyNews.id, id));
    return result[0];
  }

  // ===== News: clase semanal por user =====
  async getNewsClass(userId: number, weekOf: string): Promise<NewsClass | undefined> {
    const result = await getDb()
      .select()
      .from(newsClasses)
      .where(and(eq(newsClasses.userId, userId), eq(newsClasses.weekOf, weekOf)));
    return result[0];
  }

  async createNewsClass(userId: number, weekOf: string, content: NewsClassContent): Promise<NewsClass> {
    const result = await getDb().insert(newsClasses).values({ userId, weekOf, content }).returning();
    return result[0];
  }

  // ===== News: feedback =====
  async createNewsFeedback(feedback: InsertNewsFeedback): Promise<NewsFeedback> {
    const result = await getDb().insert(newsFeedback).values(feedback).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
