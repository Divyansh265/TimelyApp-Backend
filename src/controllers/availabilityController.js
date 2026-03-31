import Availability from "../models/Availability.js";

/** GET /api/availability */
export async function getAvailability(req, res) {
  try {
    const avail = await Availability.findOne({ userId: req.user.id });
    return res.json({ availability: avail });
  } catch (err) {
    console.error("[getAvailability]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/** PUT /api/availability */
export async function saveAvailability(req, res) {
  try {
    const { availableDays, timeSlots, meetingDurations, defaultDuration } = req.body;

    if (!availableDays || !timeSlots || !meetingDurations || !defaultDuration)
      return res.status(400).json({ error: "Missing required fields" });

    const avail = await Availability.findOneAndUpdate(
      { userId: req.user.id },
      { availableDays, timeSlots, meetingDurations, defaultDuration },
      { upsert: true, new: true }
    );

    return res.json({ availability: avail });
  } catch (err) {
    console.error("[saveAvailability]", err);
    return res.status(500).json({ error: "Server error" });
  }
}
