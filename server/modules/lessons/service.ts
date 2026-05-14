/**
 * Service layer del módulo lessons.
 *
 * Wraps el storage compartido (`server/storage.ts`) para mantener una API
 * estable del módulo. Si en el futuro se modulariza también el storage,
 * solo cambiamos los imports acá — los routes y generator siguen iguales.
 */
import { storage } from "../../storage";
import type { Lesson, InsertLesson } from "@shared/schema";

export async function getPublishedLessons(): Promise<Lesson[]> {
  return storage.getPublishedLessons();
}

export async function getAllLessons(): Promise<Lesson[]> {
  return storage.getAllLessons();
}

export async function getLessonByLessonId(lessonId: string): Promise<Lesson | undefined> {
  return storage.getLessonByLessonId(lessonId);
}

export async function createLesson(data: InsertLesson): Promise<Lesson> {
  return storage.createLesson(data);
}

export async function updateLesson(id: number, data: Partial<InsertLesson>): Promise<Lesson | undefined> {
  return storage.updateLesson(id, data);
}

export async function deleteLesson(id: number): Promise<boolean> {
  return storage.deleteLesson(id);
}
