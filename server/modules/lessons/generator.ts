/**
 * Lesson generator — usa OpenAI para producir lecciones modulares interactivas
 * a partir de un request (title, age, objectives, audience, duration, level, type).
 *
 * Reuso: importa `openai` del módulo tutor (Fase 2). NO duplica el cliente.
 *
 * Comportamiento idéntico al bloque original de `server/routes.ts`
 * (POST /api/lessons/generate).
 */
import { openai } from "../tutor/openai-client";
import type {
  GenerateLessonRequest,
  GenerateLessonResponse,
  InsertLesson,
  Lesson,
} from "@shared/schema";
import { createLesson } from "./service";

// Map image descriptions to pre-generated educational images
function getEducationalImage(description: string): string {
  const lowerDesc = description.toLowerCase();

  if (
    lowerDesc.includes("robot") ||
    lowerDesc.includes("profesor") ||
    lowerDesc.includes("teacher") ||
    lowerDesc.includes("clase")
  ) {
    return "/attached_assets/generated_images/Robot_teacher_with_diverse_children_bc4de1b4.png";
  } else if (
    lowerDesc.includes("cómo funciona") ||
    lowerDesc.includes("how ai works") ||
    lowerDesc.includes("diagrama") ||
    lowerDesc.includes("explicación")
  ) {
    return "/attached_assets/generated_images/How_AI_works_simple_diagram_62b5bad7.png";
  } else if (
    lowerDesc.includes("chatgpt") &&
    !lowerDesc.includes("gemini") &&
    !lowerDesc.includes("vs")
  ) {
    return "/attached_assets/generated_images/ChatGPT_friendly_character_illustration_431b9259.png";
  } else if (
    lowerDesc.includes("gemini") &&
    !lowerDesc.includes("chatgpt") &&
    !lowerDesc.includes("vs")
  ) {
    return "/attached_assets/generated_images/Gemini_friendly_star_character_8a90e0c2.png";
  } else if (
    (lowerDesc.includes("chatgpt") && lowerDesc.includes("gemini")) ||
    lowerDesc.includes("comparación") ||
    lowerDesc.includes("vs") ||
    lowerDesc.includes("diferencia")
  ) {
    return "/attached_assets/generated_images/ChatGPT_vs_Gemini_comparison_illustration_b8018ed9.png";
  }

  return "/attached_assets/generated_images/How_AI_works_simple_diagram_62b5bad7.png";
}

/**
 * Genera una lección con IA y la persiste en DB.
 * Devuelve la lección guardada + metadata para el redirect del frontend.
 */
export async function generateLesson(input: GenerateLessonRequest): Promise<{
  lesson: {
    meta: {
      id: string;
      title: string;
      age: string;
      objectives: string[];
      audience: string;
      duration: number;
      level: string;
      type: string;
    };
    modules: any;
    timeline: any;
  };
}> {
  const {
    title,
    age,
    objectives,
    lang,
    audience = "children",
    duration = 30,
    level = "beginner",
    type = "mixed",
    generateImages = true,
  } = input;

  const moduleCount = Math.max(1, Math.floor(duration / 15));
  const minutesPerModule = Math.floor(duration / moduleCount);

  const audienceMap: Record<string, string> = {
    children: "niños de 7-9 años",
    teens: "adolescentes de 13-17 años",
    adults: "adultos (18+ años)",
    professional: "profesionales y especialistas",
  };
  const audienceDesc = audienceMap[audience] || audienceMap.children;

  const typeMix =
    type === "theory"
      ? "80% teoría, 20% práctica"
      : type === "practice"
      ? "30% teoría, 70% práctica"
      : "50% teoría, 50% práctica";

  const prompt = `Eres un experto diseñador de contenido educativo creando una lección sobre Inteligencia Artificial.

METADATOS DE LA LECCIÓN:
- Título: "${title}"
- Audiencia: ${audienceDesc}
- Duración total: ${duration} minutos
- Nivel: ${level}
- Tipo: ${type} (${typeMix})
- Idioma: ${lang}

OBJETIVOS DE APRENDIZAJE:
${objectives.map((obj, i) => `${i + 1}. ${obj}`).join("\n")}

ESTRUCTURA REQUERIDA:
Crea ${moduleCount} módulos de aproximadamente ${minutesPerModule} minutos cada uno. Cada módulo debe tener:
- Un título descriptivo
- Una descripción breve
- Un tipo apropiado (introduction, theory, practice, project, assessment, conclusion)
- Un timeline con items variados

TIPOS DE ITEMS DISPONIBLES (usa TODOS estos tipos para crear lecciones dinámicas):

1. **theory_block**: Bloques de teoría con contenido rico
   - Usa para explicaciones conceptuales profundas
   - Incluye keyPoints (3-5 puntos clave)
   - Agrega imagePrompt para ilustraciones conceptuales

2. **tutor_say**: Mensajes del tutor (usa moderadamente, prefiere theory_block para contenido extenso)
   - Mensajes cortos y motivadores
   - role: "guide" o "coach"

3. **show_image**: Imágenes ilustrativas
   - Usa imagePrompt: "descripción detallada de la imagen"
   - La imagen se generará automáticamente

4. **comparison**: Comparaciones lado a lado (NUEVO)
   - Perfecto para contrastar conceptos (GPT vs Gemini, antes vs después, etc.)
   - Incluye leftSide y rightSide con título, content, e imagePrompt

5. **quiz**: Preguntas de opción múltiple
   - 4 opciones cada una
   - Incluye explanation (por qué la respuesta es correcta)

6. **prompt_editor**: Editor de prompts interactivo (NUEVO - ideal para práctica)
   - challenge: qué debe lograr el estudiante
   - star terPrompt: prompt inicial para modificar
   - hints: pistas para ayudar
   - expectedConcepts: palabras clave que debe incluir

7. **chat_simulator**: Simulador de chat con IA (NUEVO - muy interactivo)
   - scenario: contexto de la simulación
   - systemPrompt: cómo debe comportarse la IA
   - expectedTopics: temas que el estudiante debe cubrir
   - minMessages: número mínimo de mensajes

8. **timeline_interactive**: Línea de tiempo interactiva (NUEVO)
   - Perfecto para historia de la IA, evolución de modelos
   - events: array de eventos con fecha, título, descripción

9. **hotspot_diagram**: Diagrama con puntos clicables (NUEVO)
   - imageSrc o imagePrompt para el diagrama base
   - hotspots: puntos interactivos con información

10. **mini_project**: Mini proyecto guiado (NUEVO - para práctica profunda)
    - description: qué van a construir
    - steps: pasos del proyecto con hints
    - estimatedTime: minutos estimados
    - difficulty: beginner/intermediate/advanced

11. **reflection**: Prompts de reflexión
    - Para que piensen sobre lo aprendido

DISTRIBUCIÓN RECOMENDADA POR MÓDULO:
- Módulo 1 (Introducción): theory_block, show_image, quiz ligero
- Módulos intermedios (Teoría): theory_block, comparison, timeline_interactive, quiz
- Módulos de práctica: prompt_editor, chat_simulator, mini_project
- Módulo final: mini_project o assessment con quiz final

FORMATO JSON ESPERADO:
{
  "modules": [
    {
      "id": "module-1",
      "title": "Introducción a...",
      "description": "En este módulo...",
      "estimatedMinutes": ${minutesPerModule},
      "type": "introduction",
      "timeline": [
        {"type": "theory_block", "title": "...", "content": "...", "keyPoints": ["...", "..."], "imagePrompt": "..."},
        {"type": "comparison", "title": "...", "leftSide": {...}, "rightSide": {...}},
        {"type": "quiz", "question": "...", "choices": [...], "answer": 0, "explanation": "..."}
      ]
    }
  ]
}

IMPORTANTE:
- Cada módulo debe tener 4-8 items en su timeline
- Varía los tipos de items para mantener el interés
- Para ${audience}, ajusta el lenguaje y complejidad apropiadamente
- Nivel ${level}: ${level === "beginner" ? "conceptos básicos, ejemplos simples" : level === "intermediate" ? "profundiza conceptos, casos prácticos" : "teoría avanzada, proyectos complejos"}
- Incluye al menos 1 prompt_editor y 1 chat_simulator para práctica interactiva
- Los mini_project son ideales para módulos de práctica final
- USA imagePrompt en lugar de src para que se generen imágenes automáticamente
- El contenido debe ser educativo, preciso y adaptado a ${audienceDesc}

Responde SOLO con el JSON de los módulos, sin texto adicional.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content:
          "Eres un diseñador experto de contenido educativo interactivo. Generas JSON estructurado válido con lecciones modulares y variadas. Siempre incluyes los nuevos tipos de items interactivos (prompt_editor, chat_simulator, comparison, timeline_interactive, mini_project) para crear experiencias de aprendizaje dinámicas.",
      },
      { role: "user", content: prompt },
    ],
    max_completion_tokens: 16384,
    response_format: { type: "json_object" },
  });

  const generatedContent = response.choices[0]?.message?.content;
  if (!generatedContent) {
    throw new Error("No se pudo generar contenido");
  }

  const parsedContent: GenerateLessonResponse = JSON.parse(generatedContent);

  // Process modules to handle image mapping
  if (parsedContent.modules && generateImages) {
    parsedContent.modules = parsedContent.modules.map((module: any) => ({
      ...module,
      timeline: module.timeline.map((item: any) => {
        if (item.type === "show_image" && item.imagePrompt) {
          return { ...item, src: getEducationalImage(item.imagePrompt) };
        }
        if (item.type === "theory_block" && item.imagePrompt) {
          return { ...item, imageSrc: getEducationalImage(item.imagePrompt) };
        }
        if (item.type === "comparison") {
          return {
            ...item,
            leftSide: item.leftSide?.imagePrompt
              ? { ...item.leftSide, imageSrc: getEducationalImage(item.leftSide.imagePrompt) }
              : item.leftSide,
            rightSide: item.rightSide?.imagePrompt
              ? { ...item.rightSide, imageSrc: getEducationalImage(item.rightSide.imagePrompt) }
              : item.rightSide,
          };
        }
        if (item.type === "timeline_interactive" && item.events) {
          return {
            ...item,
            events: item.events.map((event: any) =>
              event.imagePrompt
                ? { ...event, imageSrc: getEducationalImage(event.imagePrompt) }
                : event,
            ),
          };
        }
        if (item.type === "hotspot_diagram" && item.imagePrompt) {
          return { ...item, imageSrc: getEducationalImage(item.imagePrompt) };
        }
        return item;
      }),
    }));
  }

  // Persist the generated lesson
  const lessonId = `lesson-${Date.now()}`;
  const lessonData: InsertLesson = {
    lessonId,
    title,
    age,
    objectives,
    lang: lang || "es",
    audience,
    duration,
    level,
    type,
    modules: parsedContent.modules || [],
    timeline: parsedContent.timeline || [],
    published: false,
  };

  const savedLesson: Lesson = await createLesson(lessonData);

  return {
    lesson: {
      meta: {
        id: savedLesson.lessonId,
        title: savedLesson.title,
        age: savedLesson.age,
        objectives: savedLesson.objectives as string[],
        audience: savedLesson.audience as string,
        duration: savedLesson.duration as number,
        level: savedLesson.level as string,
        type: savedLesson.type as string,
      },
      modules: savedLesson.modules,
      timeline: savedLesson.timeline,
    },
  };
}
