import { Router } from "express";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ROLES } from "../../config/constants.js";
import * as controller from "./meeting.controller.js";
import * as schemas from "./meeting.validation.js";

const router = Router();

const canSchedule = authorize(ROLES.ADMIN, ROLES.EMPLOYEE);

router.get("/upcoming", validate(schemas.upcomingMeetingsSchema), asyncHandler(controller.upcoming));
router.get("/my-meetings", validate(schemas.listMeetingsSchema), asyncHandler(controller.myMeetings));

router
  .route("/")
  .get(validate(schemas.listMeetingsSchema), asyncHandler(controller.list))
  .post(canSchedule, validate(schemas.createMeetingSchema), asyncHandler(controller.create));

router
  .route("/:id")
  .get(validate(schemas.meetingIdSchema), asyncHandler(controller.getById))
  .patch(canSchedule, validate(schemas.updateMeetingSchema), asyncHandler(controller.update));

router.patch(
  "/:id/cancel",
  canSchedule,
  validate(schemas.cancelMeetingSchema),
  asyncHandler(controller.cancel),
);

export default router;
