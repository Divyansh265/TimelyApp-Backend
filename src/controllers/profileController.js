import jwt from "jsonwebtoken";
import User from "../models/User.js";

/** PATCH /api/profile/timezone */
export async function updateTimezone(req, res) {
  try {
    const { timezone } = req.body;
    if (!timezone) return res.status(400).json({ error: "timezone is required" });

    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch {
      return res.status(400).json({ error: "Invalid timezone" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { timezone },
      { new: true }
    ).select("-password -googleTokens");

    // Issue a fresh token so the client's decoded payload reflects the new timezone
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        timezone: user.timezone,
        calendarConnected: user.calendarConnected || false,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ user, token });
  } catch (err) {
    console.error("[updateTimezone]", err);
    return res.status(500).json({ error: "Server error" });
  }
}
