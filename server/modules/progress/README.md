# Módulo `progress`

Tracking de progreso de alumnos por lección (quiz scores, items completados, posición, completitud). Extraído de `server/routes.ts` en la **Fase 4** de modularización (2026-05-14).

## Qué hace

- Devuelve el progreso de un alumno en una lección puntual (o un shape vacío si todavía no existe).
- Upsert: si no existe `(userId, lessonId)`, crea. Si existe, actualiza con los datos nuevos.

## Endpoints

| Verbo | Path | Quién | Descripción |
|---|---|---|---|
| GET  | `/api/progress/:userId/:lessonId` | alumno | progreso del alumno en una lección |
| POST | `/api/progress`                    | alumno | upsert del progreso |

## Estructura

```
modules/progress/
├── index.ts        ← export registerProgressModule(app)
├── routes.ts       ← Express handlers
├── service.ts      ← wrapper del storage compartido (CRUD)
└── README.md
```

## Dependencias

- `@shared/schema` — `insertUserProgressSchema`, tipos `UserProgress` / `InsertUserProgress`.
- `../../storage` — repository monolítico (Drizzle). Cuando se modularice storage, solo cambia `service.ts`.

## Cómo se activa

En `server/routes.ts`:

```ts
import { registerProgressModule } from "./modules/progress";
// ...
registerProgressModule(app);
```

## Cómo se prueba

```bash
# health
curl -sf http://localhost:3001/healthz

# get progress (devuelve shape vacío si no hay row)
curl -sf http://localhost:3001/api/progress/1/intro-ia

# upsert
curl -sf -X POST http://localhost:3001/api/progress \
  -H 'Content-Type: application/json' \
  -d '{"userId":"1","lessonId":"intro-ia","quizScores":[],"completedItems":[],"lastPosition":0,"completed":false}'
```

## Cómo se desinstala

1. Borrar de `server/routes.ts` la llamada a `registerProgressModule(app)` y el import.
2. Re-pegar los handlers viejos desde el git history previo al commit Fase 4, o dejar el feature apagado.
3. `npm run build` + `deploy-arm.sh tutorai`.

Notar: la tabla Drizzle (`user_progress`) NO la maneja este módulo — vive en `shared/schema.ts`. Desinstalar el módulo no borra datos.

## Notas

- El endpoint GET devuelve `{ userId, lessonId, quizScores: [], completedItems: [], lastPosition: 0, completed: false }` cuando no hay row, para que el frontend pueda renderizar sin null checks. Conservar ese shape al modificar.
- `quizScores` admite legacy (`number`) y formato nuevo (`{ index, score }`). El admin-progress route (Fase 6) se encarga de la lectura tolerante.
- Fase 4 / 7 del plan en `/home/ubuntu/projects/tutorai/MODULAR_PLAN.md`.
