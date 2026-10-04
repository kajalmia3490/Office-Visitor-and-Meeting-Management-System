import { AuditLog } from "./auditLog.model.js";
import { logger } from "../../utils/logger.js";
import { paginate } from "../../utils/pagination.js";

/**
 * Records an audit entry. Audit failures are logged but never break the
 * business operation that triggered them.
 */
export async function recordAudit(req, { action, module, targetId, description, metadata }) {
  try {
    await AuditLog.create({
      user: req?.user?._id ?? null,
      action,
      module,
      targetId: targetId ?? null,
      description,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.get?.("user-agent"),
    });
  } catch (err) {
    logger.error(`Failed to record audit log ${action}: ${err.message}`);
  }
}

export async function listAuditLogs(query, pagination) {
  const filter = {};
  if (query.action) filter.action = query.action;
  if (query.module) filter.module = query.module;
  if (query.user) filter.user = query.user;
  if (query.targetId) filter.targetId = query.targetId;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = query.from;
    if (query.to) filter.createdAt.$lte = query.to;
  }

  return paginate(AuditLog, filter, pagination, {
    populate: { path: "user", select: "name email role" },
  });
}
