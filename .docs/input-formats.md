# Input formats

Everything the converter accepts, and how it decides which moment you mean. Every example in the app's **Formats & examples** guide is tested to parse, and every listed mistake is tested to be rejected (`tests/examples.test.ts`).

## Timestamps and Discord tags

| Input | Meaning |
| --- | --- |
| `1704067200` | Unix seconds. Bare numbers with 9 or 10 digits are seconds. |
| `1704067200000` | Unix milliseconds. Bare numbers with more than 10 digits are milliseconds. |
| `1704067200s`, `1704067200000ms` | An explicit unit. |
| `unix: 0`, `-1s` | The `unix:` prefix or a sign also marks a timestamp. |
| `<t:1704067200:F>`, `<t:1704067200>` | A pasted Discord tag, with or without a style. Styles are `t T d D f F s S R`. |

Surrounding backticks, as copied from a Discord code span, are ignored.

## ISO dates

- `2025-05-03T10:00Z`, `2025-05-03T10:00+03:00`, `2027-01-15T14:30:00.123Z`
- `2025-05-03` alone means midnight **UTC**.
- An ISO date with a time but no offset uses local time.

## Calendar dates

| Input | Order |
| --- | --- |
| `01/15/2027`, `01/15/2027 14:30` | Slashes are month first. |
| `15.01.2027 14:30`, `15-01-2027 14:30` | Dots and day-first hyphens are day first. |
| `Jan 1st 2024 at 3:00 PM`, `25 December at noon`, `on 25th December 2027` | Month names, in either order. |
| `4.00 @ 10/5/2025 CDT` | `time @ day/month/year`. |

Named dates without a year use the current year. Years are always four digits, and the day has to exist in that month (`Feb 30` is rejected).

## Times

`14:30`, `2 PM`, `3p.m.`, `12:30:45`, `5 o'clock`, `noon`, `midday`, and `midnight` all work alone, after a day (`tomorrow at 3pm`), or before it (`3pm tomorrow`, `noon on Friday`). A time alone means today.

## Relative dates

| Input | Meaning |
| --- | --- |
| `now`, `today`, `tomorrow`, `yesterday` | Days start at midnight. |
| `day after tomorrow`, `day before yesterday` | |
| `Friday`, `this Friday`, `next Friday`, `last Friday` | See weekdays below. |
| `next week`, `last month`, `next year` | Midnight, one week, month, or year away. |
| `start of next month`, `end of week`, `end of next year` | Ends are the last second, 23:59:59. |

Any of these accepts a time before or after it: `tomorrow at 3pm`, `8pm next Friday`.

**Parts of the day.** Add `morning` (09:00), `afternoon` (15:00), `evening` (18:00), or `night` (20:00) after a day: `tomorrow morning`, `Friday evening`, `this afternoon`, `last night`. `tonight` is today's night.

A time after a part of the day reads in its half of the day: `tomorrow evening at 7` is 19:00 and `tonight at 9` is 21:00. Night times before 05:00 belong to the following early morning, so `tonight at 1` and `midnight tonight` are after today ends. An explicit `am`/`pm` always wins.

**Weekdays.** Full names and short forms such as `fri`, `tues`, `weds`, and `thurs` work. Weeks run Monday to Sunday. A bare weekday is its next occurrence, including today. `next` excludes today. `this` stays within the current Monday-to-Sunday week, so it can be in the past.

## Durations

`in 1h 30m`, `1h30m`, `two hours ago`, `in half an hour`, `in a quarter of an hour`, `1 day and 2 hours from now`, `+45m`, `-2h`, `in 1.5 hours`

- Units run from seconds to years: `s`, `m`/`min`, `h`/`hr`, `d`, `w`/`wk`, `mo`, `y`/`yr`, and their full names.
- Quantities are digits, the words one to twelve, `a`, `an`, `half`, and `a quarter of`.
- Hours, minutes, and seconds are elapsed time. Days, weeks, months, and years follow the calendar, so `in 1 day` across a DST change keeps the same clock time, while `in 24 hours` does not.
- Month shifts clamp to the last valid day: one month after January 31 is February 28.
- Fractions are allowed for hours and smaller units only (`in 1.5 months` is rejected).
- Whole-day durations can take a time: `in 3 days at noon`, `2 weeks from now at 9am`, `2 days ago at noon`.

## Timezones

Add a place or timezone to the end of any date or time. It can follow `in` and be followed by `time`: `3pm Tokyo`, `3pm in Tokyo`, and `3pm Tokyo time` are the same.

| Kind | Examples |
| --- | --- |
| Cities | `Tokyo`, `Mumbai`, `São Paulo`, `San Francisco`, `London Ontario` |
| States and provinces | `California`, `Texas`, `Ontario`, `Queensland` |
| Countries | `India`, `Japan`, `Germany`, `Turkey`, `UK`, `UAE` |
| Shared names, made unique | `Springfield, IL`, `Springfield Illinois`, `Hyderabad Pakistan` |
| US regions | `Eastern`, `Central`, `Mountain`, `Pacific` |
| UTC and offsets | `UTC`, `GMT`, `Z`, `UTC+05:30`, `+03:00`, `14:30+03:00` |
| Abbreviations | `EST`, `CDT`, `IST`, `IST (Ireland)` |
| IANA zones | `America/New_York`, `Europe/Istanbul` |
| Local | `local`, `local time` (the default) |

**Places** come from [city-timezones](https://github.com/kevinroberts/city-timezones): about 7,300 cities with their state or province, country, and population. Accents, periods, and commas are optional, so `Sao Paulo` and `Washington DC` work.

A place name resolves only when one clock covers at least 90% of the population behind it. Zones that keep the same offsets count as one clock.

- `Texas` resolves to Central time; El Paso is too small to make it ambiguous.
- `Springfield`, `Hyderabad`, `Birmingham`, `Georgia`, and `Washington` are shared by places on different clocks, so they are rejected rather than guessed. Add the state, its code, or the country.
- Countries that span several timezones, such as the US, Canada, Russia, Australia, and Mexico, are rejected; name a city or state. Countries with small outlying zones, such as China, Spain, and Brazil, use their main one.

Place names load in the background after the page opens. Until they arrive, zones, offsets, and abbreviations still work.

### Rules

- Offsets stop at 14 hours either side.
- Each abbreviation maps to one region and follows that region's daylight saving. For example, `EST` means New York, so it becomes UTC-4 in summer. Use an explicit offset when you need a fixed one.
- Relative dates use the calendar of the given timezone. At 23:30 UTC, `tomorrow at noon Tokyo` is the day after next in UTC terms, because it is already tomorrow in Tokyo.
- Times that do not exist because clocks skip forward are rejected. Times that happen twice because clocks fall back use the earlier one.

Timezone and daylight saving rules come from the browser's `Intl` API. `src/data/*.json` holds the abbreviation mappings and fallback offsets for abbreviations the browser does not know.

## Limits

- Calendar input covers the years 1900 to 3000. Timestamps have no such limit.
- Input up to 500 characters.
- Filler words are not ignored: `sometime tomorrow` and `in the morning` are rejected, so nothing is silently guessed.
