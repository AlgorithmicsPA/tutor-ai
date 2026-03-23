import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import {
  type Lesson,
  type InsertLesson,
  type UserProgress,
  type InsertUserProgress,
  type User,
  type InsertUser,
  lessons,
  userProgress,
  users,
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
    const result = await getDb().select().from(users).where(eq(users.username, username));
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
}

export const storage = new DbStorage();
