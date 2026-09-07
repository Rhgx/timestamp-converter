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

Previews follow the viewer's locale and timezone. Copy buttons produce Discord markup, except the Unix row, which copies seconds. Relative previews update once per second. Torph handles result and copy-label transitions and respects reduced motion preferences; the result section uses a 200 ms CSS entrance.

## Origin

Migrated from [`Rhgx/rhgx.github.io/timestamp-converter`](https://github.com/Rhgx/rhgx.github.io/tree/b7c432abff23b4617f4dbf03cc2db30056e4c535/timestamp-converter). The parser, formatter, and timezone data were ported from that version. Bootstrap, Typed.js, and Anime.js are replaced by local CSS, React rendering, and Torph.
