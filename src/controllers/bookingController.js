import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { buildAuthClient, deleteCalendarEvent } from "../services/googleCalendar.js";

/** GET /api/bookings */
export async function getBookings(req, res) {
  try {
    const bookings = await Booking.find({ hostId: req.user.id })
      .sort({ startTime: 1 })
      .lean();
    return res.json({ bookings });
  } catch (err) {
    console.error("[getBookings]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/** PATCH /api/bookings/:id — cancel */
export async function cancelBooking(req, res) {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, hostId: req.user.id },
      { status: "cancelled" },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.googleEventId) {
      try {
        const user = await User.findById(req.user.id).select("googleTokens calendarConnected");
        if (user?.calendarConnected && user.googleTokens?.refreshToken) {
          const authClient = buildAuthClient(user.googleTokens);
          await deleteCalendarEvent(authClient, booking.googleEventId);
        }
      } catch (calErr) {
        console.error("[cancelBooking] Google Calendar event deletion failed:", calErr.message);
      }
    }

    return res.json({ booking });
  } catch (err) {
    console.error("[cancelBooking]", err);
    return res.status(500).json({ error: "Server error" });
  }
}
