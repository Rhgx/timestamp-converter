import assert from "node:assert/strict";
import { test } from "node:test";
import { placesReady, timezoneData } from "../src/data/timezones";
import { exampleGroups } from "../src/data/examples";
import { parseDateTime } from "../src/lib/date-time/parse";

// Expectations below are written in UTC.
process.env.TZ = "UTC";
await placesReady;

const reference = new Date("2026-09-07T10:20:30Z");

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
