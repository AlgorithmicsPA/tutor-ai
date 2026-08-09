# Módulo `health`

Health check público del backend tutorai. Extraído de `server/routes.ts` en la **Fase 7** de modularización (2026-05-14), última fase del backend — cierre del monolito `routes.ts`.

## Qué hace

Expone un endpoint sin auth para verificar que:
1. El servidor Express está respondiendo (HTTP 200 + JSON).
2. Si el **gateway LLM contesta de verdad** — no si hay una variable de entorno seteada.

## Endpoints

| Verbo | Path | Quién | Descripción |
|---|---|---|---|
| GET | `/healthz` | público | liveness + estado real del proveedor de IA |

Respuesta:

```json
{
  "ok": true,
  "providers": { "openai": true, "gemini": false },
  "detail": {
    "openai": {
      "configured": true,
      "checked": true,
      "reachable": true,
      "baseUrl": "http://127.0.0.1:8318/v1",
      "status": 200,
      "error": null,
      "checkedAt": "2026-08-09T14:39:33.659Z"
    },
    "gemini": { "configured": false, "checked": false }
  }
}
```

### Qué significa cada campo — leerlo antes de basar un monitor en esto

| Campo | Significa | NO significa |
|---|---|---|
| `ok` | el proceso Express contesta | que el tutor sirva para algo |
| `providers.openai` | hay credencial **y** el gateway (`AI_INTEGRATIONS_OPENAI_BASE_URL`, default `:8318`) contestó `GET /models` con 2xx hace ≤15 s | que la cadena de cuota atrás del gateway conteste algo útil |
| `providers.gemini` | hay `GEMINI_API_KEY` seteada | que Google conteste — es un fallback directo, no hay proceso local que probar. Por eso `detail.gemini.checked` es `false`: el endpoint no miente diciendo que lo probó |

**El escalón que falta lo cubre otro**: que el tutor conteste algo real es E2E y lo prueba
`oraculo/modules/tutorai-probe/` (login real + `POST /api/tutor` preguntando 6×7, exige ver el
`42`) cada 3 h desde ARM y desde Hetzner. `/healthz` no reemplaza eso.

### Por qué se cambió (2026-08-09, reparador autónomo)

Hasta hoy `providers.openai` era `!!process.env.AI_INTEGRATIONS_OPENAI_API_KEY`: la key está
siempre seteada, así que el campo era `true` para toda la eternidad. Con el `llm-gateway`
caído, `/healthz` seguía devolviendo `ok:true` / `openai:true` mientras el tutor contestaba el
texto enlatado del `catch` (`/api/tutor` **falla en HTTP 200** — ver `modules/tutor/service.ts`
y `routes.ts`). Un health check que no distingue sano de roto no es un health check: es ruido
que además tranquiliza.

Probado en producción congelando el gateway (`kill -STOP` del pid de `llm-gateway`):
`providers.openai` pasó a `false` con `error:"timeout"`, y volvió a `true` al soltarlo.

Detalles de implementación que importan:

- **timeout 2 s** — un health check no puede colgarse porque el gateway se colgó.
- **cache 15 s** — el endpoint es público y sin auth; sin cache le abrimos un DoS gratis al
  gateway. Consecuencia: tras un cambio de estado, `/healthz` puede tardar hasta 15 s en
  reflejarlo.
- **nunca lanza** — cualquier error de red se traduce a `reachable:false` + `error`, el
  endpoint contesta 200 igual.
- **`ok` NO baja** cuando el gateway se cae. `ok` es liveness del backend; si bajara, un
  gateway caído dispararía auto-rollback en el próximo deploy y "sitio caído" en el monitoreo
  externo, que es una falla distinta y mandaría a buscar donde no es.

## Estructura

```
modules/health/
├── index.ts        ← export registerHealthModule(app)
├── routes.ts       ← Express handler /healthz + probe del gateway
└── README.md
```

## Dependencias

Ninguna (usa `fetch` nativo de Node 20). Lee `AI_INTEGRATIONS_OPENAI_API_KEY`,
`AI_INTEGRATIONS_OPENAI_BASE_URL` y `GEMINI_API_KEY` del entorno.

NO toca otros módulos. NO toca DB.

## Cómo probarlo

```bash
curl -s https://tutorai.gruposer.com.ar/healthz | jq
curl -s http://localhost:3001/healthz | jq
```

Probar que **discrimina** (que es lo único que importa de un health check) — congelar el
gateway un instante en vez de matarlo, así no hay que reiniciar nada:

```bash
GW=$(pm2 jlist | jq -r '.[]|select(.name=="llm-gateway")|.pid')
kill -STOP $GW; curl -s localhost:3001/healthz | jq .providers.openai   # → false
kill -CONT $GW                                                          # (cache: hasta 15 s)
```

## Quién lo consume

Al 2026-08-09, **nadie de forma automática** — verificado, no supuesto:

- `deploy-arm.sh tutorai` usa `health_endpoint: "/"`, **no** `/healthz`
  (`jq '.projects.tutorai.health_endpoint' /home/ubuntu/deployments/registry.json`).
- UptimeRobot sólo monitorea `oraculo.gruposer.com.ar/status` y `seguridadrosario.com`
  (verificado contra su API). Este endpoint **no** está ahí.

Este README decía lo contrario ("`HEALTH_PATH=/healthz` en registry.json", "watchdog externo /
UptimeRobot") y esa mentira es parte de por qué el endpoint pudo quedarse años mintiendo sin
que nadie lo notara: parecía load-bearing. Si algún día se lo enchufa a un monitor, que sea
mirando `providers.openai`, y que el que lo enchufe actualice esta sección.

## Cómo desinstalarlo

1. Borrar el import + la línea `registerHealthModule(app)` en `server/routes.ts`.
2. Borrar la carpeta `server/modules/health/`.

Hoy no rompe ningún deploy (el health check del deploy va contra `/`), pero sí deja ciego a
cualquiera que lo haya empezado a consumir — revisar esta sección antes.

## Notas

- Endpoint deliberadamente **público** (sin auth). No expone secrets: ni la key ni el cuerpo de
  la respuesta del gateway, sólo booleanos, el código HTTP y la baseURL (que es loopback).
- Si se agregan providers nuevos (Anthropic, Mistral, etc.), sumarlos al objeto `providers` —
  y probarlos de verdad, o marcarlos `checked: false`. Un flag que no se probó tiene que
  decirlo.
