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

const clockPattern = String.raw`noon|midday|midnight|\d{1,2}(?:[:.]\d{2}){0,2}\s*(?:[ap]\.?m\.?|o['’]?clock)?`;
// "tomorrow at 3pm" and "3pm tomorrow".
const dayThenTime = new RegExp(String.raw`^(.+?)\s+(?:at\s+)?(${clockPattern})$`);
const timeThenDay = new RegExp(
  String.raw`^(?:at\s+)?(${clockPattern})\s+(?:on\s+)?(.+)$`,
);
// Default clock hours for a named part of the day. Tonight counts as night.
const dayParts: Record<string, number> = {
  morning: 9,
  afternoon: 15,
  evening: 18,
  night: 20,
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

  const dayFirst = text.match(dayThenTime);
  const timeFirst = dayFirst ? null : text.match(timeThenDay);
  const clockText = dayFirst?.[2] ?? timeFirst?.[1] ?? "";
  let dayText = dayFirst?.[1] ?? timeFirst?.[2] ?? text;
  const clock = clockText ? parseClock(clockText) : null;
  if (clockText && !clock) return null;

  let part: string | undefined;
  const partMatch = dayText.match(/^(.+)\s+(morning|afternoon|evening|night)$/);
  if (dayText === "tonight") [dayText, part] = ["today", "night"];
  else if (partMatch) {
    part = partMatch[2];
    dayText =
      partMatch[1] === "this"
        ? "today"
        : partMatch[1] === "last" && part === "night"
          ? "yesterday"
          : partMatch[1];
  }

  // "in 3 days at noon": a whole-day duration picks the day, the clock the time.
  const shifted =
    /^(?:in\s+)?\S+\s+(?:days?|weeks?|months?|years?)(?:\s+(?:from now|later|ago))?$/.test(
      dayText,
    )
      ? parseDuration(dayText, zone, reference)
      : null;
  const today = calendarAt(shifted ?? reference, zone);
  const wall = new Date(Date.UTC(today.year, today.month, today.day));
  const dayOffsets: Record<string, number> = {
    today: 0,
    tomorrow: 1,
    yesterday: -1,
    "day after tomorrow": 2,
    "day before yesterday": -2,
  };
  let endOfPeriod = false;
  if (shifted) {
    // The duration already chose the day.
  } else if (Object.hasOwn(dayOffsets, dayText)) {
    wall.setUTCDate(wall.getUTCDate() + dayOffsets[dayText]);
  } else {
    const period = dayText.match(/^(next|last)\s+(week|month|year)$/);
    const weekday = dayText.match(
      /^(?:(next|last|this)\s+)?(sun(?:day)?|mon(?:day)?|tue(?:s|sday)?|wed(?:s|nesday)?|thu(?:rs?|rsday)?|fri(?:day)?|sat(?:urday)?)$/,
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
      const target = weekdays.findIndex((day) =>
        day.startsWith(weekday[2].slice(0, 3)),
      );
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
  // "evening at 7" means 19:00. An explicit am/pm or a named time wins.
  const afterNoon =
    clock &&
    part &&
    part !== "morning" &&
    clock.hours >= (part === "night" ? 5 : 1) &&
    clock.hours < 12 &&
    !/[ap]\.?m|noon|midday|midnight/.test(clockText);
  // "tonight at 1" and "midnight tonight" mean the early hours after tonight.
  if (clock && part === "night" && clock.hours < 5)
    wall.setUTCDate(wall.getUTCDate() + 1);
  const parts: CalendarDate = {
    ...calendarAt(wall, { kind: "offset", minutes: 0 }),
    ...(clock
      ? { ...clock, hours: clock.hours + (afterNoon ? 12 : 0) }
      : {
          hours: part ? dayParts[part] : endOfPeriod ? 23 : 0,
          minutes: endOfPeriod ? 59 : 0,
          seconds: endOfPeriod ? 59 : 0,
        }),
  };
  return dateFromCalendar(parts, zone);
}
