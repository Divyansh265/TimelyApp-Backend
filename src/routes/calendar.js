import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  connectCalendar,
  oauthCallback,
  disconnectCalendar,
  calendarStatus,
} from "../controllers/calendarController.js";

const router = Router();

router.get("/connect", requireAuth, connectCalendar);
router.get("/oauth/callback", oauthCallback);
router.delete("/disconnect", requireAuth, disconnectCalendar);
router.get("/status", requireAuth, calendarStatus);

export default router;
