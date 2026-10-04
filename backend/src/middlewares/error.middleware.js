import mongoose from "mongoose";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

function normalizeError(err) {
  if (err instanceof ApiError) return err;

  if (err instanceof ZodError) {
    return ApiError.validation(
      "Validation failed",
      err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    );
  }

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for ${err.path}`, "INVALID_ID");
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return ApiError.validation(
      "Validation failed",
      Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
    );
  }

  if (err?.code === 11000) {
    const fields = Object.keys(err.keyValue || err.keyPattern || {});
    return ApiError.conflict(
      `A record with the same ${fields.join(", ") || "value"} already exists`,
      "DUPLICATE_KEY",
      { fields },
    );
  }

  if (err?.type === "entity.parse.failed") {
    return ApiError.badRequest("Malformed JSON request body", "INVALID_JSON");
  }

  if (err?.type === "entity.too.large") {
    return new ApiError(413, "Request body is too large", "PAYLOAD_TOO_LARGE");
  }

  return null;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const apiError = normalizeError(err);

  if (apiError) {
    if (apiError.statusCode >= 500) logger.error(err);
    return sendError(res, {
      statusCode: apiError.statusCode,
      message: apiError.message,
      code: apiError.code,
      details: apiError.details,
    });
  }

  logger.error(err);
  return sendError(res, {
    statusCode: 500,
    message: env.isProduction ? "Internal server error" : err?.message || "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
