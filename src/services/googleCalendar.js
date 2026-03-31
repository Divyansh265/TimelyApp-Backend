import { google } from "googleapis";

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(userToken) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    state: userToken,
  });
}

export async function exchangeCode(code) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export function buildAuthClient(googleTokens) {
  const client = getOAuthClient();
  client.setCredentials({
    access_token: googleTokens.accessToken,
    refresh_token: googleTokens.refreshToken,
    expiry_date: googleTokens.expiryDate,
  });
  return client;
}

export async function createCalendarEvent(authClient, {
  summary,
  description,
  startTime,
  endTime,
  hostTimezone,
  guestEmail,
}) {
  const calendar = google.calendar({ version: "v3", auth: authClient });

  const event = {
    summary,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: hostTimezone || "UTC",
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: hostTimezone || "UTC",
    },
    attendees: [{ email: guestEmail }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
    sendUpdates: "all",
  });

  return response.data.id;
}

export async function deleteCalendarEvent(authClient, eventId) {
  if (!eventId) return;
  const calendar = google.calendar({ version: "v3", auth: authClient });
  try {
    await calendar.events.delete({ calendarId: "primary", eventId });
  } catch (err) {
    if (err.code !== 404 && err.code !== 410) throw err;
  }
}
