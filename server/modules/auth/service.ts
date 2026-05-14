/**
 * Service layer del módulo auth.
 *
 * Encapsula:
 *   - Hashing de password con scrypt (formato `${hex(hash)}.${hex(salt)}`,
 *     64-byte hash, 16-byte salt random).
 *   - Comparación timing-safe de password.
 *   - `sanitizeUser` para sacar `password` del objeto antes de responder.
 *
 * Es la fuente de verdad del formato de hash. El módulo `admin_users` también
 * hashea passwords (para crear/editar usuarios desde el admin) y debe usar la
 * MISMA implementación que vive acá. Hoy mantiene una copia duplicada con un
 * TODO de unificar — cuando se haga, ese módulo importa de acá.
 */
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

/**
 * Hashea una password con scrypt.
 * Formato del resultado: `${hex(hash)}.${hex(salt)}`.
 */
export async function hashPassword(password: string): Promise<string> { // allow-secret
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compara una password en claro contra el formato `${hex(hash)}.${hex(salt)}`
 * usando `timingSafeEqual` (resiste timing attacks).
 */
export async function comparePasswords(
  supplied: string,
  stored: string,
): Promise<boolean> { // allow-secret
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/** Saca el `password` del objeto user antes de responderlo al cliente. */
export function sanitizeUser<T extends { password?: string }>(
  user: T,
): Omit<T, "password"> {
  const { password: _password, ...rest } = user;
  return rest;
}
