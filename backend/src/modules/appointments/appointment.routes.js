import { Router } from "express";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ROLES } from "../../config/constants.js";
import * as controller from "./appointment.controller.js";
import * as schemas from "./appointment.validation.js";

const router = Router();

const { ADMIN, RECEPTIONIST, SECURITY, EMPLOYEE, MANAGEMENT } = ROLES;

const canView = authorize(ADMIN, RECEPTIONIST, SECURITY, EMPLOYEE, MANAGEMENT);
const canCreate = authorize(ADMIN, RECEPTIONIST, EMPLOYEE);
// Fine-grained checks (host/creator ownership) happen in the service layer.
const canModify = authorize(ADMIN, RECEPTIONIST, EMPLOYEE);
const canDecide = authorize(ADMIN, EMPLOYEE, MANAGEMENT, RECEPTIONIST, SECURITY);

router
  .route("/")
  .get(canView, validate(schemas.listAppointmentsSchema), asyncHandler(controller.list))
  .post(canCreate, validate(schemas.createAppointmentSchema), asyncHandler(controller.create));

router
  .route("/:id")
  .get(canView, validate(schemas.appointmentIdSchema), asyncHandler(controller.getById))
  .patch(canModify, validate(schemas.updateAppointmentSchema), asyncHandler(controller.update));

router.patch("/:id/approve", canDecide, validate(schemas.appointmentIdSchema), asyncHandler(controller.approve));
router.patch("/:id/reject", canDecide, validate(schemas.decisionSchema), asyncHandler(controller.reject));
router.patch("/:id/cancel", canModify, validate(schemas.decisionSchema), asyncHandler(controller.cancel));

export default router;
