import "server-only";

type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, boolean | number | string | null | undefined>;

function writeLog(level: LogLevel, event: string, context: LogContext): void {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  });

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.info(payload);
}

export const logger = {
  info(event: string, context: LogContext = {}): void {
    writeLog("info", event, context);
  },
  warn(event: string, context: LogContext = {}): void {
    writeLog("warn", event, context);
  },
  error(event: string, context: LogContext = {}): void {
    writeLog("error", event, context);
  },
};