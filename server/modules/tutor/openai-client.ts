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

// Replit AI Integrations: provee acceso OpenAI-compatible sin requerir API key propia.
// Charges billed to Replit credits.
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
export const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
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
