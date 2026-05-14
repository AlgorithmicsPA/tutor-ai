# Módulo `health`

Health check público del backend tutorai. Extraído de `server/routes.ts` en la **Fase 7** de modularización (2026-05-14), última fase del backend — cierre del monolito `routes.ts`.

## Qué hace

Expone un endpoint sin auth para verificar que:
1. El servidor Express está respondiendo (HTTP 200 + JSON).
2. Qué providers de IA tienen credencial configurada en el entorno (sin exponer las keys, solo `true`/`false`).

## Endpoints

| Verbo | Path | Quién | Descripción |
|---|---|---|---|
| GET | `/healthz` | público | health check + flags de providers |

Respuesta:

```json
{
  "ok": true,
  "providers": {
    "openai": true,
    "gemini": false
  }
}
```

## Estructura

```
modules/health/
├── index.ts        ← export registerHealthModule(app)
├── routes.ts       ← Express handler /healthz
└── README.md
```

## Dependencias

Ninguna. Solo lee `process.env.AI_INTEGRATIONS_OPENAI_API_KEY` y `process.env.GEMINI_API_KEY`.

NO toca otros módulos. NO toca DB.

## Cómo probarlo

```bash
curl -s https://tutorai.duckdns.org/healthz | jq
# {"ok":true,"providers":{"openai":true,"gemini":false}}
```

Local (dev):

```bash
curl -s http://localhost:3001/healthz | jq
```

## Quién lo consume

- `deploy-arm.sh tutorai` — health check post-swap del release (`HEALTH_PATH=/healthz` en `registry.json`).
- Watchdog externo / UptimeRobot — si se configura.

## Cómo desinstalarlo

1. Borrar el import + la línea `registerHealthModule(app)` en `server/routes.ts`.
2. Borrar la carpeta `server/modules/health/`.

**Atención**: si lo borrás, `deploy-arm.sh tutorai` va a fallar el health check y hacer auto-rollback. Reemplazar la ruta en `registry.json` antes de desinstalar.

## Notas

- Endpoint deliberadamente **público** (sin auth). No expone secrets — solo flags booleanos.
- Si se agregan providers nuevos (Anthropic, Mistral, etc.), sumarlos al objeto `providers` en `routes.ts`.
