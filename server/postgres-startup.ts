import { spawn, execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".postgres", "data");
const LOG_FILE = path.join(process.cwd(), ".postgres", "logfile");
const SOCKET_DIR = "/tmp/postgresql";
const PG_PORT = 5433;
const PG_USER = "tutoria";
const PG_DB = "tutoria_db";

export const LOCAL_DATABASE_URL = `postgresql://${PG_USER}@localhost:${PG_PORT}/${PG_DB}?host=${SOCKET_DIR}`;

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function isPostgresReady(): boolean {
  try {
    execSync(`pg_isready -h ${SOCKET_DIR} -p ${PG_PORT} -U ${PG_USER} 2>/dev/null`, {
      encoding: "utf8",
    });
    return true;
  } catch {
    return false;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function startLocalPostgres(): Promise<string> {
  console.log("[postgres] Verificando base de datos local...");

  // Crear directorios necesarios
  mkdirSync(path.join(process.cwd(), ".postgres"), { recursive: true });
  mkdirSync(SOCKET_DIR, { recursive: true });

  // Inicializar base de datos si no existe
  if (!existsSync(DATA_DIR)) {
    console.log("[postgres] Inicializando base de datos...");
    run(`initdb -D ${DATA_DIR} --no-locale --encoding=UTF8 -U ${PG_USER}`);
  }

  // Verificar si ya está corriendo
  if (isPostgresReady()) {
    console.log("[postgres] Base de datos ya está activa");
    await ensureDatabase();
    return LOCAL_DATABASE_URL;
  }

  // Iniciar PostgreSQL como proceso hijo (se mantiene vivo con el servidor Node.js)
  console.log("[postgres] Iniciando servidor PostgreSQL local...");
  const pg = spawn(
    "postgres",
    [
      "-D", DATA_DIR,
      "-p", String(PG_PORT),
      "-k", SOCKET_DIR,
      "-c", "listen_addresses=",  // Solo socket Unix, no TCP
    ],
    {
      detached: false, // No detach - muere si Node.js muere
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  pg.stdout?.on("data", (d) => process.stdout.write(`[postgres] ${d}`));
  pg.stderr?.on("data", (d) => process.stderr.write(`[postgres] ${d}`));

  pg.on("exit", (code) => {
    if (code !== 0) console.error(`[postgres] Proceso terminó con código ${code}`);
  });

  // Esperar hasta que esté listo (máx 15 segundos)
  for (let i = 0; i < 30; i++) {
    await wait(500);
    if (isPostgresReady()) {
      console.log("[postgres] Listo para aceptar conexiones");
      await ensureDatabase();
      return LOCAL_DATABASE_URL;
    }
  }

  throw new Error("[postgres] No se pudo iniciar la base de datos local");
}

async function ensureDatabase(): Promise<void> {
  // Crear la base de datos si no existe
  try {
    execSync(
      `psql -h ${SOCKET_DIR} -p ${PG_PORT} -U ${PG_USER} -d postgres -c "SELECT 1 FROM pg_database WHERE datname='${PG_DB}'" | grep -q 1 || psql -h ${SOCKET_DIR} -p ${PG_PORT} -U ${PG_USER} -d postgres -c "CREATE DATABASE ${PG_DB};"`,
      { encoding: "utf8", shell: "/bin/bash" }
    );
    console.log(`[postgres] Base de datos '${PG_DB}' lista`);
  } catch {
    // Ya existe o error menor, continuar
  }
}
