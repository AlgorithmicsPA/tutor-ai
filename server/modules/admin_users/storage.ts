/**
 * Storage layer del módulo admin_users — CRUD completo de `users`.
 *
 * Fase 9.5 (2026-05-14): split del storage monolítico `core/storage.ts` por
 * feature. Antes vivían dentro de `DbStorage`.
 *
 * Consumido también por `modules/auth/storage.ts` (wrapper fino) y por
 * el facade `core/storage.ts` (mantiene la clase `DbStorage` para retro-compat).
 */
import { eq, sql } from "drizzle-orm";
import type { User, InsertUser } from "@shared/schema";
import { users } from "@shared/schema";
import { getDb } from "../../core/db";

export async function getAllUsers(): Promise<User[]> {
  return await getDb().select().from(users);
}

export async function getUser(id: number): Promise<User | undefined> {
  const result = await getDb().select().from(users).where(eq(users.id, id));
  return result[0];
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const result = await getDb()
    .select()
    .from(users)
    .where(sql`LOWER(${users.username}) = LOWER(${username})`);
  return result[0];
}

export async function createUser(user: InsertUser): Promise<User> {
  const result = await getDb().insert(users).values(user).returning();
  return result[0];
}

export async function updateUser(
  id: number,
  user: Partial<InsertUser>,
): Promise<User | undefined> {
  const result = await getDb()
    .update(users)
    .set(user)
    .where(eq(users.id, id))
    .returning();
  return result[0];
}

export async function deleteUser(id: number): Promise<boolean> {
  const result = await getDb().delete(users).where(eq(users.id, id)).returning();
  return result.length > 0;
}
