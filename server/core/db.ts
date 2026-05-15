/**
 * Singletons compartidos de DB.
 *
 * Centraliza `Pool` y `drizzle()` para que cada módulo `modules/<X>/storage.ts`
 * use la misma conexión sin re-instanciar. También expone el `PostgresSessionStore`
 * (express-session) que vive en `core/storage.ts`.
 *
 * Movido acá en Fase 9.5 (split del storage monolítico por feature) — antes
 * vivía dentro de `core/storage.ts`.
 */
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import session from "express-session";
import connectPg from "connect-pg-simple";

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getPool());
  }
  return _db;
}

export const PostgresSessionStore = connectPg(session);
