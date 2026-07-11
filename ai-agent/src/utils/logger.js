import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Keep logs at the repo root so frontend and backend can share one log file.
// You can override this with LOG_DIR if you deploy somewhere with a special log path.
const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REPO_ROOT = path.resolve(APP_ROOT, "..");
const LOG_DIR = process.env.LOG_DIR ? path.resolve(process.env.LOG_DIR) : path.join(REPO_ROOT, "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

function normalizePayload(payload) {
  // Most of our code logs objects, but this keeps logger.info("text") safe too.
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload;
  }

  return { message: String(payload) };
}

function writeToFile(level, source, payload) {
  try {
    // Create logs/ on first use. recursive keeps this safe if it already exists.
    fs.mkdirSync(LOG_DIR, { recursive: true });

    // One JSON object per line makes logs easy to read and easy to parse later.
    const line = JSON.stringify({
      time: new Date().toISOString(),
      ...normalizePayload(payload),
      level,
      source,
    });

    fs.appendFileSync(LOG_FILE, `${line}\n`, "utf8");
  } catch {
    // Logging should never crash the app. If file logging fails,
    // the console log below still works.
  }
}

function log(level, source, payload) {
  writeToFile(level, source, payload);

  // Keep terminal logs exactly where you already expect them while developing.
  const consoleMethod = level === "error" ? "error" : level === "warn" ? "warn" : level === "debug" ? "debug" : "info";
  console[consoleMethod](normalizePayload(payload));
}

export function createLogger(source = "app") {
  return {
    error(payload) {
      log("error", source, payload);
    },
    warn(payload) {
      log("warn", source, payload);
    },
    info(payload) {
      log("info", source, payload);
    },
    debug(payload) {
      log("debug", source, payload);
    },
  };
}

// Existing AI/node files can keep importing logger with no code changes.
export const logger = createLogger("agent");

// Use this from backend/API entry points so backend logs land in the same file.
export const backendLogger = createLogger("backend");

export function logFrontendEvent(payload) {
  // A backend /api/log route can call this with logs sent by the browser.
  log(payload?.level ?? "info", "frontend", payload);
}

export const logFilePath = LOG_FILE;
