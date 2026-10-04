/**
 * Custom exception hierarchy — every error carries a machine-readable code
 * and an HTTP status code so the tool handler can format consistent responses.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ApiError extends AppError {
  constructor(
    message: string,
    public readonly httpStatus: number,
    public readonly endpoint: string,
  ) {
    super(message, "API_ERROR", httpStatus, { endpoint });
    this.name = "ApiError";
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) return new AppError(error.message, "UNKNOWN_ERROR", 500);
  return new AppError(String(error), "UNKNOWN_ERROR", 500);
}

export function formatErrorResponse(error: AppError): string {
  return JSON.stringify({
    error: {
      code: error.code,
      statusCode: error.statusCode,
      message: error.message,
    },
  });
}
