# Discord Unix Timestamp Converter

Convert a date or time into Unix seconds and all seven Discord timestamp formats. Built with React, TypeScript, Vite, and [Torph](https://torph.lochie.me/).

## Development

Use Node.js 22.12 or newer and pnpm 11.3.0.

```sh
pnpm install
pnpm dev
```

```sh
pnpm test
pnpm build
pnpm preview
```

The app runs under `/timestamp-converter/` in development and production. The Pages workflow tests and builds every push to `main`.

## Supported input

- Unix timestamps in seconds or milliseconds, and Discord tags such as `<t:1704067200:F>`.
- ISO dates and times, such as `2025-05-03T10:00Z`.
- Natural dates such as `Jan 1st 2024 at 3:00 PM`, or US dates such as `01/15/2024`.
- `now`, `today`, `tomorrow`, `yesterday`, `next week`, `last month`, `in 3 hours`, and `2 days ago`.
- Time alone, such as `14:30 UTC` or `2 PM EST`.
- `Time @ D/M/Y`, such as `4.00 @ 10/5/2025 CDT`.
- Explicit UTC offsets, timezone abbreviations, and IANA zones such as `America/New_York`.

Abbreviations retain the original converter's regional mappings. For example, `EST` maps to New York and follows its seasonal offset. Use explicit UTC offsets when a fixed offset is needed. Browser `Intl` supplies timezone and daylight saving rules; the bundled JSON files provide the original abbreviation mappings and fallback offsets.

Additional natural language includes `tomorrow at 3pm`, `next Friday at noon`, `day after tomorrow`, `tonight`, `end of month`, and `start of next month`. Durations accept compound and abbreviated units, such as `in 1h 30m`, `two hours ago`, `+45m`, and `in half an hour`. Named dates also accept the day first, or omit the year. Dotted and day-first hyphenated dates use day/month/year; slash dates keep the original month/day/year convention.

Date-only ISO input keeps the original UTC interpretation. Other calendar input defaults to local time. Relative dates use the calendar in the specified timezone. Named dates without a year use the current year, tonight means 20:00, and weeks run Monday to Sunday. A bare weekday means its next occurrence including today; `next` excludes today. Hours count elapsed time, while days and months follow the calendar. Month changes clamp to the last valid day. DST gaps are rejected and repeated times choose the earlier occurrence.

## Interface

The searchable Formats & examples dialog converts selected examples immediately and returns focus to the input for editing. It also shows unsupported inputs with clickable corrections. The native dialog supports Escape, focus containment, and restoring focus. The calendar button beside Convert opens a local date picker and converts the selected date and time.

UTC previews change only the displayed timezone. Show codes displays the exact clipboard content. Copy buttons use Lucide copy/check icons with accessible labels and success announcements. Failed clipboard writes expose the value for manual copying. Invalid conversions show an error and retain the last successful result.

Torph animates result updates, while CSS handles entrances and icon feedback. Both respect reduced motion preferences.

## Code layout

- `src/lib/date-time/parse.ts`: Unix, Discord, ISO, and calendar syntax.
- `src/lib/date-time/natural.ts`: relative phrases, weekdays, and durations.
- `src/lib/date-time/calendar.ts`: clock parsing, timezone resolution, and DST validation.
- `src/lib/date-time/format.ts`: Discord output formats and relative previews.
- `src/components/`: format guide, result list, and copy controls.
- `src/data/examples.ts`: grouped examples used by the guide and checked by tests.
- `tests/date-time.test.ts`: existing format coverage, new language, and calendar edge cases.

The parser uses native Date and Intl APIs. Lucide is the only new runtime dependency for these additions.

## Origin

Migrated from [`Rhgx/rhgx.github.io/timestamp-converter`](https://github.com/Rhgx/rhgx.github.io/tree/b7c432abff23b4617f4dbf03cc2db30056e4c535/timestamp-converter). The parser, formatter, and timezone data were ported from that version. Bootstrap, Typed.js, and Anime.js are replaced by local CSS, React rendering, and Torph.
