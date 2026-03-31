import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getAvailability, saveAvailability } from "../controllers/availabilityController.js";

const router = Router();

router.get("/", requireAuth, getAvailability);
router.put("/", requireAuth, saveAvailability);

export default router;
