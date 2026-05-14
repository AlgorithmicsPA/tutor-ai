/**
 * Storage layer del módulo auth.
 *
 * Hoy es un wrapper fino sobre el `server/storage.ts` monolítico —
 * solo los métodos que el auth necesita (`getUser`, `getUserByUsername`,
 * `createUser`) más el `sessionStore` para `express-session`.
 *
 * Cuando el storage monolítico se reparta en módulos (deuda técnica del
 * plan modular), esta capa solo cambia los imports y nadie más se entera.
 */
import { storage } from "../../storage";
import type { User, InsertUser } from "@shared/schema";

export async function getUser(id: number): Promise<User | undefined> {
  return storage.getUser(id);
}

export async function getUserByUsername(
  username: string,
): Promise<User | undefined> {
  return storage.getUserByUsername(username);
}

export async function createUser(data: InsertUser): Promise<User> {
  return storage.createUser(data);
}

/** Session store que Passport/express-session usa para persistir sesiones. */
export const sessionStore = storage.sessionStore;
