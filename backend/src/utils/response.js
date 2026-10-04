export function sendSuccess(res, { statusCode = 200, message = "Success", data = null, meta } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function sendCreated(res, message, data) {
  return sendSuccess(res, { statusCode: 201, message, data });
}

export function sendNoContent(res) {
  return res.status(204).send();
}

export function sendError(res, { statusCode = 500, message = "Internal server error", code = "INTERNAL_ERROR", details } = {}) {
  const error = { code };
  if (details !== undefined) error.details = details;
  return res.status(statusCode).json({ success: false, message, error });
}
