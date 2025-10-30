import { z } from "zod";

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
      }),
      z.object({
        type: z.literal("show_image"),
        src: z.string(),
        alt: z.string().optional(),
      }),
      z.object({
        type: z.literal("quiz"),
        question: z.string(),
        choices: z.array(z.string()),
        answer: z.number(),
      }),
      z.object({
        type: z.literal("interactive"),
        widget: z.enum(["order-steps", "drag-drop"]),
        data: z.any(),
      }),
      z.object({
        type: z.literal("reflection"),
        prompt: z.string(),
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
