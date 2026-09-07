import type { TimezoneData } from "../../types";

export type Zone =
  | { kind: "local" }
  | { kind: "offset"; minutes: number }
  | { kind: "iana"; name: string };
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const aliases: Record<string, string> = {
  eastern: "America/New_York",
  "eastern time": "America/New_York",
  central: "America/Chicago",
  "central time": "America/Chicago",
  mountain: "America/Denver",
  "mountain time": "America/Denver",
  pacific: "America/Los_Angeles",
  "pacific time": "America/Los_Angeles",
  london: "Europe/London",
  istanbul: "Europe/Istanbul",
  "turkey time": "Europe/Istanbul",
  tokyo: "Asia/Tokyo",
  "india time": "Asia/Kolkata",
  sydney: "Australia/Sydney",
};

export function resolveZone(name: string, data: TimezoneData): Zone | null {
  if (/^(local|local time)$/i.test(name)) return { kind: "local" };
  if (/^(z|utc|gmt)$/i.test(name)) return { kind: "offset", minutes: 0 };
  const offset = name.match(/^(?:UTC|GMT)?([+-])(\d{1,2})(?::?(\d{2}))?$/i);
  if (offset) {
    const hours = Number(offset[2]);
    const minutes = Number(offset[3] ?? 0);
    if (hours > 14 || minutes > 59 || (hours === 14 && minutes > 0))
      return null;
    return {
      kind: "offset",
      minutes: (hours * 60 + minutes) * (offset[1] === "-" ? -1 : 1),
    };
  }
  const key = Object.keys(data.ianaMap).find(
    (key) => key.toLowerCase() === name.toLowerCase(),
  );
  const zone = key
    ? data.ianaMap[key]
    : Object.hasOwn(aliases, name.toLowerCase())
      ? aliases[name.toLowerCase()]
      : name;
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return { kind: "iana", name: zone };
  } catch {
    const fallback = key ? data.offsetMap[key] : undefined;
    return fallback ? { kind: "offset", minutes: fallback.standard } : null;
  }
}

export function extractZone(
  input: string,
  data: TimezoneData,
): { text: string; zone: Zone } | null {
  const attached = input.match(
    /^(\d{1,2}[:.]\d{2}(?:[:.]\d{2})?)(Z|UTC|GMT|(?:UTC|GMT)?[+-]\d{1,2}(?::?\d{2})?)$/i,
  );
  if (attached) {
    const zone = resolveZone(attached[2], data);
    return zone ? { text: attached[1], zone } : null;
  }
  const names = [
    ...Object.keys(data.ianaMap),
    ...Object.keys(aliases),
    "UTC",
    "GMT",
    "Z",
    "local",
    "local time",
  ].sort((a, b) => b.length - a.length);
  for (const name of names) {
    if (input.toLowerCase().endsWith(" " + name.toLowerCase())) {
      const zone = resolveZone(name, data);
      return zone ? { text: input.slice(0, -name.length).trim(), zone } : null;
    }
  }
  const suffix = input.match(
    /\s+((?:UTC|GMT)?[+-]\d{1,2}(?::?\d{2})?|[A-Za-z_]+\/[A-Za-z0-9_+/-]+)$/i,
  );
  if (suffix) {
    const zone = resolveZone(suffix[1], data);
    return zone
      ? { text: input.slice(0, -suffix[0].length).trim(), zone }
      : null;
  }
  return { text: input, zone: { kind: "local" } };
}

export function calendarAt(date: Date, zone: Zone): CalendarDate {
  if (zone.kind === "iana") {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone.name,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hourCycle: "h23",
    }).formatToParts(date);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value);
    return {
      year: value("year"),
      month: value("month") - 1,
      day: value("day"),
      hours: value("hour"),
      minutes: value("minute"),
      seconds: value("second"),
    };
  }
  if (zone.kind === "offset") {
    const shifted = new Date(date.getTime() + zone.minutes * 60_000);
    return {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth(),
      day: shifted.getUTCDate(),
      hours: shifted.getUTCHours(),
      minutes: shifted.getUTCMinutes(),
      seconds: shifted.getUTCSeconds(),
    };
  }
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
  };
}

export function calendarStamp(parts: CalendarDate): number {
  return Date.UTC(
    parts.year,
    parts.month,
    parts.day,
    parts.hours,
    parts.minutes,
    parts.seconds,
  );
}

export function dateFromCalendar(parts: CalendarDate, zone: Zone): Date | null {
  const stamp = calendarStamp(parts);
  if (parts.year < 1900 || parts.year > 3000 || !Number.isFinite(stamp))
    return null;
  const normalized = calendarAt(new Date(stamp), {
    kind: "offset",
    minutes: 0,
  });
  if (
    normalized.year !== parts.year ||
    normalized.month !== parts.month ||
    normalized.day !== parts.day ||
    normalized.hours !== parts.hours ||
    normalized.minutes !== parts.minutes ||
    normalized.seconds !== parts.seconds
  )
    return null;
  if (zone.kind === "offset") return new Date(stamp - zone.minutes * 60_000);
  if (zone.kind === "local") {
    const date = new Date(
      parts.year,
      parts.month,
      parts.day,
      parts.hours,
      parts.minutes,
      parts.seconds,
    );
    return calendarStamp(calendarAt(date, zone)) === stamp ? date : null;
  }
  // Check both sides of a DST transition. Repeated wall times choose the earlier instant.
  const candidates = [-86400_000, 0, 86400_000]
    .map((delta) => {
      const sample = new Date(stamp + delta);
      const offset = calendarStamp(calendarAt(sample, zone)) - sample.getTime();
      return new Date(stamp - offset);
    })
    .filter((date) => calendarStamp(calendarAt(date, zone)) === stamp);
  return candidates.length
    ? new Date(Math.min(...candidates.map((date) => date.getTime())))
    : null;
}

export function parseClock(
  input: string,
): Pick<CalendarDate, "hours" | "minutes" | "seconds"> | null {
  const text = input
    .toLowerCase()
    .trim()
    .replace(/([ap])\.?m\.?$/, "$1m");
  if (text === "noon" || text === "midday")
    return { hours: 12, minutes: 0, seconds: 0 };
  if (text === "midnight") return { hours: 0, minutes: 0, seconds: 0 };
  const match = text.match(
    /^(\d{1,2})(?:[:.](\d{2}))?(?:[:.](\d{2}))?\s*(am|pm)?$/,
  );
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  if (minutes > 59 || seconds > 59 || hours > 23) return null;
  if (match[4]) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (match[4] === "pm" ? 12 : 0);
  }
  return { hours, minutes, seconds };
}
