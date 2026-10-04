import { Router } from "express";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { sensitiveLimiter } from "../../middlewares/rateLimit.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ROLES } from "../../config/constants.js";
import * as controller from "./visitorPass.controller.js";
import * as schemas from "./visitorPass.validation.js";

const router = Router();

const { ADMIN, RECEPTIONIST, SECURITY } = ROLES;

router.post("/", authorize(ADMIN, RECEPTIONIST), validate(schemas.issuePassSchema), asyncHandler(controller.issue));

router.get(
  "/verify/:passNumber",
  sensitiveLimiter,
  authorize(ADMIN, SECURITY),
  validate(schemas.verifyPassSchema),
  asyncHandler(controller.verify),
);

router.get(
  "/:id",
  authorize(ADMIN, RECEPTIONIST, SECURITY),
  validate(schemas.passIdSchema),
  asyncHandler(controller.getById),
);

router.patch(
  "/:id/revoke",
  authorize(ADMIN, RECEPTIONIST, SECURITY),
  validate(schemas.revokePassSchema),
  asyncHandler(controller.revoke),
);

export default router;
