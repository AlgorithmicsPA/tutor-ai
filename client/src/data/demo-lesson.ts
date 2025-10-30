import type { LessonDSL } from "@shared/schema";

export const demoLesson: LessonDSL = {
  meta: {
    id: "demo-01",
    title: "Introducción a la Inteligencia Artificial",
    age: "7-9",
    lang: "es",
  },
  objectives: [
    "Entender qué es la Inteligencia Artificial",
    "Conocer OpenAI y Gemini",
    "Aprender cómo usar asistentes de IA",
  ],
  timeline: [
    {
      type: "tutor_say",
      text: "¡Hola! Soy Profe DANA y hoy vamos a descubrir el fascinante mundo de la Inteligencia Artificial. ¿Sabes qué es la IA?",
      voice: true,
      role: "guide",
    },
    {
      type: "show_image",
      src: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
      alt: "Concepto visual de inteligencia artificial con tecnología futurista",
    },
    {
      type: "tutor_say",
      text: "La Inteligencia Artificial es como tener un robot muy inteligente que puede ayudarte a responder preguntas, crear historias, resolver problemas y mucho más. Hay dos asistentes muy populares: OpenAI (que usa GPT) y Gemini (creado por Google).",
      role: "coach",
    },
    {
      type: "quiz",
      question: "¿Cuáles son los dos asistentes de IA que mencionamos?",
      choices: ["OpenAI y Gemini", "Siri y Alexa", "Facebook y Twitter", "Word y Excel"],
      answer: 0,
    },
    {
      type: "tutor_say",
      text: "¡Excelente! Ahora aprenderemos los pasos para usar un asistente de IA. Es muy importante hacerlo en el orden correcto.",
    },
    {
      type: "interactive",
      widget: "order-steps",
      data: {
        steps: [
          "Escribe tu pregunta de forma clara",
          "Abre la aplicación de IA (OpenAI o Gemini)",
          "Lee y verifica la respuesta que te da",
        ],
        answer: [1, 0, 2],
      },
    },
    {
      type: "tutor_say",
      text: "Muy bien. Recuerda que la IA es una herramienta poderosa, pero tú eres quien piensa y decide. La IA está aquí para ayudarte a aprender, no para hacer tu trabajo por ti.",
      role: "guide",
    },
    {
      type: "reflection",
      prompt: "Piensa en una pregunta interesante que te gustaría hacerle a un asistente de IA. ¿Qué te gustaría aprender o crear con su ayuda?",
    },
  ],
};
