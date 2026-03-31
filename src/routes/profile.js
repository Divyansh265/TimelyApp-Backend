import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { updateTimezone } from "../controllers/profileController.js";

const router = Router();

router.patch("/timezone", requireAuth, updateTimezone);

export default router;
