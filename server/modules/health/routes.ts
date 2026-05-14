/**
 * HTTP routes del módulo health.
 *
 * Endpoint:
 *   - GET /healthz — verifica que el backend está vivo y reporta qué
 *     providers de IA están configurados (sin exponer las keys).
 *
 * Se usa para:
 *   - Health check del `deploy-arm.sh` post-swap del symlink.
 *   - Monitoreo externo (UptimeRobot, watchdog) sin necesidad de cookie/session.
 */
import type { Express } from "express";

export function registerHealthRoutes(app: Express): void {
  app.get("/healthz", (_req, res) => {
    res.json({
      ok: true,
      providers: {
        openai: !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        gemini: !!process.env.GEMINI_API_KEY,
      },
    });
  });
}
