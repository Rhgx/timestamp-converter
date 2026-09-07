import assert from 'node:assert/strict';
import { test } from 'node:test';
import { timezoneData } from './data';
import { parseDateTime } from './parser';
import { formatDateTime, getRelativeTime } from './formatter';

process.env.TZ = 'UTC';

const cases = [
  ['1704067200', '2024-01-01T00:00:00.000Z'],
  ['1704067200000', '2024-01-01T00:00:00.000Z'],
  ['<t:1704067200:F>', '2024-01-01T00:00:00.000Z'],
  ['<t:1704067200>', '2024-01-01T00:00:00.000Z'],
  ['2025-05-03T10:00Z', '2025-05-03T10:00:00.000Z'],
  ['2025-05-03T10:00+03:00', '2025-05-03T07:00:00.000Z'],
  ['2025-05-03', '2025-05-03T00:00:00.000Z'],
  ['Jan 1 2024', '2024-01-01T00:00:00.000Z'],
  ['Jan 1st 2024 at 3:00 PM UTC', '2024-01-01T15:00:00.000Z'],
  ['01/15/2024 3:00 PM UTC', '2024-01-15T15:00:00.000Z'],
  ['4.00 @ 10/5/2025 CDT', '2025-05-10T09:00:00.000Z'],
  ['12:00 @ 1/1/2025 EST', '2025-01-01T17:00:00.000Z'],
  ['12:00 @ 1/7/2025 EST', '2025-07-01T16:00:00.000Z'],
  ['12:00 @ 1/7/2025 America/New_York', '2025-07-01T16:00:00.000Z'],
  ['12:00 @ 1/7/2025 IST (Ireland)', '2025-07-01T11:00:00.000Z'],
  ['12:00 @ 1/7/2025 IST', '2025-07-01T06:30:00.000Z'],
  ['12:00 @ 1/7/2025 UTC+05:30', '2025-07-01T06:30:00.000Z'],
] as const;

for (const [input, expected] of cases) {
  test(`converts ${input}`, () => assert.equal(parseDateTime(input, timezoneData)?.toISOString(), expected));
}

test('relative keywords and offsets retain their meaning', () => {
  const before = Date.now();
  const now = parseDateTime('now', timezoneData);
  assert.ok(now && now.getTime() >= before && now.getTime() <= Date.now());
  const future = parseDateTime('in 3 hours', timezoneData);
  assert.ok(future && Math.abs(future.getTime() - Date.now() - 3 * 3600_000) < 1000);
  const past = parseDateTime('2 days ago', timezoneData);
  assert.ok(past && Math.abs(past.getTime() - Date.now() + 2 * 86400_000) < 1000);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  assert.equal(parseDateTime('tomorrow', timezoneData)?.getTime(), tomorrow.getTime());
});

test('time-only inputs still accept timezones', () => {
  for (const input of ['14:30 UTC', '2 PM EST', '12:30:45 GMT', '2 PM America/New_York']) {
    assert.ok(parseDateTime(input, timezoneData), input);
  }
});

test('all seven Discord styles and Unix seconds copy the exact value', () => {
  const results = formatDateTime(new Date('2024-01-01T00:00:00Z'));
  assert.equal(String(results.unixTimestamp.copy), '1704067200');
  assert.deepEqual(Object.values(results).slice(1).map(result => result.copy),
    ['t', 'T', 'd', 'D', 'f', 'F', 'R'].map(style => `<t:1704067200:${style}>`));
  for (const result of Object.values(results)) assert.notEqual(result.display, 'Error');
  assert.equal(getRelativeTime(new Date()), new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(0, 'second'));
});

test('invalid dates and unknown timezone suffixes are rejected', () => {
  for (const input of ['', 'not a date', 'constructor', '__proto__', '25:00 UTC', '14:30 NOPE', 'Jan 1 2024 rubbish', '02/30/2024', '2025-02-30', '14:30 UTC+99:00']) {
    assert.equal(parseDateTime(input, timezoneData), null, input);
  }
});
