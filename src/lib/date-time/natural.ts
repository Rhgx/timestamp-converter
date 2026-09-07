import {
  calendarAt,
  calendarStamp,
  dateFromCalendar,
  parseClock,
} from "./calendar";
import type { CalendarDate, Zone } from "./calendar";

const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const wordNumbers: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

function shiftMonth(date: Date, amount: number) {
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + amount);
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
}

function parseDuration(text: string, zone: Zone, reference: Date): Date | null {
  const match = text.match(
    /^(?:in\s+|(\+|-)\s*)?(.+?)(?:\s+(ago|from now|later))?$/,
  );
  if (!match) return null;
  let body = match[2]
    .replace(/\bhalf (?:an? )?/g, "0.5 ")
    .replace(/\b(?:a )?quarter of an? /g, "0.25 ")
    .replace(
      /\b(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/g,
      (word) => String(wordNumbers[word]),
    )
    .replace(/\s+and\s+|,\s*/g, " ")
    .trim();
  if ((text.startsWith("in ") || match[1]) && match[3]) return null;
  const direction = match[1] === "-" || match[3] === "ago" ? -1 : 1;
  const token =
    /^(\d+(?:\.\d+)?)\s*(years?|yrs?|y|months?|mos?|weeks?|wks?|w|days?|d|hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\s*/;
  let months = 0,
    days = 0,
    seconds = 0,
    count = 0;
  while (body) {
    const part = body.match(token);
    if (!part) return null;
    const amount = Number(part[1]) * direction;
    const unit = part[2];
    if (!Number.isFinite(amount)) return null;
    if (/^(y|mo|w|d)/.test(unit)) {
      if (!Number.isInteger(amount)) return null;
      if (unit.startsWith("y")) months += amount * 12;
      else if (unit.startsWith("mo")) months += amount;
      else days += amount * (unit.startsWith("w") ? 7 : 1);
    } else {
      seconds +=
        amount * (unit.startsWith("h") ? 3600 : unit.startsWith("m") ? 60 : 1);
    }
    body = body.slice(part[0].length);
    count++;
  }
  if (!count) return null;
  const wall = new Date(calendarStamp(calendarAt(reference, zone)));
  shiftMonth(wall, months);
  wall.setUTCDate(wall.getUTCDate() + days);
  if (!Number.isFinite(wall.getTime())) return null;
  const start =
    months || days
      ? dateFromCalendar(calendarAt(wall, { kind: "offset", minutes: 0 }), zone)
      : reference;
  if (!start) return null;
  const result = new Date(start.getTime() + seconds * 1000);
  return Number.isFinite(result.getTime()) ? result : null;
}

export function parseNatural(
  text: string,
  zone: Zone,
  reference: Date,
): Date | null {
  text = text.toLowerCase();
  if (text === "now" || text === "right now") return new Date(reference);
  const duration = parseDuration(text, zone, reference);
  if (duration) return duration;

  const timed = text.match(
    /^(.+?)\s+(?:at\s+)?(noon|midday|midnight|\d{1,2}(?:[:.]\d{2})?(?:[:.]\d{2})?\s*(?:[ap]\.?m\.?)?)$/,
  );
  const dayText = timed ? timed[1] : text;
  const clock = timed ? parseClock(timed[2]) : null;
  if (timed && !clock) return null;
  const today = calendarAt(reference, zone);
  const wall = new Date(Date.UTC(today.year, today.month, today.day));
  const dayOffsets: Record<string, number> = {
    today: 0,
    tomorrow: 1,
    yesterday: -1,
    "day after tomorrow": 2,
    "day before yesterday": -2,
    tonight: 0,
  };
  let endOfPeriod = false;
  if (Object.hasOwn(dayOffsets, dayText)) {
    wall.setUTCDate(wall.getUTCDate() + dayOffsets[dayText]);
  } else {
    const period = dayText.match(/^(next|last)\s+(week|month|year)$/);
    const weekday = dayText.match(
      /^(?:(next|last|this)\s+)?(sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)$/,
    );
    const boundary = dayText.match(
      /^(start|end) of (?:(the|this|next|last) )?(day|week|month|year)$/,
    );
    if (period) {
      const direction = period[1] === "next" ? 1 : -1;
      if (period[2] === "week")
        wall.setUTCDate(wall.getUTCDate() + 7 * direction);
      else shiftMonth(wall, direction * (period[2] === "year" ? 12 : 1));
    } else if (weekday) {
      const target = weekdays.findIndex((day) => day.startsWith(weekday[2]));
      const current = wall.getUTCDay();
      let delta = (target - current + 7) % 7;
      if (weekday[1] === "next" && delta === 0) delta = 7;
      if (weekday[1] === "last") delta = delta === 0 ? -7 : delta - 7;
      if (weekday[1] === "this")
        delta = ((target + 6) % 7) - ((current + 6) % 7);
      wall.setUTCDate(wall.getUTCDate() + delta);
    } else if (boundary) {
      endOfPeriod = boundary[1] === "end";
      const unit = boundary[3];
      const shift =
        boundary[2] === "next" ? 1 : boundary[2] === "last" ? -1 : 0;
      if (unit === "day") wall.setUTCDate(wall.getUTCDate() + shift);
      if (unit === "week")
        wall.setUTCDate(
          wall.getUTCDate() -
            ((wall.getUTCDay() + 6) % 7) +
            7 * shift +
            (endOfPeriod ? 6 : 0),
        );
      if (unit === "month") {
        wall.setUTCDate(1);
        wall.setUTCMonth(wall.getUTCMonth() + shift);
        if (endOfPeriod) {
          wall.setUTCMonth(wall.getUTCMonth() + 1);
          wall.setUTCDate(0);
        }
      }
      if (unit === "year") {
        wall.setUTCFullYear(
          wall.getUTCFullYear() + shift,
          endOfPeriod ? 11 : 0,
          endOfPeriod ? 31 : 1,
        );
      }
    } else return null;
  }
  const parts: CalendarDate = {
    ...calendarAt(wall, { kind: "offset", minutes: 0 }),
    ...(clock ?? {
      hours: dayText === "tonight" ? 20 : endOfPeriod ? 23 : 0,
      minutes: endOfPeriod ? 59 : 0,
      seconds: endOfPeriod ? 59 : 0,
    }),
  };
  return dateFromCalendar(parts, zone);
}
