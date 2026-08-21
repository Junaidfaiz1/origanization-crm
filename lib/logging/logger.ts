type LogLevel = "info" | "warn" | "error" | "debug";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "secret",
  "authorization",
  "cookie",
  "auth_secret",
  "stripe_secret_key",
  "stripe_webhook_secret",
  "resend_api_key",
  "r2_secret_access_key",
  "r2_access_key_id",
]);

export type LogContext = {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  operation?: string;
  entityId?: string;
  durationMs?: number;
  error?: unknown;
  [key: string]: unknown;
};

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([key, nested]) => {
        if (SENSITIVE_KEYS.has(key.toLowerCase())) {
          return [key, "[REDACTED]"];
        }
        return [key, redact(nested)];
      },
    );
    return Object.fromEntries(entries);
  }

  return value;
}

function write(level: LogLevel, message: string, context: LogContext = {}) {
  const { error, ...rest } = context;
  const redactedRest = redact(rest);
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(redactedRest && typeof redactedRest === "object"
      ? (redactedRest as Record<string, unknown>)
      : {}),
    ...(error instanceof Error
      ? { errorName: error.name, errorMessage: error.message }
      : error
        ? { error: redact(error) }
        : {}),
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  info(message: string, context?: LogContext) {
    write("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    write("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    write("error", message, context);
  },
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === "development") {
      write("debug", message, context);
    }
  },
};
