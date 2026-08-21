import { GraphQLError } from "graphql";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";

export function formatGraphQLError(error: unknown, requestId?: string) {
  if (error instanceof GraphQLError) {
    return error;
  }

  if (error instanceof AppError) {
    return new GraphQLError(error.message, {
      extensions: {
        code: error.code,
        details: error.details,
        requestId,
      },
    });
  }

  logger.error("GraphQL resolver failed", { requestId, error });
  return new GraphQLError("An unexpected error occurred", {
    extensions: { code: "INTERNAL", requestId },
  });
}
