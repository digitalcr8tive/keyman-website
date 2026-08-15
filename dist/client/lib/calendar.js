const KEYMAN_CALENDAR_EMAIL = "producedbykeyman@gmail.com";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const SUPPORTED_TIMEZONES = new Set([
  "America/Chicago",
  "America/New_York",
  "America/Los_Angeles"
]);

const compactDateTime = (date, time) =>
  `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;

const addMinutes = (time, minutes) => {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  const nextHour = Math.floor(total / 60) % 24;
  const nextMinute = total % 60;
  return `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`;
};

export const buildGoogleCalendarUrl = ({
  fullName,
  email,
  date,
  time,
  timeZone,
  notes = ""
}) => {
  const cleanName = String(fullName || "").trim().slice(0, 100);
  const cleanEmail = String(email || "").trim().toLowerCase().slice(0, 160);
  const cleanNotes = String(notes || "").trim().slice(0, 1000);

  if (!cleanName) throw new Error("Enter your full name.");
  if (!EMAIL_PATTERN.test(cleanEmail)) throw new Error("Enter a valid email address.");
  if (!DATE_PATTERN.test(date)) throw new Error("Choose an appointment date.");
  if (!TIME_PATTERN.test(time)) throw new Error("Choose an appointment time.");
  if (!SUPPORTED_TIMEZONES.has(timeZone)) throw new Error("Choose a supported time zone.");

  const endTime = addMinutes(time, 30);
  const details = [
    "Consultation requested through the Keyman website.",
    "",
    `Client: ${cleanName}`,
    `Client email: ${cleanEmail}`,
    cleanNotes ? `Notes: ${cleanNotes}` : ""
  ].filter(Boolean).join("\n");

  const calendarUrl = new URL("https://calendar.google.com/calendar/render");
  calendarUrl.searchParams.set("action", "TEMPLATE");
  calendarUrl.searchParams.set("text", `Keyman Consultation with ${cleanName}`);
  calendarUrl.searchParams.set(
    "dates",
    `${compactDateTime(date, time)}/${compactDateTime(date, endTime)}`
  );
  calendarUrl.searchParams.set("ctz", timeZone);
  calendarUrl.searchParams.set("details", details);
  calendarUrl.searchParams.set(
    "location",
    "Keyman will confirm the meeting link or phone details by email."
  );
  calendarUrl.searchParams.append("add", KEYMAN_CALENDAR_EMAIL);
  if (cleanEmail !== KEYMAN_CALENDAR_EMAIL) {
    calendarUrl.searchParams.append("add", cleanEmail);
  }

  return calendarUrl;
};
