/**
 * Storage layer del módulo progress — CRUD de `userProgress`.
 *
 * Fase 9.5 (2026-05-14): split del storage monolítico `core/storage.ts` por
 * feature. Antes vivían dentro de `DbStorage`.
 *
 * Consumido por `modules/progress/service.ts`, `modules/admin_progress/service.ts`
 * y el facade `core/storage.ts`.
 */
import { and, eq } from "drizzle-orm";
import type { UserProgress, InsertUserProgress } from "@shared/schema";
import { userProgress } from "@shared/schema";
import { getDb } from "../../core/db";

export async function getUserProgress(
  userId: string,
  lessonId: string,
): Promise<UserProgress | undefined> {
  const result = await getDb()
    .select()
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.lessonId, lessonId)));
  return result[0];
}

export async function createUserProgress(
  progress: InsertUserProgress,
): Promise<UserProgress> {
  const result = await getDb().insert(userProgress).values(progress).returning();
  return result[0];
}

export async function updateUserProgress(
  id: number,
  progress: Partial<InsertUserProgress>,
): Promise<UserProgress | undefined> {
  const result = await getDb()
    .update(userProgress)
    .set({ ...progress, updatedAt: new Date() })
    .where(eq(userProgress.id, id))
    .returning();
  return result[0];
}
