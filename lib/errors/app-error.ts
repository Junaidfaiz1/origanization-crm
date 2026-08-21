export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BUSINESS_RULE"
  | "INTERNAL";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, string[] | string>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: Record<string, string[] | string>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super("UNAUTHENTICATED", message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super("FORBIDDEN", message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    details?: Record<string, string[] | string>,
  ) {
    super("VALIDATION", message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super("CONFLICT", message, 409);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super("BUSINESS_RULE", message, 422);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "An unexpected error occurred") {
    super("INTERNAL", message, 500);
  }
}

export function toPublicError(error: unknown): {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, string[] | string>;
} {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  return {
    code: "INTERNAL",
    message: "An unexpected error occurred",
    statusCode: 500,
  };
}
