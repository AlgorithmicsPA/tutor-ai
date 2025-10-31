import { z } from "zod";
import { pgTable, serial, varchar, text, json, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Base condition schema for reusability
const conditionSchema = z.object({
  requireMinScore: z.number().optional(),
  requireMaxScore: z.number().optional(),
}).optional();

// Timeline Item Types - Expanded for interactive lessons
const timelineItemSchema = z.discriminatedUnion("type", [
  // Existing items
  z.object({
    type: z.literal("tutor_say"),
    text: z.string(),
    voice: z.boolean().optional(),
    role: z.enum(["guide", "coach"]).optional(),
    condition: conditionSchema,
  }),
  z.object({
    type: z.literal("show_image"),
    src: z.string(),
    alt: z.string().optional(),
    imagePrompt: z.string().optional(), // For AI-generated images
    condition: conditionSchema,
  }),
  z.object({
    type: z.literal("quiz"),
    question: z.string(),
    choices: z.array(z.string()),
    answer: z.number(),
    explanation: z.string().optional(), // Explain why this is correct
    condition: conditionSchema,
  }),
  z.object({
    type: z.literal("interactive"),
    widget: z.enum(["order-steps", "drag-drop"]),
    data: z.any(),
    condition: conditionSchema,
  }),
  z.object({
    type: z.literal("reflection"),
    prompt: z.string(),
    condition: conditionSchema,
  }),
  z.object({
    type: z.literal("adaptive_path"),
    message: z.string(),
    icon: z.enum(["star", "lightbulb", "rocket"]).optional(),
    condition: conditionSchema,
  }),
  
  // NEW: Advanced interactive items
  z.object({
    type: z.literal("prompt_editor"),
    title: z.string(),
    description: z.string(),
    challenge: z.string(), // What the student needs to achieve
    starterPrompt: z.string().optional(), // Initial prompt to modify
    hints: z.array(z.string()).optional(),
    expectedConcepts: z.array(z.string()).optional(), // Keywords to look for
    testCases: z.array(z.object({
      input: z.string(),
      expectedOutput: z.string(),
    })).optional(),
    condition: conditionSchema,
  }),
  z.object({
    type: z.literal("chat_simulator"),
    title: z.string(),
    description: z.string(),
    scenario: z.string(), // Context for the simulation
    systemPrompt: z.string(), // How the AI should behave
    starterMessages: z.array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })).optional(),
    expectedTopics: z.array(z.string()).optional(), // Topics student should cover
    minMessages: z.number().optional(),
    condition: conditionSchema,
  }),
  z.object({
    type: z.literal("code_exercise"),
    title: z.string(),
    description: z.string(),
    language: z.enum(["python", "javascript", "typescript"]),
    starterCode: z.string().optional(),
    solution: z.string().optional(),
    testCases: z.array(z.object({
      input: z.string(),
      expectedOutput: z.string(),
    })).optional(),
    hints: z.array(z.string()).optional(),
    condition: conditionSchema,
  }),
  z.object({
    type: z.literal("comparison"),
    title: z.string(),
    description: z.string().optional(),
    leftSide: z.object({
      title: z.string(),
      content: z.string(),
      imageSrc: z.string().optional(),
      imagePrompt: z.string().optional(),
    }),
    rightSide: z.object({
      title: z.string(),
      content: z.string(),
      imageSrc: z.string().optional(),
      imagePrompt: z.string().optional(),
    }),
    conclusion: z.string().optional(),
    condition: conditionSchema,
  }),
  z.object({
    type: z.literal("timeline_interactive"),
    title: z.string(),
    description: z.string().optional(),
    events: z.array(z.object({
      id: z.string(),
      date: z.string(),
      title: z.string(),
      description: z.string(),
      imageSrc: z.string().optional(),
      imagePrompt: z.string().optional(),
    })),
    orientation: z.enum(["horizontal", "vertical"]).optional(),
    condition: conditionSchema,
  }),
  z.object({
    type: z.literal("hotspot_diagram"),
    title: z.string(),
    description: z.string().optional(),
    imageSrc: z.string(),
    imagePrompt: z.string().optional(),
    hotspots: z.array(z.object({
      id: z.string(),
      x: z.number(), // Percentage position
      y: z.number(),
      title: z.string(),
      content: z.string(),
    })),
    condition: conditionSchema,
  }),
  z.object({
    type: z.literal("mini_project"),
    title: z.string(),
    description: z.string(),
    estimatedTime: z.number(), // Minutes
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    steps: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      hints: z.array(z.string()).optional(),
    })),
    resources: z.array(z.object({
      title: z.string(),
      url: z.string(),
      type: z.enum(["doc", "video", "tool", "example"]),
    })).optional(),
    condition: conditionSchema,
  }),
  z.object({
    type: z.literal("theory_block"),
    title: z.string(),
    content: z.string(), // Rich text content
    keyPoints: z.array(z.string()).optional(),
    imageSrc: z.string().optional(),
    imagePrompt: z.string().optional(),
    condition: conditionSchema,
  }),
]);

// Module schema for organizing long lessons
const moduleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  estimatedMinutes: z.number(),
  type: z.enum(["introduction", "theory", "practice", "project", "assessment", "conclusion"]),
  timeline: z.array(timelineItemSchema),
});

// Lesson DSL Types - Core data model for educational content
export const lessonDSLSchema = z.object({
  meta: z.object({
    id: z.string(),
    title: z.string(),
    age: z.string(),
    lang: z.string(),
    // NEW: Extended metadata for advanced lessons
    audience: z.enum(["children", "teens", "adults", "professional"]).optional(),
    duration: z.number().optional(), // Total minutes
    level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    type: z.enum(["theory", "practice", "mixed"]).optional(),
  }),
  objectives: z.array(z.string()),
  // Support both legacy (flat timeline) and new (modules)
  modules: z.array(moduleSchema).optional(),
  timeline: z.array(timelineItemSchema).optional(),
  adaptation: z.object({
    if_score_below: z.number(),
    goto: z.string(),
  }).optional(),
});

export type LessonDSL = z.infer<typeof lessonDSLSchema>;
export type Module = z.infer<typeof moduleSchema>;
export type TimelineItem = z.infer<typeof timelineItemSchema>;

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
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("student"),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  lessonId: varchar("lesson_id", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  age: varchar("age", { length: 50 }).notNull(),
  lang: varchar("lang", { length: 10 }).notNull().default("es"),
  objectives: text("objectives").array().notNull(),
  // NEW: Extended metadata
  audience: varchar("audience", { length: 20 }),
  duration: integer("duration"), // Total minutes
  level: varchar("level", { length: 20 }),
  type: varchar("type", { length: 20 }),
  // Support both legacy (timeline) and new (modules) structure
  modules: json("modules").$type<Module[]>(),
  timeline: json("timeline").$type<TimelineItem[]>(),
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

// Lesson Generation Schema - Enhanced for advanced lessons
export const generateLessonRequestSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  age: z.string().min(1, "La edad es obligatoria"),
  objectives: z.array(z.string()).min(1, "Al menos un objetivo es obligatorio"),
  lang: z.string().default("es"),
  // NEW: Advanced generation parameters
  audience: z.enum(["children", "teens", "adults", "professional"]).optional(),
  duration: z.number().min(10).max(240).optional(), // 10 min to 4 hours
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  type: z.enum(["theory", "practice", "mixed"]).optional(),
  generateImages: z.boolean().optional().default(true), // Auto-generate images
});

export type GenerateLessonRequest = z.infer<typeof generateLessonRequestSchema>;

export const generateLessonResponseSchema = z.object({
  modules: z.array(moduleSchema).optional(),
  timeline: z.array(timelineItemSchema).optional(),
});

export type GenerateLessonResponse = z.infer<typeof generateLessonResponseSchema>;
