/**
 * Storage layer del módulo lessons — CRUD completo de `lessons`.
 *
 * Fase 9.5 (2026-05-14): split del storage monolítico `core/storage.ts` por
 * feature. Antes vivían dentro de `DbStorage`.
 *
 * Consumido también por `seed.ts`, `modules/admin_progress/` (que solo lee
 * lessons) y por el facade `core/storage.ts`.
 */
import { eq } from "drizzle-orm";
import type { Lesson, InsertLesson } from "@shared/schema";
import { lessons } from "@shared/schema";
import { getDb } from "../../core/db";

export async function getAllLessons(): Promise<Lesson[]> {
  return await getDb().select().from(lessons);
}

export async function getPublishedLessons(): Promise<Lesson[]> {
  return await getDb().select().from(lessons).where(eq(lessons.published, true));
}

export async function getLessonById(id: number): Promise<Lesson | undefined> {
  const result = await getDb().select().from(lessons).where(eq(lessons.id, id));
  return result[0];
}

export async function getLessonByLessonId(lessonId: string): Promise<Lesson | undefined> {
  const result = await getDb()
    .select()
    .from(lessons)
    .where(eq(lessons.lessonId, lessonId));
  return result[0];
}

export async function createLesson(lesson: InsertLesson): Promise<Lesson> {
  const result = await getDb().insert(lessons).values(lesson).returning();
  return result[0];
}

export async function updateLesson(
  id: number,
  lesson: Partial<InsertLesson>,
): Promise<Lesson | undefined> {
  const result = await getDb()
    .update(lessons)
    .set({ ...lesson, updatedAt: new Date() })
    .where(eq(lessons.id, id))
    .returning();
  return result[0];
}

export async function deleteLesson(id: number): Promise<boolean> {
  const result = await getDb().delete(lessons).where(eq(lessons.id, id)).returning();
  return result.length > 0;
}
