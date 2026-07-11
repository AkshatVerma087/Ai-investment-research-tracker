// Browser-safe logger for the future frontend.
// Browsers cannot write to ai-agent/logs/app.log directly, so this sends logs
// to a backend endpoint. That backend endpoint should call logFrontendEvent().

function send(level, payload) {
  const entry = {
    level,
    // Keep the frontend payload simple and JSON-only so it is safe to send.
    ...(payload && typeof payload === "object" ? payload : { message: String(payload) }),
  };

  if (typeof fetch === "function") {
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    }).catch(() => {
      // Logging should never break the UI.
    });
  }

  // Also keep logs visible in the browser devtools console.
  const consoleMethod = level === "error" ? "error" : level === "warn" ? "warn" : level === "debug" ? "debug" : "info";
  console[consoleMethod](entry);
}

export const frontendLogger = {
  error(payload) {
    send("error", payload);
  },
  warn(payload) {
    send("warn", payload);
  },
  info(payload) {
    send("info", payload);
  },
  debug(payload) {
    send("debug", payload);
  },
};

