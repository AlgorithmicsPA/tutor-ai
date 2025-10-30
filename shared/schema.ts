import { z } from "zod";
import { pgTable, serial, varchar, text, json, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Lesson DSL Types - Core data model for educational content
export const lessonDSLSchema = z.object({
  meta: z.object({
    id: z.string(),
    title: z.string(),
    age: z.string(),
    lang: z.string(),
  }),
  objectives: z.array(z.string()),
  timeline: z.array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("tutor_say"),
        text: z.string(),
        voice: z.boolean().optional(),
        role: z.enum(["guide", "coach"]).optional(),
        condition: z.object({
          requireMinScore: z.number().optional(),
          requireMaxScore: z.number().optional(),
        }).optional(),
      }),
      z.object({
        type: z.literal("show_image"),
        src: z.string(),
        alt: z.string().optional(),
        condition: z.object({
          requireMinScore: z.number().optional(),
          requireMaxScore: z.number().optional(),
        }).optional(),
      }),
      z.object({
        type: z.literal("quiz"),
        question: z.string(),
        choices: z.array(z.string()),
        answer: z.number(),
        condition: z.object({
          requireMinScore: z.number().optional(),
          requireMaxScore: z.number().optional(),
        }).optional(),
      }),
      z.object({
        type: z.literal("interactive"),
        widget: z.enum(["order-steps", "drag-drop"]),
        data: z.any(),
        condition: z.object({
          requireMinScore: z.number().optional(),
          requireMaxScore: z.number().optional(),
        }).optional(),
      }),
      z.object({
        type: z.literal("reflection"),
        prompt: z.string(),
        condition: z.object({
          requireMinScore: z.number().optional(),
          requireMaxScore: z.number().optional(),
        }).optional(),
      }),
      z.object({
        type: z.literal("adaptive_path"),
        message: z.string(),
        icon: z.enum(["star", "lightbulb", "rocket"]).optional(),
        condition: z.object({
          requireMinScore: z.number().optional(),
          requireMaxScore: z.number().optional(),
        }).optional(),
      }),
    ])
  ),
  adaptation: z.object({
    if_score_below: z.number(),
    goto: z.string(),
  }).optional(),
});

export type LessonDSL = z.infer<typeof lessonDSLSchema>;
export type TimelineItem = LessonDSL["timeline"][number];

// Chat Message Types
export const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// API Request/Response Types
export const tutorRequestSchema = z.object({
  messages: z.array(chatMessageSchema),
  provider: z.enum(["openai", "gemini"]).optional(),
  system: z.string().optional(),
});

export type TutorRequest = z.infer<typeof tutorRequestSchema>;

export const tutorResponseSchema = z.object({
  reply: z.string(),
});

export type TutorResponse = z.infer<typeof tutorResponseSchema>;

export const gradeRequestSchema = z.object({
  lessonId: z.string(),
  itemType: z.enum(["quiz"]),
  answerIndex: z.number(),
  userIndex: z.number(),
});

export type GradeRequest = z.infer<typeof gradeRequestSchema>;

export const gradeResponseSchema = z.object({
  score: z.number(),
});

export type GradeResponse = z.infer<typeof gradeResponseSchema>;

// Database Tables
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  lessonId: varchar("lesson_id", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  age: varchar("age", { length: 50 }).notNull(),
  lang: varchar("lang", { length: 10 }).notNull().default("es"),
  objectives: text("objectives").array().notNull(),
  timeline: json("timeline").notNull().$type<LessonDSL["timeline"]>(),
  adaptation: json("adaptation").$type<LessonDSL["adaptation"]>(),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  lessonId: varchar("lesson_id", { length: 255 }).notNull(),
  quizScores: json("quiz_scores").notNull().$type<{ index: number; score: number }[]>().default([]),
  completedItems: json("completed_items").notNull().$type<number[]>().default([]),
  lastPosition: integer("last_position").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
