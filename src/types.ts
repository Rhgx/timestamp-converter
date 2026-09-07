export interface TimezoneData {
  ianaMap: Record<string, string>;
  offsetMap: Record<string, { standard: number; daylight?: number }>;
}

export interface DateComponents {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export type OffsetInfo = { type: 'utc' } | { type: 'offset'; totalMinutes: number } | { type: 'invalid' } | null;
