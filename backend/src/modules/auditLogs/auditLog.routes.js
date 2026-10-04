import { Router } from "express";
import { z } from "zod";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getPagination } from "../../utils/pagination.js";
import { sendSuccess } from "../../utils/response.js";
import { AUDIT_ACTIONS, AUDIT_MODULES, ROLES } from "../../config/constants.js";
import { dateRangeQuery, objectId, paginationQuery, refineDateRange } from "../../utils/validators.js";
import { listAuditLogs } from "./auditLog.service.js";

const listAuditLogsSchema = {
  query: z
    .object({
      ...paginationQuery,
      ...dateRangeQuery,
      action: z.enum(Object.values(AUDIT_ACTIONS)).optional(),
      module: z.enum(Object.values(AUDIT_MODULES)).optional(),
      user: objectId.optional(),
      targetId: objectId.optional(),
    })
    .superRefine(refineDateRange),
};

const router = Router();

router.get(
  "/",
  authorize(ROLES.ADMIN),
  validate(listAuditLogsSchema),
  asyncHandler(async (req, res) => {
    const { items, meta } = await listAuditLogs(req.query, getPagination(req.query));
    return sendSuccess(res, { message: "Audit logs retrieved successfully", data: items, meta });
  }),
);

export default router;
