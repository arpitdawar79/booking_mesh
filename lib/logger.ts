type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  label: string;
  message: string;
  meta?: Record<string, unknown>;
}

function formatLog(entry: LogEntry): string {
  let line = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.label}] ${entry.message}`;
  if (entry.meta && Object.keys(entry.meta).length > 0) {
    line += ` | ${JSON.stringify(entry.meta)}`;
  }
  return line;
}

export function log(level: LogLevel, label: string, message: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    label,
    message,
    meta,
  };

  const formatted = formatLog(entry);

  if (level === "error") {
    console.error(formatted);
  } else if (level === "warn") {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

export const logger = {
  debug: (label: string, message: string, meta?: Record<string, unknown>) => log("debug", label, message, meta),
  info: (label: string, message: string, meta?: Record<string, unknown>) => log("info", label, message, meta),
  warn: (label: string, message: string, meta?: Record<string, unknown>) => log("warn", label, message, meta),
  error: (label: string, message: string, meta?: Record<string, unknown>) => log("error", label, message, meta),
};
