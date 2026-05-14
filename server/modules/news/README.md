# Módulo `news` — Clase semanal de noticias de IA

Feature aislado: arma una clase de noticias semanal personalizada por usuaria, traída de feeds RSS de IA, clasificada por tópico, y resumida con LLM (Claude CLI → Gemini → OpenAI).

Es el **template de referencia de modularidad** del backend de TutorAI (Fase 1 del MODULAR_PLAN).

## Cómo se usa

Desde `server/routes.ts` (o cualquier punto donde se cablea el Express app):

```ts
import { registerNewsModule } from "./modules/news";
registerNewsModule(app);
```

Eso registra automáticamente:

- `GET  /api/news/topics`         — lista de tópicos disponibles para onboarding (público)
- `GET  /api/news/interests`      — intereses guardados del user (auth)
- `POST /api/news/interests`      — guardar intereses (auth)
- `GET  /api/news/all`            — todas las noticias crudas de la semana (auth)
- `GET  /api/news/weekly`         — clase semanal personalizada (auth, cacheada por user+semana)
- `POST /api/news/feedback`       — feedback de una noticia (auth, ajusta scores de interés)
- `POST /api/internal/news/fetch` — trigger del cron semanal (token `INTERNAL_CRON_TOKEN`)

## Archivos

| Archivo | Rol |
|---|---|
| `index.ts` | Entry. Exporta `registerNewsModule(app)` y APIs internas reutilizables. |
| `routes.ts` | Definición de los 7 endpoints HTTP. |
| `job.ts` | `runWeeklyFetch()` — corre cada sábado AM, baja feeds y persiste noticias. |
| `rss.ts` | Fetch + parseo de feeds RSS de IA (TechCrunch AI, The Verge AI, etc.) + `weekOfMonday`. |
| `topics.ts` | `classifyTopics(text)` por keywords y `scoreNewsForUser`. |
| `generator.ts` | `generateNewsClass(...)` — prompt + fallback Claude CLI → Gemini → OpenAI. |

## Dependencias

- **DB / storage**: usa `../../storage` (re-export Drizzle) para `weeklyNews`, `newsClasses`, `newsFeedback`, `userInterests`, `userCustomInterests`. Estos métodos del `storage.ts` raíz se moverán acá en una fase posterior cuando se desarme el storage monolítico.
- **Schema compartido**: `@shared/schema` (Drizzle, tablas + constantes `AVAILABLE_TOPICS`, `TOPIC_LABELS`).
- **Externos**: `OpenAI`, `@google/genai`, `fast-xml-parser`, Claude CLI local (`/usr/local/bin/claude`).
- **Auth**: `req.isAuthenticated()` + `req.user` (Passport, instalado por el módulo `auth` en Fase 2).
- **Cron externo**: el job `runWeeklyFetch` se dispara semanalmente desde fuera del módulo (cron sábados AM) vía `POST /api/internal/news/fetch` con token.

## Cómo probar

```bash
# topics público
curl -s https://tutorai.duckdns.org/api/news/topics | jq

# endpoints auth (necesitan cookie de sesión)
curl -s -b /tmp/cookies.txt https://tutorai.duckdns.org/api/news/interests | jq
```

## Cómo desinstalar

1. Sacar `registerNewsModule(app)` de `server/routes.ts`.
2. Borrar la carpeta `server/modules/news/`.
3. (Opcional) drop de tablas `weekly_news`, `news_classes`, `news_feedback`, `user_interests`, `user_custom_interests` si no se quiere preservar data histórica.

## Variables de entorno

- `INTERNAL_CRON_TOKEN` — auth del endpoint interno del cron.
- `AI_INTEGRATIONS_OPENAI_API_KEY` / `OPENAI_API_KEY` — fallback OpenAI.
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — opcional, base URL alternativa.
- `GEMINI_API_KEY` — fallback Gemini (preferido sobre OpenAI).
- Claude CLI local en `/usr/local/bin/claude` se prefiere a todos si existe.

## Histórico

- 2026-04-19 — versión inicial bajo `server/news/`.
- 2026-05-14 — movido a `server/modules/news/` como Fase 1 de modularización. Wrapper compat en `server/news/` (deprecado, ver `_deprecated/README.md`).
