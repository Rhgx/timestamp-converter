import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDateTime, getRelativeTime } from "../src/lib/date-time/format";

// Expectations below are written in UTC.
process.env.TZ = "UTC";

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

test("all nine Discord styles and Unix seconds copy the exact value", () => {
  const results = formatDateTime(new Date("2024-01-01T00:00:00Z"));
  assert.equal(String(results.unixTimestamp.copy), "1704067200");
  assert.deepEqual(
    Object.values(results)
      .slice(1)
      .map((result) => result.copy),
    ["t", "T", "d", "D", "f", "F", "s", "S", "R"].map(
      (style) => `<t:1704067200:${style}>`,
    ),
  );
  for (const result of Object.values(results))
    assert.notEqual(result.display, "Error");
  // Discord keeps the full year in short dates.
  assert.match(results.shortDate.display, /2024/);
  assert.match(results.shortDateShortTime.display, /2024/);
  assert.equal(
    getRelativeTime(new Date()),
    new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
      0,
      "second",
    ),
  );
});
