import assert from "node:assert/strict";
import { test } from "node:test";
import { timezoneData } from "../src/data";
import { parseDateTime } from "../src/lib/date-time/parse";
import { formatDateTime, getRelativeTime } from "../src/lib/date-time/format";
import { exampleGroups } from "../src/data/examples";

process.env.TZ = "UTC";

const cases = [
  ["1704067200", "2024-01-01T00:00:00.000Z"],
  ["1704067200000", "2024-01-01T00:00:00.000Z"],
  ["<t:1704067200:F>", "2024-01-01T00:00:00.000Z"],
  ["<t:1704067200>", "2024-01-01T00:00:00.000Z"],
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

test("every help example is a supported input", () => {
  for (const group of exampleGroups) {
    for (const input of group.examples)
      assert.ok(parseDateTime(input, timezoneData, reference), input);
  }
});

test("every help pitfall is rejected and its correction is not", () => {
  for (const group of exampleGroups) {
    for (const { wrong, right } of group.pitfalls) {
      assert.equal(parseDateTime(wrong, timezoneData, reference), null, wrong);
      assert.ok(parseDateTime(right, timezoneData, reference), right);
    }
  }
});

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
    "infinity",
    "a".repeat(501),
  ]) {
    assert.equal(parseDateTime(input, timezoneData, reference), null, input);
  }
});

test("UTC previews never alter the Discord copy values", () => {
  const date = new Date("2026-09-07T10:20:30Z");
  const local = formatDateTime(date, "Europe/Istanbul");
  const utc = formatDateTime(date, "UTC");
  assert.notEqual(local.longTime.display, utc.longTime.display);
  assert.deepEqual(
    Object.values(local).map((item) => item.copy),
    Object.values(utc).map((item) => item.copy),
  );
});

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

test("all seven Discord styles and Unix seconds copy the exact value", () => {
  const results = formatDateTime(new Date("2024-01-01T00:00:00Z"));
  assert.equal(String(results.unixTimestamp.copy), "1704067200");
  assert.deepEqual(
    Object.values(results)
      .slice(1)
      .map((result) => result.copy),
    ["t", "T", "d", "D", "f", "F", "R"].map(
      (style) => `<t:1704067200:${style}>`,
    ),
  );
  for (const result of Object.values(results))
    assert.notEqual(result.display, "Error");
  assert.equal(
    getRelativeTime(new Date()),
    new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
      0,
      "second",
    ),
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
