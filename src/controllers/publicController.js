import User from "../models/User.js";
import Availability from "../models/Availability.js";
import Booking from "../models/Booking.js";
import { generateSlots } from "../utils/helpers.js";
import { buildAuthClient, createCalendarEvent } from "../services/googleCalendar.js";

/** GET /api/public/:username/slots?date=YYYY-MM-DD */
export async function getSlots(req, res) {
  try {
    const { username } = req.params;
    const { date } = req.query;

    if (!date) return res.status(400).json({ error: "date query param required" });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const availability = await Availability.findOne({ userId: user._id });
    if (!availability) return res.status(404).json({ error: "No availability set" });

    // Cover the full 24h in the host's timezone (±1 day buffer handles DST edge cases)
    const dayStart = new Date(date + "T00:00:00.000Z");
    const dayEnd = new Date(date + "T23:59:59.999Z");

    // Widen the query by ±1 day to catch bookings near timezone boundaries
    const queryStart = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000);
    const queryEnd = new Date(dayEnd.getTime() + 24 * 60 * 60 * 1000);

    const existingBookings = await Booking.find({
      hostId: user._id,
      status: "confirmed",
      startTime: { $gte: queryStart, $lte: queryEnd },
    }).lean();

    const slots = generateSlots(dayStart, availability, existingBookings, user.timezone || "UTC");

    return res.json({
      slots: slots.map((s) => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
      })),
      hostName: user.name,
      hostTimezone: user.timezone,
      availability: {
        availableDays: availability.availableDays,
        meetingDurations: availability.meetingDurations,
        defaultDuration: availability.defaultDuration,
      },
    });
  } catch (err) {
    console.error("[getSlots]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/** POST /api/public/:username/book */
export async function createBooking(req, res) {
  try {
    const { username } = req.params;
    const { guestName, guestEmail, startTime, endTime, note, guestTimezone } = req.body;

    if (!guestName || !guestEmail || !startTime || !endTime)
      return res.status(400).json({ error: "Missing required fields" });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "Host not found" });

    const availability = await Availability.findOne({ userId: user._id });
    if (!availability)
      return res.status(404).json({ error: "Host has no availability set" });

    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = (end - start) / 60000;

    // Double-booking check — only confirmed bookings block
    const conflict = await Booking.findOne({
      hostId: user._id,
      status: "confirmed",
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (conflict)
      return res.status(409).json({ error: "This time slot is no longer available" });

    const booking = await Booking.create({
      hostId: user._id,
      guestName,
      guestEmail,
      startTime: start,
      endTime: end,
      duration,
      note: note || "",
      guestTimezone: guestTimezone || "UTC",
    });

    if (user.calendarConnected && user.googleTokens?.refreshToken) {
      try {
        const authClient = buildAuthClient(user.googleTokens);
        const eventId = await createCalendarEvent(authClient, {
          summary: `Meeting with ${guestName}`,
          description: note
            ? `Guest note: ${note}\n\nGuest email: ${guestEmail}`
            : `Guest email: ${guestEmail}`,
          startTime: start,
          endTime: end,
          hostTimezone: user.timezone || "UTC",
          guestEmail,
        });

        await Booking.findByIdAndUpdate(booking._id, { googleEventId: eventId });
        booking.googleEventId = eventId;
      } catch (calErr) {
        console.error("[createBooking] Google Calendar event creation failed:", calErr.message);
      }
    }

    return res.status(201).json({ booking });
  } catch (err) {
    console.error("[createBooking]", err);
    return res.status(500).json({ error: "Server error" });
  }
}
