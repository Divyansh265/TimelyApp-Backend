import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getAuthUrl, exchangeCode } from "../services/googleCalendar.js";

export async function connectCalendar(req, res) {
  try {
    const stateToken = jwt.sign(
      { id: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );
    const url = getAuthUrl(stateToken);
    return res.json({ url });
  } catch (err) {
    console.error("[connectCalendar]", err);
    return res.status(500).json({ error: "Failed to generate auth URL" });
  }
}

export async function oauthCallback(req, res) {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.warn("[oauthCallback] User denied access:", error);
      return res.redirect(`${process.env.CLIENT_URL}/settings?calendar=denied`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.CLIENT_URL}/settings?calendar=error`);
    }

    let userId;
    try {
      const payload = jwt.verify(state, process.env.JWT_SECRET);
      userId = payload.id;
    } catch {
      console.error("[oauthCallback] Invalid state token");
      return res.redirect(`${process.env.CLIENT_URL}/settings?calendar=error`);
    }

    const tokens = await exchangeCode(code);

    await User.findByIdAndUpdate(userId, {
      "googleTokens.accessToken": tokens.access_token,
      "googleTokens.refreshToken": tokens.refresh_token,
      "googleTokens.expiryDate": tokens.expiry_date,
      calendarConnected: true,
    });

    return res.redirect(`${process.env.CLIENT_URL}/settings?calendar=connected`);
  } catch (err) {
    console.error("[oauthCallback]", err);
    return res.redirect(`${process.env.CLIENT_URL}/settings?calendar=error`);
  }
}

export async function disconnectCalendar(req, res) {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      googleTokens: {},
      calendarConnected: false,
    });
    return res.json({ message: "Calendar disconnected" });
  } catch (err) {
    console.error("[disconnectCalendar]", err);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function calendarStatus(req, res) {
  try {
    const user = await User.findById(req.user.id).select("calendarConnected");
    return res.json({ connected: user?.calendarConnected ?? false });
  } catch (err) {
    console.error("[calendarStatus]", err);
    return res.status(500).json({ error: "Server error" });
  }
}
