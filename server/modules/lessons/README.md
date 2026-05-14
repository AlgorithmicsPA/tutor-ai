# Módulo `lessons`

CRUD de lecciones + generación con IA. Extraído de `server/routes.ts` en la **Fase 3** de modularización (2026-05-14).

## Qué hace

- Lista lecciones publicadas (alumnos) y todas (admin).
- CRUD: crear, leer, actualizar, borrar.
- Genera una lección modular interactiva con OpenAI a partir de título/objetivos/audiencia/duración y la persiste en DB.

## Endpoints

| Verbo | Path | Quién | Descripción |
|---|---|---|---|
| GET  | `/api/lessons`            | alumnos | lecciones publicadas |
| GET  | `/api/admin/lessons`      | admin   | todas (incluye unpublished) |
| GET  | `/api/lessons/:lessonId`  | ambos   | lección por `lesson_id` (string) |
| POST | `/api/lessons`            | admin   | crear lección manual |
| PUT  | `/api/lessons/:id`        | admin   | actualizar (id numérico) |
| DELETE | `/api/lessons/:id`      | admin   | borrar (id numérico) |
| POST | `/api/lessons/generate`   | admin   | generar con IA + persistir |

## Estructura

```
modules/lessons/
├── index.ts        ← export registerLessonsModule(app)
├── routes.ts       ← Express handlers
├── service.ts      ← wrapper del storage compartido (CRUD)
├── generator.ts    ← prompt OpenAI + mapeo de imágenes + persist
└── README.md
```

## Dependencias

- `@shared/schema` — `insertLessonSchema`, `generateLessonRequestSchema`, tipos `Lesson` / `InsertLesson`.
- `../../storage` — repository monolítico (Drizzle). Cuando se modularice storage, solo cambia `service.ts`.
- `../tutor/openai-client` — cliente OpenAI compartido (Fase 2). **No duplicar el SDK.**

## Cómo se activa

En `server/routes.ts`:

```ts
import { registerLessonsModule } from "./modules/lessons";
// ...
registerLessonsModule(app);
```

## Cómo se prueba

```bash
# health
curl -sf http://localhost:3001/healthz

# lista publicadas
curl -sf http://localhost:3001/api/lessons

# admin (todas)
curl -sf http://localhost:3001/api/admin/lessons

# por lessonId
curl -sf http://localhost:3001/api/lessons/<lesson-id>
```

## Cómo se desinstala

1. Borrar `server/routes.ts` la llamada a `registerLessonsModule(app)` y el import.
2. Re-pegar los handlers viejos desde el git history previo al commit Fase 3, o dejar el feature apagado.
3. `npm run build` + `deploy-arm.sh tutorai`.

Notar: las tablas Drizzle (`lessons`) NO las maneja este módulo — viven en `shared/schema.ts`. Desinstalar el módulo no borra datos.

## Notas

- El prompt de generación y el mapeo de imágenes son idénticos al bloque original — comportamiento del endpoint `/api/lessons/generate` se conserva 1:1.
- El modelo OpenAI por default es `gpt-5`. NO cambiar sin pedido explícito (regla del módulo `tutor`).
- Fase 3 / 7 del plan en `/home/ubuntu/projects/tutorai/MODULAR_PLAN.md`.
