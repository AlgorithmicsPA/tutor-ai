/**
 * Cliente LLM del módulo tutor.
 *
 * Encapsula:
 *   - Cliente OpenAI (vía Replit AI Integrations o key propia)
 *   - Cliente Gemini (fallback de content_filter / errores OpenAI)
 *
 * Reglas:
 *   - El modelo OpenAI por default es "gpt-5" (released agosto 2025). NO cambiar
 *     sin pedido explícito del usuario.
 *   - El modelo Gemini por default es "gemini-2.5-flash". NO cambiar idem.
 */
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

// ⛔ El plan OpenAI murió el 2026-08-04 y no vuelve (regla dura de Pablo). Sin `baseURL`
// explícita el SDK se va derecho a api.openai.com: eso era esta app hasta hoy — pedía
// "gpt-5" contra OpenAI con una key `dummy-no-op-placeholder`, fallaba, y el tutor
// contestaba con el texto enlatado del catch. Por eso el default ya NO es OpenAI sino el
// gateway local ($0, cuota OAuth de Anthropic), que traduce los nombres `gpt-*` a Claude.
// El nombre del modelo no se toca acá: se traduce en la infra (modules/llm-gateway).
const LLM_GATEWAY_LOCAL = "http://127.0.0.1:8318/v1";
// Las keys placeholder que dejó Replit valen lo mismo que no tener nada.
const envKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const keyUsable = envKey && !envKey.startsWith("dummy") ? envKey : "local-gateway";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
export const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || LLM_GATEWAY_LOCAL,
  apiKey: keyUsable,
});

// Gemini provider for alternative AI backend.
// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user
export const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export const OPENAI_MODEL = "gpt-5";
export const GEMINI_MODEL = "gemini-2.5-flash";
