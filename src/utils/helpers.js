export function usernameFromEmail(email) {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
}

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

/**
 * Convert "HH:MM" on a given YYYY-MM-DD date string into a UTC Date,
 * interpreting the time in the given IANA timezone.
 */
function timeInZone(dateStr, timeStr, timezone) {
  const [h, m] = timeStr.split(":").map(Number);

  // Rough UTC guess: treat the time as if it were UTC
  const rough = new Date(`${dateStr}T${timeStr}:00.000Z`);

  // Find what local time that UTC moment corresponds to in the target timezone
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric", minute: "numeric", hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(rough);

  const p = {};
  parts.forEach(({ type, value }) => { p[type] = value; });

  const localH = parseInt(p.hour === "24" ? "0" : p.hour, 10);
  const localM = parseInt(p.minute, 10);

  // Shift the rough UTC time by the difference to get the correct UTC moment
  const diffMs = ((h - localH) * 60 + (m - localM)) * 60000;
  return new Date(rough.getTime() + diffMs);
}

export function generateSlots(date, availability, existingBookings = [], hostTimezone = "UTC") {
  const slots = [];
  const dateStr = date.toISOString().split("T")[0];

  // Get the day-of-week in the host's local timezone (not UTC)
  const localDayName = new Intl.DateTimeFormat("en-US", {
    timeZone: hostTimezone,
    weekday: "long",
  }).format(date);
  const dayIndex = DAYS.indexOf(localDayName);

  if (!availability.availableDays.includes(dayIndex)) return slots;

  const duration = availability.defaultDuration;

  for (const window of availability.timeSlots) {
    let current = timeInZone(dateStr, window.start, hostTimezone);
    const windowEnd = timeInZone(dateStr, window.end, hostTimezone);

    while (current.getTime() + duration * 60000 <= windowEnd.getTime()) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + duration * 60000);

      const isBooked = existingBookings.some((b) => {
        if (b.status === "cancelled") return false;
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        return slotStart < bEnd && slotEnd > bStart;
      });

      if (!isBooked) slots.push({ start: slotStart, end: slotEnd });

      current = new Date(current.getTime() + duration * 60000);
    }
  }

  return slots;
}
