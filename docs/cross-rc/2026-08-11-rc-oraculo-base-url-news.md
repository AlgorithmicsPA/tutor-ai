# 2026-08-11 · rc-oraculo → tutorai: `news/generator.ts` sin fallback local

**Qué toqué**: `server/modules/news/generator.ts`, `getOpenAI()`.

**Por qué**: `baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL` sin fallback. Con la env
sin setear —así está hoy el proceso en PM2— `baseURL` queda `undefined` y el SDK sale a
`api.openai.com`. Es exactamente el default silencioso que rompió tutorai el 04/08. El
archivo hermano `modules/tutor/openai-client.ts:29` ya tiene el `|| LLM_GATEWAY_LOCAL`; acá
faltaba.

**Cambio**: se agrega `const LLM_GATEWAY_LOCAL = "http://127.0.0.1:8318/v1"` y el
`|| LLM_GATEWAY_LOCAL` en el constructor.

**Hoy no está saliendo plata**: `getOpenAI()` devuelve `null` si no hay apiKey, y el proceso
no tiene ninguna. Era una violación latente: alcanzaba con que alguien seteara la key.

**Estado**: `tsc --noEmit` sin errores nuevos (los 9 que salen son preexistentes, en
`client/src/**` y `server/modules/{lessons,progress}/storage.ts`). **NO deployado** — queda
`bash oraculo/modules/deploy-arm/deploy-arm.sh tutorai` para la próxima ventana.
