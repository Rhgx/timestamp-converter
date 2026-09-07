export const formats = [
  { key: "unixTimestamp", label: "Unix timestamp", style: null },
  { key: "shortTime", label: "Short time", style: "t" },
  { key: "longTime", label: "Long time", style: "T" },
  { key: "shortDate", label: "Short date", style: "d" },
  { key: "longDate", label: "Long date", style: "D" },
  { key: "longDateShortTime", label: "Date & time", style: "f" },
  { key: "longDateDayShortTime", label: "Date, day & time", style: "F" },
  { key: "relative", label: "Relative", style: "R" },
] as const;

type FormatKey = (typeof formats)[number]["key"];
const previewOptions: Record<string, Intl.DateTimeFormatOptions> = {
  t: { timeStyle: "short" },
  T: { timeStyle: "medium" },
  d: { dateStyle: "short" },
  D: { dateStyle: "long" },
  f: { dateStyle: "long", timeStyle: "short" },
  F: {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  },
};

export function formatDateTime(date: Date, timeZone?: string) {
  const timestamp = String(Math.floor(date.getTime() / 1000));
  function result(style: string | null) {
    if (!Number.isFinite(date.getTime()))
      return { display: "Error", copy: "Error" };
    if (!style) return { display: timestamp, copy: timestamp };
    return {
      display:
        style === "R"
          ? getRelativeTime(date)
          : new Intl.DateTimeFormat(undefined, {
              ...previewOptions[style],
              timeZone,
            }).format(date),
      copy: "<t:" + timestamp + ":" + style + ">",
    };
  }
  // Explicit keys keep the return type useful to both the UI and callers.
  const results: Record<FormatKey, { display: string; copy: string }> = {
    unixTimestamp: result(null),
    shortTime: result("t"),
    longTime: result("T"),
    shortDate: result("d"),
    longDate: result("D"),
    longDateShortTime: result("f"),
    longDateDayShortTime: result("F"),
    relative: result("R"),
  };
  return results;
}

export function getRelativeTime(date: Date, now = new Date()): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  if (!Number.isFinite(seconds)) return "Invalid Date";
  const absolute = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (absolute < 60) return rtf.format(seconds, "second");
  if (absolute < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (absolute < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (absolute < 2592000) return rtf.format(Math.round(seconds / 86400), "day");
  if (absolute < 31536000)
    return rtf.format(Math.round(seconds / 2629800), "month");
  return rtf.format(Math.round(seconds / 31557600), "year");
}
