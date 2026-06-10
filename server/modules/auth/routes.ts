/**
 * HTTP routes + middleware setup del módulo auth.
 *
 * Endpoints:
 *   - POST /api/register   — crear usuario nuevo (rol default "student").
 *   - POST /api/login      — autenticar con Passport LocalStrategy + iniciar sesión.
 *   - POST /api/logout     — destruir sesión.
 *   - GET  /api/user       — devuelve usuario autenticado (401 si no hay sesión).
 *
 * Además configura como side-effect:
 *   - `express-session` con cookie de 7 días + sessionStore Postgres compartido.
 *   - Passport: LocalStrategy, serialize/deserialize por user id.
 *   - `app.set("trust proxy", 1)` para que la cookie respete el header
 *     `X-Forwarded-Proto` de nginx (HTTPS terminado afuera).
 *
 * Estos side-effects exponen `req.isAuthenticated()` y `req.user` que el resto
 * de los módulos (news, lessons, progress, admin_*) consumen como middleware.
 */
import type { Express } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { User as SelectUser } from "@shared/schema";
import {
  comparePasswords,
  hashPassword,
  sanitizeUser,
} from "./service";
import {
  createUser,
  getUser,
  getUserByUsername,
  sessionStore,
} from "./storage";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends SelectUser {}
  }
}

export function registerAuthRoutes(app: Express): void {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!, // allow-secret
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, {
            message: "Usuario o contraseña incorrectos",
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, (user as SelectUser).id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await getUser(id);
      done(null, user || null);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, name } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .send("Usuario y contraseña son obligatorios");
      }

      const existingUser = await getUserByUsername(username);
      if (existingUser) {
        return res.status(400).send("El nombre de usuario ya existe");
      }

      // Hardening privilege-escalation: el registro público NUNCA acepta `role`
      // del body. Todo signup es "student". La creación de admins se hace por
      // /api/admin/users (que ahora exige requireAuth + requireAdmin).
      const user = await createUser({
        username,
        password: await hashPassword(password),
        role: "student",
        name,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(sanitizeUser(user));
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate(
      "local",
      (err: any, user: SelectUser | false, info: any) => {
        if (err) return next(err);
        if (!user) {
          return res
            .status(401)
            .send(info?.message || "Credenciales inválidas");
        }
        req.login(user, (err) => {
          if (err) return next(err);
          res.status(200).json(sanitizeUser(user));
        });
      },
    )(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ ok: true });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(sanitizeUser(req.user!));
  });
}
