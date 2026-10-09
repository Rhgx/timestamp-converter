import ianaMap from "./abbreviation_to_iana.json";
import offsetMap from "./abbreviation_offsets.json";
import type { TimezoneData } from "../lib/date-time/calendar";

// Bundle the existing maps so conversion does not wait on extra network requests.
export const timezoneData: TimezoneData = { ianaMap, offsetMap };
