# Módulo `tutor` — Chat IA principal de TutorAI

Feature **CORE** del producto: el chat con el tutor virtual que conversa con la usuaria, responde dudas y arma propuestas. Usa OpenAI (`gpt-5`) como provider principal y Gemini (`gemini-2.5-flash`) como fallback ante errores o content filter.

Este módulo también encapsula el endpoint de **scoring de quiz** (`/api/grade`), que comparte el binding al cliente LLM (aunque hoy solo hace comparación numérica determinística, queda agrupado por proximidad funcional).

Fase 2 del MODULAR_PLAN. Sigue el patrón del módulo `news/`.

## Cómo se usa

Desde `server/routes.ts` (o el punto donde se cablea el Express app):

```ts
import { registerTutorModule } from "./modules/tutor";
registerTutorModule(app);
```

Eso registra:

- `POST /api/tutor` — chat con el tutor IA. Body: `{ messages, provider?, system? }`. Response: `{ reply }`. Nunca devuelve 500; ante fallo de OpenAI + Gemini, responde con texto amistoso.
- `POST /api/grade` — score de un item tipo `quiz`. Body: `{ itemType, answerIndex, userIndex }`. Response: `{ score }` (1 si acierta, 0 si no).

## Archivos

| Archivo | Rol |
|---|---|
| `index.ts` | Entry. Exporta `registerTutorModule(app)` y APIs internas (`runTutorChat`, `scoreQuiz`, `openai`, `geminiClient`). |
| `routes.ts` | Definición de los 2 endpoints HTTP. Validación con zod desde `@shared/schema`. |
| `service.ts` | Lógica pura: `scoreQuiz` (puro) + `runTutorChat` (orquesta OpenAI → Gemini → fallback amistoso, sin lanzar). |
| `openai-client.ts` | Instancia singleton del cliente OpenAI (vía Replit AI Integrations) y Gemini, más constantes de modelo (`OPENAI_MODEL`, `GEMINI_MODEL`). |

## Dependencias

- **Schemas Zod compartidos**: `tutorRequestSchema`, `gradeRequestSchema`, `TutorResponse`, `GradeResponse` desde `@shared/schema`.
- **Externos**: `openai` (npm), `@google/genai` (npm).
- **Auth**: no requiere — los endpoints son públicos a nivel HTTP (lo gestiona el frontend autenticado).
- **DB**: ninguna directa (el progreso del quiz se guarda vía el módulo `progress`).

## Cómo probar

```bash
# Endpoint público: tutor (necesita prompt válido)
curl -s -X POST https://tutorai.duckdns.org/api/tutor \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hola"}]}' | jq

# Grade (puro determinístico)
curl -s -X POST https://tutorai.duckdns.org/api/grade \
  -H "Content-Type: application/json" \
  -d '{"itemType":"quiz","answerIndex":2,"userIndex":2}' | jq
# → {"score":1}
```

## Cómo desinstalar

1. Sacar `registerTutorModule(app)` de `server/routes.ts`.
2. Borrar la carpeta `server/modules/tutor/`.
3. El frontend perderá el chat IA (página principal del producto) — no es desinstalable en producción salvo reemplazo.

## Variables de entorno

- `AI_INTEGRATIONS_OPENAI_API_KEY` (preferido) o `OPENAI_API_KEY` — auth OpenAI/Replit AI Integrations.
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — opcional, base URL alternativa.
- `GEMINI_API_KEY` — opcional, habilita fallback Gemini. Sin esta, el fallback usa solo texto amistoso.

## Notas de modelo (regla dura)

- `OPENAI_MODEL = "gpt-5"` (released August 7, 2025) — **NO cambiar sin pedido explícito de Pablo**.
- `GEMINI_MODEL = "gemini-2.5-flash"` — **NO cambiar sin pedido explícito de Pablo**.

## Histórico

- 2026-05-14 — extraído del monolito `server/routes.ts` como Fase 2 de modularización.
