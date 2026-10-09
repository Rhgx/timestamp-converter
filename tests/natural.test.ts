import assert from "node:assert/strict";
import { test } from "node:test";
import { timezoneData } from "../src/data/timezones";
import { parseDateTime } from "../src/lib/date-time/parse";

// Expectations below are written in UTC.
process.env.TZ = "UTC";

test("relative keywords and offsets retain their meaning", () => {
  const before = Date.now();
  const now = parseDateTime("now", timezoneData);
  assert.ok(now && now.getTime() >= before && now.getTime() <= Date.now());
  const future = parseDateTime("in 3 hours", timezoneData);
  assert.ok(
    future && Math.abs(future.getTime() - Date.now() - 3 * 3600_000) < 1000,
  );
  const past = parseDateTime("2 days ago", timezoneData);
  assert.ok(
    past && Math.abs(past.getTime() - Date.now() + 2 * 86400_000) < 1000,
  );
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  assert.equal(
    parseDateTime("tomorrow", timezoneData)?.getTime(),
    tomorrow.getTime(),
  );
});

const reference = new Date("2026-09-07T10:20:30Z");
const naturalCases = [
  ["tomorrow at 3pm", "2026-09-08T15:00:00.000Z"],
  ["tomorrow 3p.m.", "2026-09-08T15:00:00.000Z"],
  ["day after tomorrow at noon", "2026-09-09T12:00:00.000Z"],
  ["day before yesterday", "2026-09-05T00:00:00.000Z"],
  ["next Friday at 18:30", "2026-09-11T18:30:00.000Z"],
  ["next Monday", "2026-09-14T00:00:00.000Z"],
  ["this Monday", "2026-09-07T00:00:00.000Z"],
  ["last Friday at midnight", "2026-09-04T00:00:00.000Z"],
  ["tonight", "2026-09-07T20:00:00.000Z"],
  ["noon", "2026-09-07T12:00:00.000Z"],
  ["midnight", "2026-09-07T00:00:00.000Z"],
  ["3p.m.", "2026-09-07T15:00:00.000Z"],
  ["end of month", "2026-09-30T23:59:59.000Z"],
  ["start of next month", "2026-10-01T00:00:00.000Z"],
  ["end of week", "2026-09-13T23:59:59.000Z"],
  ["end of next year", "2027-12-31T23:59:59.000Z"],
  ["in 1h 30m", "2026-09-07T11:50:30.000Z"],
  ["1h30m", "2026-09-07T11:50:30.000Z"],
  ["two hours ago", "2026-09-07T08:20:30.000Z"],
  ["in half an hour", "2026-09-07T10:50:30.000Z"],
  ["in a quarter of an hour", "2026-09-07T10:35:30.000Z"],
  ["1 day and 2 hours from now", "2026-09-08T12:20:30.000Z"],
  ["+45m", "2026-09-07T11:05:30.000Z"],
  ["-2h", "2026-09-07T08:20:30.000Z"],
  ["in 1.5 hours", "2026-09-07T11:50:30.000Z"],
  ["25 December at noon", "2026-12-25T12:00:00.000Z"],
  ["on 25th December 2027 at noon", "2027-12-25T12:00:00.000Z"],
  ["15.01.2027 14:30", "2027-01-15T14:30:00.000Z"],
  ["15-01-2027 14:30", "2027-01-15T14:30:00.000Z"],
  ["tomorrow at 3pm UTC", "2026-09-08T15:00:00.000Z"],
  ["next Friday at noon Pacific time", "2026-09-11T19:00:00.000Z"],
  ["tomorrow at noon UTC+05:30", "2026-09-08T06:30:00.000Z"],
  ["noon Tokyo", "2026-09-07T03:00:00.000Z"],
  ["14:30UTC", "2026-09-07T14:30:00.000Z"],
  ["14:30+03:00", "2026-09-07T11:30:00.000Z"],
  ["2027-01-15T14:30 Europe/Istanbul", "2027-01-15T11:30:00.000Z"],
  ["2027-01-15T14:30:00.123Z", "2027-01-15T14:30:00.123Z"],
  ["unix: 0", "1970-01-01T00:00:00.000Z"],
  ["-1s", "1969-12-31T23:59:59.000Z"],
  ["1704067200000ms", "2024-01-01T00:00:00.000Z"],
] as const;

for (const [input, expected] of naturalCases) {
  test("recognizes " + input, () => {
    assert.equal(
      parseDateTime(input, timezoneData, reference)?.toISOString(),
      expected,
    );
  });
}

test("relative dates use the target timezone at midnight boundaries", () => {
  const late = new Date("2026-09-07T23:30:00Z");
  assert.equal(
    parseDateTime("tomorrow at noon Tokyo", timezoneData, late)?.toISOString(),
    "2026-09-09T03:00:00.000Z",
  );
  assert.equal(
    parseDateTime("noon Tokyo", timezoneData, late)?.toISOString(),
    "2026-09-08T03:00:00.000Z",
  );
});

test("month and year offsets clamp to valid dates", () => {
  assert.equal(
    parseDateTime(
      "in 1 month",
      timezoneData,
      new Date("2026-01-31T12:00:00Z"),
    )?.toISOString(),
    "2026-02-28T12:00:00.000Z",
  );
  assert.equal(
    parseDateTime(
      "in 1 year",
      timezoneData,
      new Date("2024-02-29T12:00:00Z"),
    )?.toISOString(),
    "2025-02-28T12:00:00.000Z",
  );
});
