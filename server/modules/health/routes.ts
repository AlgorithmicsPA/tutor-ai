/**
 * HTTP routes del módulo health.
 *
 * Endpoint:
 *   - GET /healthz — verifica que el backend está vivo y reporta el estado REAL
 *     del proveedor de IA (sin exponer las keys).
 *
 * Qué significa cada campo (2026-08-09, reparador):
 *   - `ok`               → el proceso Express contesta. Es liveness, nada más.
 *   - `providers.openai` → el gateway LLM (`AI_INTEGRATIONS_OPENAI_BASE_URL`,
 *                          por defecto :8318) **contestó recién**. Antes esto era
 *                          `!!process.env.AI_INTEGRATIONS_OPENAI_API_KEY`: con el
 *                          gateway muerto seguía diciendo `true` y el tutor
 *                          contestaba el texto enlatado del catch en silencio.
 *   - `providers.gemini` → fallback directo a Google (no hay proceso local que
 *                          probar): sigue siendo "hay credencial configurada".
 *                          Por eso `detail.gemini.checked` es `false` — no miente
 *                          diciendo que lo probó.
 *
 * Lo que este endpoint NO prueba: que la cadena de cuota atrás del gateway
 * conteste algo útil. Eso es E2E y lo cubre `oraculo/modules/tutorai-probe/`
 * (pregunta 6×7 y exige ver el 42) cada 3 h desde ARM y desde Hetzner.
 */
import type { Express } from "express";

/** Igual que en `modules/tutor/openai-client.ts`: OpenAI salió de la cadena. */
const LLM_GATEWAY_LOCAL = "http://127.0.0.1:8318/v1";
/** El probe no puede colgar un health check: corta a los 2 s. */
const PROBE_TIMEOUT_MS = 2000;
/** Cache corto: /healthz es público, no le abrimos un DoS gratis al gateway. */
const PROBE_CACHE_MS = 15_000;

type ProbeResult = {
  reachable: boolean;
  status: number | null;
  error: string | null;
  at: number;
};

let cached: ProbeResult | null = null;
let inflight: Promise<ProbeResult> | null = null;

function gatewayBaseUrl(): string {
  const raw = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || LLM_GATEWAY_LOCAL;
  return raw.replace(/\/+$/, "");
}

async function probeGateway(): Promise<ProbeResult> {
  const url = `${gatewayBaseUrl()}/models`;
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return {
      reachable: res.ok,
      status: res.status,
      error: res.ok ? null : `HTTP ${res.status}`,
      at: Date.now(),
    };
  } catch (err: any) {
    // Timeout, ECONNREFUSED, DNS: el gateway no está. Nunca lanzar: el health
    // check tiene que contestar igual, pero diciendo la verdad.
    return {
      reachable: false,
      status: null,
      error: String(err?.name === "TimeoutError" ? "timeout" : err?.message || err).slice(0, 120),
      at: Date.now(),
    };
  }
}

/** Devuelve el estado del gateway, cacheado 15 s y sin disparar probes en paralelo. */
async function gatewayState(): Promise<ProbeResult> {
  if (cached && Date.now() - cached.at < PROBE_CACHE_MS) return cached;
  if (!inflight) {
    inflight = probeGateway().then((r) => {
      cached = r;
      inflight = null;
      return r;
    });
  }
  return inflight;
}

export function registerHealthRoutes(app: Express): void {
  app.get("/healthz", async (_req, res) => {
    const configured = !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    const gw = await gatewayState();
    const geminiConfigured = !!process.env.GEMINI_API_KEY;

    res.json({
      ok: true,
      providers: {
        // true SOLO si hay credencial Y el gateway contestó recién.
        openai: configured && gw.reachable,
        gemini: geminiConfigured,
      },
      detail: {
        openai: {
          configured,
          checked: true,
          reachable: gw.reachable,
          baseUrl: gatewayBaseUrl(),
          status: gw.status,
          error: gw.error,
          checkedAt: new Date(gw.at).toISOString(),
        },
        gemini: {
          configured: geminiConfigured,
          checked: false,
        },
      },
    });
  });
}
