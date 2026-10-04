import { Router } from "express";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ROLES } from "../../config/constants.js";
import * as controller from "./visitor.controller.js";
import * as schemas from "./visitor.validation.js";

const router = Router();

const { ADMIN, RECEPTIONIST, SECURITY, EMPLOYEE, MANAGEMENT } = ROLES;

const canRegister = authorize(ADMIN, RECEPTIONIST);
const canView = authorize(ADMIN, RECEPTIONIST, SECURITY, MANAGEMENT);
// Employees can look up visitors to invite them; identity details are masked for them.
const canSearch = authorize(ADMIN, RECEPTIONIST, SECURITY, MANAGEMENT, EMPLOYEE);
const canViewHistory = authorize(ADMIN, RECEPTIONIST, SECURITY, MANAGEMENT, EMPLOYEE);

router.get("/search", canSearch, validate(schemas.searchVisitorsSchema), asyncHandler(controller.search));

router
  .route("/")
  .get(canView, validate(schemas.listVisitorsSchema), asyncHandler(controller.list))
  .post(canRegister, validate(schemas.createVisitorSchema), asyncHandler(controller.create));

router.get(
  "/:id/history",
  canViewHistory,
  validate(schemas.visitorHistorySchema),
  asyncHandler(controller.history),
);

router
  .route("/:id")
  .get(canView, validate(schemas.visitorIdSchema), asyncHandler(controller.getById))
  .patch(canRegister, validate(schemas.updateVisitorSchema), asyncHandler(controller.update))
  .delete(authorize(ADMIN), validate(schemas.visitorIdSchema), asyncHandler(controller.remove));

export default router;
