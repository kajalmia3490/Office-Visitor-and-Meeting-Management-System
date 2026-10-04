import { Router } from "express";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ROLES } from "../../config/constants.js";
import * as controller from "./department.controller.js";
import * as schemas from "./department.validation.js";

const router = Router();

const canView = authorize(ROLES.ADMIN, ROLES.MANAGEMENT);
const canManage = authorize(ROLES.ADMIN);

router
  .route("/")
  .get(canView, validate(schemas.listDepartmentsSchema), asyncHandler(controller.list))
  .post(canManage, validate(schemas.createDepartmentSchema), asyncHandler(controller.create));

router
  .route("/:id")
  .get(canView, validate(schemas.departmentIdSchema), asyncHandler(controller.getById))
  .patch(canManage, validate(schemas.updateDepartmentSchema), asyncHandler(controller.update))
  .delete(canManage, validate(schemas.departmentIdSchema), asyncHandler(controller.remove));

export default router;
