/**
 * HTTP routes del módulo admin_users (admin CRUD de usuarios).
 *
 * Endpoints (todos prefijo `/api/admin/users`):
 *   - GET    /api/admin/users        — lista users (sin password)
 *   - POST   /api/admin/users        — crea user (hashea password con scrypt)
 *   - PUT    /api/admin/users/:id    — actualiza name/role/password
 *   - DELETE /api/admin/users/:id    — borra user
 *
 * Mantiene el shape de response exacto que ya consume el admin frontend.
 */
import type { Express } from "express";
import { type InsertUser } from "@shared/schema";
import {
  getAllUsers,
  getUserByUsername,
  createUser,
  updateUser,
  deleteUser,
  hashPassword,
  sanitizeUser,
} from "./service";

export function registerAdminUsersRoutes(app: Express): void {
  // Get all users (admin only)
  app.get("/api/admin/users", async (_req, res) => {
    try {
      const allUsers = await getAllUsers();
      const sanitizedUsers = allUsers.map(sanitizeUser);
      res.json(sanitizedUsers);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Create new user (admin only)
  app.post("/api/admin/users", async (req, res) => {
    try {
      const { username, password, name, role } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Usuario y contraseña son obligatorios" });
      }

      const existingUser = await getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "El nombre de usuario ya existe" });
      }

      const hashedPassword = await hashPassword(password);

      const user = await createUser({
        username,
        password: hashedPassword, // allow-secret (variable, no literal)
        role: role || "student",
        name,
      });

      res.status(201).json(sanitizeUser(user));
    } catch (error: any) {
      console.error("Failed to create user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Update user (admin only)
  app.put("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { name, role, password } = req.body;

      const updateData: Partial<InsertUser> = {};
      if (name !== undefined) updateData.name = name;
      if (role !== undefined) updateData.role = role;

      if (password) {
        updateData.password = await hashPassword(password);
      }

      const updatedUser = await updateUser(userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json(sanitizeUser(updatedUser));
    } catch (error: any) {
      console.error("Failed to update user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const deleted = await deleteUser(userId);

      if (!deleted) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json({ ok: true });
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
}
