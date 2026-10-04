import { Router } from "express";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ROLES } from "../../config/constants.js";
import * as controller from "./meetingRoom.controller.js";
import * as schemas from "./meetingRoom.validation.js";

const router = Router();

// Any authenticated user can browse rooms and check availability; only admins manage them.
const canManage = authorize(ROLES.ADMIN);

router.get(
  "/availability",
  validate(schemas.availabilitySchema),
  asyncHandler(controller.availability),
);

router
  .route("/")
  .get(validate(schemas.listRoomsSchema), asyncHandler(controller.list))
  .post(
    canManage,
    validate(schemas.createRoomSchema),
    asyncHandler(controller.create),
  );

router
  .route("/:id")
  .get(validate(schemas.roomIdSchema), asyncHandler(controller.getById))
  .patch(
    canManage,
    validate(schemas.updateRoomSchema),
    asyncHandler(controller.update),
  )
  .delete(
    canManage,
    validate(schemas.roomIdSchema),
    asyncHandler(controller.remove),
  );

export default router;
