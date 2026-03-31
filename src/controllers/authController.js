import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { usernameFromEmail } from "../utils/helpers.js";

/** Build a consistent JWT payload from a user document */
function buildPayload(user) {
  return {
    id: user._id,
    email: user.email,
    username: user.username,
    name: user.name,
    timezone: user.timezone || "UTC",
    calendarConnected: user.calendarConnected || false,
  };
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

/** POST /api/auth/register */
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    let username = usernameFromEmail(email);
    const taken = await User.findOne({ username });
    if (taken) username = username + Math.floor(Math.random() * 9999);

    const user = await User.create({ name, email, password, username });
    const token = signToken(buildPayload(user));

    return res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        timezone: user.timezone,
        calendarConnected: user.calendarConnected,
      },
    });
  } catch (err) {
    console.error("[register]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/** POST /api/auth/login */
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(buildPayload(user));

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        timezone: user.timezone,
        calendarConnected: user.calendarConnected,
      },
    });
  } catch (err) {
    console.error("[login]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/** GET /api/auth/me */
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password -googleTokens");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch (err) {
    console.error("[me]", err);
    return res.status(500).json({ error: "Server error" });
  }
}
