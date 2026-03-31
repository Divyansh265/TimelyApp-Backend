import { Router } from "express";
import { getSlots, createBooking } from "../controllers/publicController.js";

const router = Router();

router.get("/:username/slots", getSlots);
router.post("/:username/book", createBooking);

export default router;
