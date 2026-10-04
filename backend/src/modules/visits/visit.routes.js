import { Router } from "express";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ROLES } from "../../config/constants.js";
import * as controller from "./visit.controller.js";
import * as schemas from "./visit.validation.js";

const router = Router();

const { ADMIN, RECEPTIONIST, SECURITY, EMPLOYEE, MANAGEMENT } = ROLES;

// Employees only see visits they host (enforced in the service layer).
const canView = authorize(ADMIN, RECEPTIONIST, SECURITY, MANAGEMENT, EMPLOYEE);
const canViewActive = authorize(ADMIN, RECEPTIONIST, SECURITY, MANAGEMENT);
const canRegisterWalkIn = authorize(ADMIN, RECEPTIONIST);
const canCheckInOut = authorize(ADMIN, RECEPTIONIST, SECURITY);

router.get("/active", canViewActive, asyncHandler(controller.active));
router.get("/today", canView, asyncHandler(controller.today));
router.post(
  "/walk-in",
  canRegisterWalkIn,
  validate(schemas.walkInSchema),
  asyncHandler(controller.walkIn),
);

router.get(
  "/",
  canView,
  validate(schemas.listVisitsSchema),
  asyncHandler(controller.list),
);
router.get(
  "/:id",
  canView,
  validate(schemas.visitIdSchema),
  asyncHandler(controller.getById),
);
router.get(
  "/:id/pass",
  canView,
  validate(schemas.visitIdSchema),
  asyncHandler(controller.pass),
);

router.post(
  "/:id/check-in",
  canCheckInOut,
  validate(schemas.checkInSchema),
  asyncHandler(controller.checkIn),
);
router.post(
  "/:id/check-out",
  canCheckInOut,
  validate(schemas.checkOutSchema),
  asyncHandler(controller.checkOut),
);

export default router;
