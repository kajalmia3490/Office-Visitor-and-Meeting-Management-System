import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as controller from "./notification.controller.js";
import * as schemas from "./notification.validation.js";

// Every authenticated user can manage only their own notifications.
const router = Router();

router.get(
  "/",
  validate(schemas.listNotificationsSchema),
  asyncHandler(controller.list),
);
router.get(
  "/unread",
  validate(schemas.unreadNotificationsSchema),
  asyncHandler(controller.unread),
);
router.patch("/read-all", asyncHandler(controller.markAllRead));
router.patch(
  "/:id/read",
  validate(schemas.notificationIdSchema),
  asyncHandler(controller.markRead),
);

export default router;
