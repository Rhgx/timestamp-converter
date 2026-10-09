// The fields of a city-timezones entry this module reads. Some entries, such
// as Antarctic stations, have no zone.
export interface City {
  city: string;
  city_ascii: string;
  province: string;
  country: string;
  state_ansi?: string;
  timezone: string | null;
  pop: number;
}

// A place name resolves to a zone, or to null when it is ambiguous.
export type Places = Map<string, string | null>;

// One place must hold this share of the population behind a name, counting
// zones with identical clocks together. "Texas" passes; "Springfield" and
// "Australia" do not, and need a state or city instead.
const majority = 0.9;

// Words the parser already uses. A place must never swallow them: Mon is a
// state in Myanmar, and EST a town in Cameroon.
const reserved = new Set(
  `january february march april may june july august september october november december
  jan feb mar apr jun jul aug sep sept oct nov dec
  sunday monday tuesday wednesday thursday friday saturday
  sun mon tue tues wed weds thu thur thurs fri sat
  y yr yrs year years mo mos month months w wk wks week weeks d day days
  h hr hrs hour hours m min mins minute minutes s sec secs second seconds ms
  now later ago noon midday midnight tonight today tomorrow yesterday weekend
  morning afternoon evening night time local utc gmt z est am pm in at on of the`.split(
    /\s+/,
  ),
);

// Common names the dataset lacks or would resolve badly.
const overrides: Record<string, string | null> = {
  usa: null,
  "united states": null,
  america: null,
  washington: null,
  "washington dc": "America/New_York",
  dc: "America/New_York",
  uk: "Europe/London",
  britain: "Europe/London",
  "great britain": "Europe/London",
  england: "Europe/London",
  scotland: "Europe/London",
  wales: "Europe/London",
  uae: "Asia/Dubai",
  korea: "Asia/Seoul",
  kiev: "Europe/Kyiv",
};

// Lowercase, without accents, periods, or commas: "Washington, D.C." becomes
// "washington dc", and "São Paulo" becomes "sao paulo".
export function placeKey(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Zones match when their offsets agree in January and July.
function clockOf(zone: string) {
  try {
    return [0, 6]
      .map(
        (month) =>
          new Intl.DateTimeFormat("en", {
            timeZone: zone,
            timeZoneName: "longOffset",
          })
            .formatToParts(new Date(Date.UTC(2026, month, 1)))
            .find((part) => part.type === "timeZoneName")?.value,
      )
      .join();
  } catch {
    // This browser does not know the zone, so the entry cannot be used.
    return null;
  }
}

export function indexPlaces(cities: readonly City[]): Places {
  const clocks = new Map<string, string | null>();
  // name -> clock -> population per zone
  const named = new Map<string, Map<string, Map<string, number>>>();
  for (const city of cities) {
    if (!city.timezone) continue;
    if (!clocks.has(city.timezone))
      clocks.set(city.timezone, clockOf(city.timezone));
    const clock = clocks.get(city.timezone);
    if (!clock) continue;
    const names = [
      city.city,
      city.city_ascii,
      city.province,
      city.country,
      `${city.city_ascii} ${city.province}`,
      `${city.city_ascii} ${city.country}`,
      city.state_ansi ? `${city.city_ascii} ${city.state_ansi}` : "",
    ];
    for (const name of new Set(names.map(placeKey))) {
      if (!name || reserved.has(name)) continue;
      const byClock = named.get(name) ?? new Map();
      named.set(name, byClock);
      const zones = byClock.get(clock) ?? new Map();
      byClock.set(clock, zones);
      zones.set(
        city.timezone,
        (zones.get(city.timezone) ?? 0) + Math.max(city.pop, 1),
      );
    }
  }

  const sum = (zones: Map<string, number>) =>
    [...zones.values()].reduce((total, pop) => total + pop, 0);
  const places: Places = new Map();
  for (const [name, byClock] of named) {
    const groups = [...byClock.values()].sort((a, b) => sum(b) - sum(a));
    const total = groups.reduce((all, zones) => all + sum(zones), 0);
    const [leader] = groups;
    places.set(
      name,
      sum(leader) / total >= majority
        ? [...leader].sort((a, b) => b[1] - a[1])[0][0]
        : null,
    );
  }
  for (const [name, zone] of Object.entries(overrides)) places.set(name, zone);
  return places;
}
