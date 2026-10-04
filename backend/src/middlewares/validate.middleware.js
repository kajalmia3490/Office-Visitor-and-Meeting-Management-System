import { ApiError } from "../utils/ApiError.js";

function formatIssues(issues, location) {
  return issues.map((issue) => ({
    location,
    path: issue.path.join("."),
    message: issue.message,
  }));
}

/**
 * Validates request segments with Zod schemas and replaces them with the
 * parsed (coerced/defaulted) values.
 *
 * @param {{ body?: import("zod").ZodType, query?: import("zod").ZodType, params?: import("zod").ZodType }} schemas
 */
export const validate = (schemas) => (req, res, next) => {
  const issues = [];
  const parsed = {};

  for (const location of ["params", "query", "body"]) {
    const schema = schemas[location];
    if (!schema) continue;

    const result = schema.safeParse(req[location] ?? {});
    if (result.success) {
      parsed[location] = result.data;
    } else {
      issues.push(...formatIssues(result.error.issues, location));
    }
  }

  if (issues.length) {
    return next(ApiError.validation("Validation failed", issues));
  }

  if (parsed.params) req.params = parsed.params;
  if (parsed.body) req.body = parsed.body;
  if (parsed.query) {
    // Express 5 exposes req.query as a getter, so shadow it with an own property.
    Object.defineProperty(req, "query", {
      value: parsed.query,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  return next();
};
