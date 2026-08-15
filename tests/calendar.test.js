import assert from "node:assert/strict";
import test from "node:test";
import { buildGoogleCalendarUrl } from "../lib/calendar.js";

test("creates a Google Calendar event for Keyman and the customer", () => {
  const url = buildGoogleCalendarUrl({
    fullName: "Alex Producer",
    email: "alex@example.com",
    date: "2026-08-20",
    time: "13:00",
    timeZone: "America/Chicago",
    notes: "Catalog metadata review"
  });

  assert.equal(url.origin, "https://calendar.google.com");
  assert.equal(url.pathname, "/calendar/render");
  assert.equal(url.searchParams.get("action"), "TEMPLATE");
  assert.equal(url.searchParams.get("dates"), "20260820T130000/20260820T133000");
  assert.equal(url.searchParams.get("ctz"), "America/Chicago");
  assert.deepEqual(url.searchParams.getAll("add"), [
    "producedbykeyman@gmail.com",
    "alex@example.com"
  ]);
  assert.match(url.searchParams.get("details"), /Catalog metadata review/);
});

test("rejects invalid booking details", () => {
  assert.throws(
    () => buildGoogleCalendarUrl({
      fullName: "",
      email: "not-an-email",
      date: "2026-08-20",
      time: "13:00",
      timeZone: "America/Chicago"
    }),
    /full name/
  );
});
