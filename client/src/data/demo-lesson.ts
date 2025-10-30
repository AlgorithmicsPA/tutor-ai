import type { LessonDSL } from "@shared/schema";

export const demoLesson: LessonDSL = {
  meta: {
    id: "demo-01",
    title: "Sumas Divertidas",
    age: "7-9",
    lang: "es",
  },
  objectives: [
    "Sumar números hasta 20",
    "Reconocer patrones numéricos",
    "Aplicar matemáticas en situaciones cotidianas",
  ],
  timeline: [
    {
      type: "tutor_say",
      text: "¡Hola! Soy Profe DANA y hoy vamos a aprender a sumar de una manera muy divertida usando frutas como manzanas, plátanos y naranjas.",
      voice: true,
      role: "guide",
    },
    {
      type: "show_image",
      src: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&h=400&fit=crop",
      alt: "Colorful assortment of fresh fruits",
    },
    {
      type: "tutor_say",
      text: "Imagina que tienes 7 manzanas rojas y tu amigo te da 5 manzanas más. ¿Cuántas manzanas tienes en total?",
      role: "coach",
    },
    {
      type: "quiz",
      question: "¿Cuánto es 7 + 5?",
      choices: ["10", "11", "12", "13"],
      answer: 2,
    },
    {
      type: "tutor_say",
      text: "¡Genial! Ahora vamos a practicar el orden correcto de los pasos para sumar.",
    },
    {
      type: "interactive",
      widget: "order-steps",
      data: {
        steps: [
          "Juntar las 5 manzanas nuevas",
          "Contar las 7 manzanas que ya tenías",
          "Contar todas las manzanas juntas",
        ],
        answer: [1, 0, 2],
      },
    },
    {
      type: "reflection",
      prompt: "Piensa en otros objetos que puedes usar para practicar sumas en casa. ¿Qué te gustaría contar?",
    },
  ],
};
