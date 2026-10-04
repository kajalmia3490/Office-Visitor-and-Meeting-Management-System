export class ApiError extends Error {
  constructor(statusCode, message, code, details) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code || ApiError.defaultCode(statusCode);
    this.details = details;
  }

  static defaultCode(statusCode) {
    const codes = {
      400: "BAD_REQUEST",
      401: "UNAUTHENTICATED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "VALIDATION_ERROR",
      429: "TOO_MANY_REQUESTS",
    };
    return codes[statusCode] || "INTERNAL_ERROR";
  }

  static badRequest(message, code, details) {
    return new ApiError(400, message, code, details);
  }

  static unauthenticated(message = "Authentication required") {
    return new ApiError(401, message, "UNAUTHENTICATED");
  }

  static forbidden(
    message = "You do not have permission to perform this action",
    code = "FORBIDDEN",
  ) {
    return new ApiError(403, message, code);
  }

  static notFound(message = "Resource not found", code = "NOT_FOUND") {
    return new ApiError(404, message, code);
  }

  static conflict(message, code = "CONFLICT", details) {
    return new ApiError(409, message, code, details);
  }

  static validation(message = "Validation failed", details) {
    return new ApiError(422, message, "VALIDATION_ERROR", details);
  }
}
