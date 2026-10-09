import ianaMap from "./abbreviation_to_iana.json";
import offsetMap from "./abbreviation_offsets.json";
import type { TimezoneData } from "../lib/date-time/calendar";
import { indexPlaces } from "../lib/date-time/places";

// Bundle the existing maps so conversion does not wait on extra network requests.
export const timezoneData: TimezoneData = {
  ianaMap,
  offsetMap,
  places: new Map(),
};

// city-timezones is about 250 KB gzipped, so place names load after the page
// instead of delaying it. Until then, zones, offsets, and abbreviations work.
export const placesReady: Promise<void> = import("city-timezones").then(
  ({ cityMapping }) => {
    for (const [name, zone] of indexPlaces(cityMapping))
      timezoneData.places.set(name, zone);
  },
  (error: unknown) => {
    console.error("Place names could not be loaded.", error);
  },
);
