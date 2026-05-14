import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Iniciar base de datos local si DATABASE_URL apunta a un servicio caído
  try {
    const { startLocalPostgres, LOCAL_DATABASE_URL } = await import("./core/postgres-startup");
    const dbUrl = await startLocalPostgres();
    process.env.DATABASE_URL = dbUrl;
    log(`Base de datos local activa`);
  } catch (err) {
    log(`[WARN] No se pudo iniciar base de datos local: ${err}`);
    log(`[WARN] Intentando con DATABASE_URL existente...`);
  }

  // Importar rutas dinámicamente DESPUÉS de configurar DATABASE_URL
  const { registerRoutes } = await import("./routes");
  const server = await registerRoutes(app);

  // Crear schema de base de datos si no existe
  try {
    const { execSync } = await import("child_process");
    execSync("npm run db:push 2>&1", { encoding: "utf8" });
    log("Schema de base de datos sincronizado");
  } catch (err: any) {
    log(`[WARN] db:push: ${err.message?.slice(0, 100)}`);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
