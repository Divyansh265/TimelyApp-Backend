import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getBookings, cancelBooking } from "../controllers/bookingController.js";

const router = Router();

router.get("/", requireAuth, getBookings);
router.patch("/:id", requireAuth, cancelBooking);

export default router;
