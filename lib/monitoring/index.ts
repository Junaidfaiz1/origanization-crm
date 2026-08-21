import { logger } from "@/lib/logging/logger";

type CaptureContext = {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  extra?: Record<string, unknown>;
};

export const monitoring = {
  captureException(error: unknown, context: CaptureContext = {}) {
    logger.error("Unhandled exception", {
      ...context,
      error,
    });
  },
};
