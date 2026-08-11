import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { spawn } from "child_process";
import { existsSync } from "fs";
import type { WeeklyNews, NewsClassContent } from "@shared/schema";
import { TOPIC_LABELS } from "@shared/schema";

const CLAUDE_CLI = "/usr/local/bin/claude";
const LLM_GATEWAY_LOCAL = "http://127.0.0.1:8318/v1";

function getOpenAI(): OpenAI | null {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "dummy-no-op-placeholder") return null;
  return new OpenAI({
    // Sin el `|| LLM_GATEWAY_LOCAL` que sí tiene modules/tutor/openai-client.ts, un env
    // vacío deja baseURL undefined y el SDK sale a api.openai.com — el default silencioso
    // que ya rompió tutorai el 04/08 y el motivo por el que existe el bloque C del guard.
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || LLM_GATEWAY_LOCAL,
    apiKey,
  });
}

function getGemini(): GoogleGenAI | null {
  return process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null;
}

function hasClaudeCLI(): boolean {
  return existsSync(CLAUDE_CLI);
}

function extractJson(text: string): string {
  // Quitar bloque de código markdown si viene
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Sino, buscar el primer { y último }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) return text.slice(first, last + 1);
  return text;
}

async function generateWithClaudeCLI(prompt: string, timeoutMs = 120000): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      CLAUDE_CLI,
      ["-p", prompt, "--output-format", "json", "--model", "claude-opus-5[1m]"],
      {
        env: { ...process.env, ANTHROPIC_API_KEY: "" },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      reject(new Error("claude CLI timeout"));
    }, timeoutMs);

    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error(`claude CLI exit ${code}: ${stderr.slice(0, 300)}`));
      }
      try {
        const parsed = JSON.parse(stdout);
        if (parsed.is_error) {
          return reject(new Error(`claude CLI error: ${parsed.result || "unknown"}`));
        }
        resolve(parsed.result || "");
      } catch (e: any) {
        reject(new Error(`claude CLI bad output: ${e.message}`));
      }
    });
  });
}

function buildPrompt(userName: string, items: WeeklyNews[], interests: string[], customTopics: string[] = []): string {
  const newsBlock = items.slice(0, 8).map((n, i) =>
    `[${i + 1}] ID=${n.id} | ${n.source ?? "?"} | ${n.title}\nTópicos: ${(n.topics || []).join(", ")}\nResumen: ${(n.summary || "").slice(0, 400)}\nLink: ${n.link}`
  ).join("\n\n");

  const presetList = interests.length
    ? interests.map(t => `- ${TOPIC_LABELS[t] || t}`).join("\n")
    : "";
  const customList = customTopics.length
    ? customTopics.map(t => `- (libre) ${t}`).join("\n")
    : "";
  const interestList = [presetList, customList].filter(Boolean).join("\n") ||
    "- (todavía no seleccionó intereses — elegí lo más relevante de cada tipo)";

  return `Sos un divulgador de IA para adolescentes y adultos hispanohablantes. Armá una "clase de noticias" semanal personalizada para ${userName}.

INTERESES DEL LECTOR:
${interestList}

NOTICIAS DE ESTA SEMANA (elegí las 5-8 más relevantes según sus intereses):
${newsBlock}

INSTRUCCIONES:
1. Escribí en español argentino, voseo. Tono adulto pero accesible — nada de infantilizar.
2. Asumí un lector adolescente o adulto con curiosidad general. Podés usar términos técnicos (LLM, fine-tuning, agentes, multimodal) pero aclarándolos brevemente la primera vez que aparecen.
3. Armá 5 a 8 secciones, una por noticia. Cada sección: título claro + párrafo de 120-200 palabras que explique QUÉ pasó, POR QUÉ importa y qué implicancias tiene (laborales, sociales, técnicas).
4. IMPORTANTE: usá SIEMPRE el campo "newsId" con el ID numérico exacto de la noticia original (el "ID=" del bloque).
5. "intro" de 3-4 oraciones saludando y poniendo contexto de qué fue lo más fuerte de la semana.
6. "outro" de 2-3 oraciones cerrando con una reflexión o pregunta abierta.
7. Agregá 2 preguntas de quiz (opción múltiple, 4 opciones, "answer" como índice 0-3 y "explanation" corta).
8. Devolvé SOLO JSON válido con este formato exacto:

{
  "intro": "string",
  "sections": [
    {"title":"string","body":"string","topic":"string","sourceTitle":"string","sourceUrl":"string","sourceName":"string","newsId":123}
  ],
  "outro": "string",
  "quiz": [
    {"question":"string","choices":["a","b","c","d"],"answer":0,"explanation":"string"}
  ]
}`;
}

export async function generateNewsClass(
  userName: string,
  items: WeeklyNews[],
  interests: string[],
  customTopics: string[] = [],
): Promise<NewsClassContent> {
  if (items.length === 0) {
    return {
      intro: `Hola ${userName}, esta semana no pude traer noticias nuevas. ¡Volvé el próximo sábado!`,
      sections: [],
      outro: "Mientras tanto, podés revisar las lecciones disponibles.",
      quiz: [],
    };
  }

  const prompt = buildPrompt(userName, items, interests, customTopics);
  const gemini = getGemini();
  const openai = getOpenAI();
  const claudeAvailable = hasClaudeCLI();

  if (!gemini && !openai && !claudeAvailable) {
    throw new Error(
      "No hay proveedor de IA disponible. Instalá el CLI claude o agregá GEMINI_API_KEY.",
    );
  }

  // Preferir Claude CLI local (usa auth del sistema, sin API key)
  if (claudeAvailable) {
    try {
      const raw = await generateWithClaudeCLI(prompt);
      return JSON.parse(extractJson(raw));
    } catch (err: any) {
      console.warn("[news] claude CLI falló, pruebo otros:", err.message);
    }
  }

  if (gemini) {
    try {
      const resp = await (gemini as any).models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      });
      const text = resp?.text ?? resp?.response?.text?.() ?? "";
      if (text) return JSON.parse(text);
    } catch (err: any) {
      console.warn("[news] Gemini falló, pruebo OpenAI:", err.message);
    }
  }

  if (!openai) throw new Error("Gemini falló y no hay OpenAI configurado");

  const resp = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: "Sos un tutor educativo. Devolvés SOLO JSON válido." },
      { role: "user", content: prompt },
    ],
    max_completion_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const content = resp.choices[0]?.message?.content;
  if (!content) throw new Error("No se pudo generar la clase de noticias");
  return JSON.parse(content);
}
