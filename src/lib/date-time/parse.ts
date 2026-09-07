import type { TimezoneData } from "../../types";
import {
  calendarAt,
  dateFromCalendar,
  extractZone,
  parseClock,
  resolveZone,
} from "./calendar";
import { parseNatural } from "./natural";

const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export function parseDateTime(
  raw: string,
  data: TimezoneData,
  reference = new Date(),
): Date | null {
  const input = raw
    .trim()
    .replace(/^\u0060([^\u0060]+)\u0060$/, "$1")
    .replace(/\s+/g, " ");
  if (!input || input.length > 500 || !Number.isFinite(reference.getTime()))
    return null;
  const discord = input.match(/^<t:(-?\d+)(?::[tTdDfFR])?>$/);
  if (discord) {
    const date = new Date(Number(discord[1]) * 1000);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  const unix = input.match(/^(?:unix:\s*)?(-?\d+(?:\.\d+)?)\s*(ms|s)?$/i);
  if (
    unix &&
    (/^unix:/i.test(input) ||
      unix[2] ||
      /^-?\d{9,13}$/.test(input) ||
      input === "0" ||
      /^-\d+$/.test(input))
  ) {
    const milliseconds =
      unix[2]?.toLowerCase() === "ms" ||
      (!unix[2] && unix[1].replace("-", "").length > 10);
    const date = new Date(Number(unix[1]) * (milliseconds ? 1 : 1000));
    return Number.isFinite(date.getTime()) ? date : null;
  }
  const iso = input.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d+)?)?)?(Z|[+-]\d{2}:?\d{2})?$/i,
  );
  if (iso) {
    const zone = iso[8]
      ? resolveZone(iso[8], data)
      : iso[4]
        ? { kind: "local" as const }
        : { kind: "offset" as const, minutes: 0 };
    if (!zone) return null;
    const date = dateFromCalendar(
      {
        year: Number(iso[1]),
        month: Number(iso[2]) - 1,
        day: Number(iso[3]),
        hours: Number(iso[4] ?? 0),
        minutes: Number(iso[5] ?? 0),
        seconds: Number(iso[6] ?? 0),
      },
      zone,
    );
    return date
      ? new Date(date.getTime() + Math.floor(Number(iso[7] ?? 0) * 1000))
      : null;
  }
  const extracted = extractZone(input, data);
  if (!extracted) return null;
  const { zone } = extracted;
  const text = extracted.text
    .replace(/^on\s+/i, "")
    .replace(/^(\d{4}-\d{2}-\d{2})T/i, "$1 ");
  const natural = parseNatural(text, zone, reference);
  if (natural) return natural;
  const today = calendarAt(reference, zone);
  const standaloneClock = parseClock(text.replace(/^at\s+/i, ""));
  if (standaloneClock && !/^\d{1,2}$/.test(text))
    return dateFromCalendar({ ...today, ...standaloneClock }, zone);
  const european = text.match(
    /^(.+?)\s*@\s*(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/,
  );
  const numeric = text.match(
    /^(\d{1,4})([-/.])(\d{1,2})\2(\d{1,4})(?:\s+(?:at\s+)?(.+))?$/i,
  );
  const named = text.match(
    /^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?(?:\s+(?:at\s+)?(.+))?$/i,
  );
  const reversed = text.match(
    /^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)(?:,?\s+(\d{4}))?(?:\s+(?:at\s+)?(.+))?$/i,
  );
  let year = today.year,
    month = today.month,
    day = today.day,
    time = "";
  if (european) {
    [, time] = european;
    day = Number(european[2]);
    month = Number(european[3]) - 1;
    year = Number(european[4]);
  } else if (numeric) {
    const first = Number(numeric[1]),
      middle = Number(numeric[3]),
      last = Number(numeric[4]);
    if (numeric[1].length === 4) {
      year = first;
      month = middle - 1;
      day = last;
    } else if (numeric[4].length === 4) {
      year = last;
      month = (numeric[2] === "/" ? first : middle) - 1;
      day = numeric[2] === "/" ? middle : first;
    } else return null;
    time = numeric[5] ?? "";
  } else if (named || reversed) {
    const match = named || reversed;
    if (!match) return null;
    const monthName = (named ? match[1] : match[2]).toLowerCase();
    month = months.findIndex(
      (name) =>
        name === monthName ||
        name.slice(0, 3) === monthName ||
        (name === "september" && monthName === "sept"),
    );
    if (month === -1) return null;
    day = Number(named ? match[2] : match[1]);
    year = match[3] ? Number(match[3]) : today.year;
    time = match[4] ?? "";
  } else {
    if (
      !/^(?:at\s+|noon$|midday$|midnight$|\d{1,2}[:.]|\d{1,2}\s*[ap]\.?m)/i.test(
        text,
      )
    )
      return null;
    time = text.replace(/^at\s+/i, "");
  }
  const clock = time ? parseClock(time) : { hours: 0, minutes: 0, seconds: 0 };
  return clock ? dateFromCalendar({ year, month, day, ...clock }, zone) : null;
}
