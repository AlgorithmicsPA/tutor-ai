/**
 * Service layer del módulo admin_users.
 *
 * Wraps el storage compartido (`server/storage.ts`) y encapsula el hashing
 * scrypt usado por el auth (mismo formato que `server/auth.ts` —
 * `hex(hash).hex(salt)` separados por `.`).
 *
 * Si se modulariza el storage o el auth, solo cambiamos los imports acá.
 */
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { storage } from "../../storage";
import type { User, InsertUser } from "@shared/schema";

const scryptAsync = promisify(scrypt);

/**
 * Hashea una password con el mismo formato que `server/auth.ts`:
 *   `${hex(buf)}.${hex(salt)}`
 * 64-byte hash, 16-byte salt random.
 */
export async function hashPassword(password: string): Promise<string> { // allow-secret
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function getAllUsers(): Promise<User[]> {
  return storage.getAllUsers();
}

export async function getUserByUsername(
  username: string,
): Promise<User | undefined> {
  return storage.getUserByUsername(username);
}

export async function createUser(data: InsertUser): Promise<User> {
  return storage.createUser(data);
}

export async function updateUser(
  id: number,
  data: Partial<InsertUser>,
): Promise<User | undefined> {
  return storage.updateUser(id, data);
}

export async function deleteUser(id: number): Promise<boolean> {
  return storage.deleteUser(id);
}

/** Saca el `password` del objeto user antes de responderlo al cliente. */
export function sanitizeUser<T extends { password?: string }>(
  user: T,
): Omit<T, "password"> {
  const { password: _password, ...rest } = user;
  return rest;
}
