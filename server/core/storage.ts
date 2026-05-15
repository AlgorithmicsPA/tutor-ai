/**
 * Facade del storage layer — compone la clase `DbStorage` que implementa
 * `IStorage` delegando cada método al storage de su módulo.
 *
 * Fase 9.5 (2026-05-14): el storage monolítico se repartió por feature:
 *  - `modules/admin_users/storage.ts` — users CRUD
 *  - `modules/lessons/storage.ts`     — lessons CRUD
 *  - `modules/progress/storage.ts`    — user progress CRUD
 *  - `modules/news/storage.ts`        — interests, weekly news, news classes, feedback
 *
 * Este archivo queda como **composition root + retro-compat**:
 *  - Mantiene la interfaz `IStorage` (contrato público histórico).
 *  - Exporta `storage` (instancia de `DbStorage`) que los 9 call-sites legacy usan
 *    vía `server/storage.ts` (shim).
 *  - Las nuevas features deben importar directo del storage de su módulo —
 *    no agregar métodos acá.
 *
 * El `sessionStore` (express-session) sigue acá porque es singleton compartido
 * por toda la app (auth) y vive ligado al `Pool` global de `core/db.ts`.
 *
 * Cuando todos los call-sites migren a `modules/<X>/storage.ts`, esta clase y
 * la interface `IStorage` se borran y queda solo el `sessionStore` exportado.
 */
import session from "express-session";
import type {
  Lesson,
  InsertLesson,
  UserProgress,
  InsertUserProgress,
  User,
  InsertUser,
  UserInterest,
  UserCustomInterest,
  WeeklyNews,
  InsertWeeklyNews,
  NewsClass,
  NewsClassContent,
  NewsFeedback,
  InsertNewsFeedback,
} from "@shared/schema";

import { getPool, PostgresSessionStore } from "./db";
import * as usersStore from "../modules/admin_users/storage";
import * as lessonsStore from "../modules/lessons/storage";
import * as progressStore from "../modules/progress/storage";
import * as newsStore from "../modules/news/storage";

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

  // ===== Users (delegan a modules/admin_users/storage) =====
  getAllUsers = usersStore.getAllUsers;
  getUser = usersStore.getUser;
  getUserByUsername = usersStore.getUserByUsername;
  createUser = usersStore.createUser;
  updateUser = usersStore.updateUser;
  deleteUser = usersStore.deleteUser;

  // ===== Lessons (delegan a modules/lessons/storage) =====
  getAllLessons = lessonsStore.getAllLessons;
  getPublishedLessons = lessonsStore.getPublishedLessons;
  getLessonById = lessonsStore.getLessonById;
  getLessonByLessonId = lessonsStore.getLessonByLessonId;
  createLesson = lessonsStore.createLesson;
  updateLesson = lessonsStore.updateLesson;
  deleteLesson = lessonsStore.deleteLesson;

  // ===== Progress (delegan a modules/progress/storage) =====
  getUserProgress = progressStore.getUserProgress;
  createUserProgress = progressStore.createUserProgress;
  updateUserProgress = progressStore.updateUserProgress;

  // ===== News (delegan a modules/news/storage) =====
  getUserInterests = newsStore.getUserInterests;
  setUserInterests = newsStore.setUserInterests;
  getUserCustomInterests = newsStore.getUserCustomInterests;
  setUserCustomInterests = newsStore.setUserCustomInterests;
  bumpUserInterestScore = newsStore.bumpUserInterestScore;
  getWeeklyNewsByWeek = newsStore.getWeeklyNewsByWeek;
  createWeeklyNews = newsStore.createWeeklyNews;
  getWeeklyNewsById = newsStore.getWeeklyNewsById;
  getNewsClass = newsStore.getNewsClass;
  createNewsClass = newsStore.createNewsClass;
  createNewsFeedback = newsStore.createNewsFeedback;
}

export const storage = new DbStorage();
