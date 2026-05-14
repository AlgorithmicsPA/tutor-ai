/**
 * Service layer del módulo progress.
 *
 * Wraps el storage compartido (`server/storage.ts`) para mantener una API
 * estable del módulo. Si en el futuro se modulariza también el storage,
 * solo cambiamos los imports acá — los routes siguen iguales.
 */
import { storage } from "../../storage";
import type { UserProgress, InsertUserProgress } from "@shared/schema";

export async function getUserProgress(
  userId: string,
  lessonId: string,
): Promise<UserProgress | undefined> {
  return storage.getUserProgress(userId, lessonId);
}

export async function createUserProgress(
  data: InsertUserProgress,
): Promise<UserProgress> {
  return storage.createUserProgress(data);
}

export async function updateUserProgress(
  id: number,
  data: Partial<InsertUserProgress>,
): Promise<UserProgress | undefined> {
  return storage.updateUserProgress(id, data);
}
