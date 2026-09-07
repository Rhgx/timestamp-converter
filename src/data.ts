import ianaMap from './data/abbreviation_to_iana.json';
import offsetMap from './data/abbreviation_offsets.json';
import type { TimezoneData } from './types';

// Bundle the existing maps so conversion does not wait on extra network requests.
export const timezoneData: TimezoneData = { ianaMap, offsetMap };
