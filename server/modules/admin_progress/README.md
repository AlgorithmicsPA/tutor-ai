# Módulo `admin_progress`

Admin: resumen de progreso de students sobre lecciones publicadas. Extraído de `server/routes.ts` en la **Fase 6** de modularización (2026-05-14).

## Qué hace

Para cada usuario con `role = "student"`, agrega contra todas las lecciones publicadas:
- `lessonsCompleted` — cantidad de lecciones marcadas `completed`.
- `totalLessons` — total de lecciones publicadas.
- `averageScore` — promedio de quiz scores (0-100). Soporta formato legacy (numbers) y nuevo (`{index, score}`).
- `lastActivity` — `updatedAt` más reciente de cualquier registro de progress del user.

Se ignoran quiz scores malformados (warn al log, no se rompe el endpoint).

## Endpoints

| Verbo | Path | Quién | Descripción |
|---|---|---|---|
| GET | `/api/admin/progress` | admin | resumen de progreso de todos los students |

Respuesta: `UserProgressSummary[]` (ver `service.ts`).

## Estructura

```
modules/admin_progress/
├── index.ts        ← export registerAdminProgressModule(app)
├── routes.ts       ← Express handler
├── service.ts      ← getProgressSummary() + types
└── README.md
```

## Dependencias

- `../../storage` — `storage.getAllUsers()`, `storage.getAllLessons()`, `storage.getUserProgress(userId, lessonId)`.
- `@shared/schema` — implícito vía storage (tipos `User`, `Lesson`, `UserProgress`).

NO toca otros módulos.

## Cómo probarlo

```bash
# Login como admin → guarda cookies
curl -s -c /tmp/c.txt -X POST https://tutorai.duckdns.org/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<pwd>"}'

# Pedir el resumen
curl -s -b /tmp/c.txt https://tutorai.duckdns.org/api/admin/progress | jq
```

## Cómo desinstalarlo

1. Borrar el import + la línea `registerAdminProgressModule(app)` en `server/routes.ts`.
2. Borrar la carpeta `server/modules/admin_progress/`.

El endpoint `GET /api/admin/progress` deja de existir. El admin frontend (`/admin/progress`) mostrará error si se accede.

## Notas

- Endpoint **sin auth middleware explícito** — replica el comportamiento exacto del código previo a la extracción (verificación de admin queda del lado del frontend / cookie session). Si en el futuro se agrega `requireAdmin`, va en `routes.ts` de este módulo.
- O(N×M) — itera users × lecciones publicadas. Con la escala actual (1-10 students × ~10 lecciones) es despreciable; si crece, mover la agregación a una sola query SQL.
