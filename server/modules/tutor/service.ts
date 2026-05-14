/**
 * Lógica pura del módulo tutor (sin Express, sin DB).
 *
 * - `scoreQuiz`: comparador de respuesta correcta vs respuesta del usuario.
 * - `runTutorChat`: orquesta OpenAI → fallback Gemini → fallback texto amistoso.
 *   Nunca lanza; siempre devuelve un `reply` string.
 */
import { openai, geminiClient, OPENAI_MODEL, GEMINI_MODEL } from "./openai-client";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function scoreQuiz(answerIdx: number, userIdx: number): number {
  return answerIdx === userIdx ? 1 : 0;
}

export interface RunTutorChatInput {
  messages: Array<{ role: string; content: string }>;
  system?: string;
}

export interface RunTutorChatOutput {
  reply: string;
  usedProvider: "openai" | "gemini" | "fallback";
}

export async function runTutorChat(input: RunTutorChatInput): Promise<RunTutorChatOutput> {
  const { messages, system } = input;

  const chatMessages: ChatMessage[] = [
    ...(system ? [{ role: "system" as const, content: system }] : []),
    ...messages.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    })),
  ];

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: chatMessages,
      max_completion_tokens: 8192,
    });
    const reply =
      response.choices[0]?.message?.content || "Lo siento, no pude generar una respuesta.";
    return { reply, usedProvider: "openai" };
  } catch (openaiError: any) {
    console.log(
      "OpenAI error, attempting Gemini fallback:",
      openaiError.code || openaiError.message,
    );

    if (geminiClient) {
      try {
        const geminiModel = (geminiClient as any).getGenerativeModel({ model: GEMINI_MODEL });

        const geminiMessages = chatMessages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          }));

        const systemInstruction = chatMessages.find((m) => m.role === "system")?.content;

        const geminiResponse = await geminiModel.generateContent({
          contents: geminiMessages,
          systemInstruction: systemInstruction
            ? { parts: [{ text: systemInstruction }] }
            : undefined,
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.7,
          },
        });

        const reply = geminiResponse.response.text();
        console.log("Successfully used Gemini fallback");
        return { reply, usedProvider: "gemini" };
      } catch (geminiError: any) {
        console.error("Gemini fallback also failed:", geminiError);
        const isContentFilter =
          openaiError.code === "content_filter" ||
          openaiError.message?.includes("content") ||
          openaiError.message?.includes("filter");
        const reply = isContentFilter
          ? "Perfecto, entiendo. ¿Podrías darme más detalles sobre el proyecto?"
          : "¡Claro! Cuéntame más sobre lo que necesitas.";
        return { reply, usedProvider: "fallback" };
      }
    }

    const isContentFilter =
      openaiError.code === "content_filter" ||
      openaiError.message?.includes("content") ||
      openaiError.message?.includes("filter");
    const reply = isContentFilter
      ? "Entendido. ¿Puedes contarme más sobre el público objetivo?"
      : "¡Perfecto! ¿Qué más información puedes compartir?";
    console.log("Using fallback message, no Gemini API key available");
    return { reply, usedProvider: "fallback" };
  }
}
