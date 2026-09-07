export interface TimezoneData {
  ianaMap: Record<string, string>;
  offsetMap: Record<string, { standard: number; daylight?: number }>;
}
