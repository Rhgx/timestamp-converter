import assert from "node:assert/strict";
import { test } from "node:test";
import { timezoneData } from "../src/data/timezones";
import { parseDateTime } from "../src/lib/date-time/parse";

// Expectations below are written in UTC.
process.env.TZ = "UTC";

const cases = [
  ["1704067200", "2024-01-01T00:00:00.000Z"],
  ["1704067200000", "2024-01-01T00:00:00.000Z"],
  ["<t:1704067200:F>", "2024-01-01T00:00:00.000Z"],
  ["<t:1704067200>", "2024-01-01T00:00:00.000Z"],
  ["<t:1704067200:S>", "2024-01-01T00:00:00.000Z"],
  ["2025-05-03T10:00Z", "2025-05-03T10:00:00.000Z"],
  ["2025-05-03T10:00+03:00", "2025-05-03T07:00:00.000Z"],
  ["2025-05-03", "2025-05-03T00:00:00.000Z"],
  ["Jan 1 2024", "2024-01-01T00:00:00.000Z"],
  ["Jan 1st 2024 at 3:00 PM UTC", "2024-01-01T15:00:00.000Z"],
  ["01/15/2024 3:00 PM UTC", "2024-01-15T15:00:00.000Z"],
  ["4.00 @ 10/5/2025 CDT", "2025-05-10T09:00:00.000Z"],
  ["12:00 @ 1/1/2025 EST", "2025-01-01T17:00:00.000Z"],
  ["12:00 @ 1/7/2025 EST", "2025-07-01T16:00:00.000Z"],
  ["12:00 @ 1/7/2025 America/New_York", "2025-07-01T16:00:00.000Z"],
  ["12:00 @ 1/7/2025 IST (Ireland)", "2025-07-01T11:00:00.000Z"],
  ["12:00 @ 1/7/2025 IST", "2025-07-01T06:30:00.000Z"],
  ["12:00 @ 1/7/2025 UTC+05:30", "2025-07-01T06:30:00.000Z"],
] as const;

for (const [input, expected] of cases) {
  test(`converts ${input}`, () =>
    assert.equal(parseDateTime(input, timezoneData)?.toISOString(), expected));
}

test("time-only inputs still accept timezones", () => {
  for (const input of [
    "14:30 UTC",
    "2 PM EST",
    "12:30:45 GMT",
    "2 PM America/New_York",
  ]) {
    assert.ok(parseDateTime(input, timezoneData), input);
  }
});

test("DST gaps reject and folds use the earlier instant", () => {
  assert.equal(
    parseDateTime("02:30 @ 8/3/2026 America/New_York", timezoneData),
    null,
  );
  assert.equal(
    parseDateTime(
      "01:30 @ 1/11/2026 America/New_York",
      timezoneData,
    )?.toISOString(),
    "2026-11-01T05:30:00.000Z",
  );
  const before = new Date("2026-03-07T17:00:00Z");
  assert.equal(
    parseDateTime(
      "in 1 day America/New_York",
      timezoneData,
      before,
    )?.toISOString(),
    "2026-03-08T16:00:00.000Z",
  );
  assert.equal(
    parseDateTime(
      "in 24 hours America/New_York",
      timezoneData,
      before,
    )?.toISOString(),
    "2026-03-08T17:00:00.000Z",
  );
});

test("invalid dates and unknown timezone suffixes are rejected", () => {
  for (const input of [
    "",
    "not a date",
    "constructor",
    "__proto__",
    "25:00 UTC",
    "14:30 NOPE",
    "Jan 1 2024 rubbish",
    "02/30/2024",
    "2025-02-30",
    "14:30 UTC+99:00",
  ]) {
    assert.equal(parseDateTime(input, timezoneData), null, input);
  }
});

const reference = new Date("2026-09-07T10:20:30Z");

test("rejects partially matched language, invalid clocks, and malformed offsets", () => {
  for (const input of [
    "in 3 hours nonsense",
    "in 2 hours ago",
    "tomorrow at 25:30",
    "tomorrow at 0pm",
    "tomorrow at noon NOPE",
    "in 1.5 months",
    "2026-02-30T12:00Z",
    "noon UTC+14:30",
    "2 PM Mars/Olympus",
    "in the morning",
    "morning",
    "last morning",
    "in 2 hours at 3pm",
    "infinity",
    "a".repeat(501),
  ]) {
    assert.equal(parseDateTime(input, timezoneData, reference), null, input);
  }
});
