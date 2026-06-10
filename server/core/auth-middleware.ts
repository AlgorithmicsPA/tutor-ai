/**
 * Middleware de autorización reusable.
 *
 * Reúne el patrón `requireAuth` que cada módulo venía definiendo inline (news)
 * y agrega `requireAdmin`. Usa exactamente el mismo mecanismo que el resto del
 * backend: la sesión Passport instalada por el módulo `auth`
 * (`req.isAuthenticated()` + `req.user`). No introduce un esquema de auth nuevo.
 *
 * - requireAuth  → 401 si no hay sesión válida.
 * - requireAdmin → 403 si el usuario autenticado no tiene `role === "admin"`.
 *   El frontend ya exige `user.role === "admin"` para las vistas /admin
 *   (ver client/src/lib/protected-route.tsx), así que esto sólo cierra el
 *   acceso anónimo/no-admin a la API sin afectar al admin legítimo.
 */
import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ error: "No autenticado" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ error: "No autenticado" });
  }
  if ((req.user as { role?: string }).role !== "admin") {
    return res.status(403).json({ error: "Acceso denegado" });
  }
  next();
}
