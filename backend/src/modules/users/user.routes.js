import { Router } from "express";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ROLES } from "../../config/constants.js";
import * as controller from "./user.controller.js";
import * as schemas from "./user.validation.js";

const router = Router();

router
  .route("/")
  .get(validate(schemas.listUsersSchema), asyncHandler(controller.list))
  .post(
    authorize(ROLES.ADMIN),
    validate(schemas.createUserSchema),
    asyncHandler(controller.create),
  );

router
  .route("/:id")
  .get(validate(schemas.userIdSchema), asyncHandler(controller.getById))
  .patch(
    authorize(ROLES.ADMIN),
    validate(schemas.updateUserSchema),
    asyncHandler(controller.update),
  )
  .delete(
    authorize(ROLES.ADMIN),
    validate(schemas.userIdSchema),
    asyncHandler(controller.remove),
  );

router.patch(
  "/:id/status",
  authorize(ROLES.ADMIN),
  validate(schemas.updateUserStatusSchema),
  asyncHandler(controller.updateStatus),
);

export default router;
