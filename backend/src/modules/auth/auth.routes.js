import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as controller from "./auth.controller.js";

const router = Router();

router.get("/me", authenticate, asyncHandler(controller.me));
router.post("/logout", authenticate, asyncHandler(controller.logout));

export default router;
