# Development

## Setup

Use Node.js 22.12 or newer and pnpm 11.3.0 (pinned in `package.json`).

```sh
pnpm install
pnpm dev        # serves under /timestamp-converter/
```

| Script | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server. |
| `pnpm test` | Runs `tests/*.test.ts` with Node's test runner through tsx. |
| `pnpm typecheck` | `tsc --noEmit` over `src`, `tests`, and the Vite config. |
| `pnpm build` | Typecheck, then build into `dist/`. |
| `pnpm preview` | Serve the built `dist/` locally. |

The app is served under `/timestamp-converter/` in development and production (`base` in `vite.config.ts`), matching its GitHub Pages path.

Run only one dev server per checkout. Vite keeps pre-bundled dependencies in `node_modules/.vite`, and a second server can rewrite them under the first one's open pages.

## Deployment

`.github/workflows/pages.yml` runs on every push to `main`: install with a frozen lockfile, test, build, and deploy `dist/` to GitHub Pages at <https://rhgx.github.io/timestamp-converter/>.

## Code layout

```
src/
  App.tsx                 input, URL state, and conversion
  components/
    FormatHelp.tsx        Formats & examples dialog
    calendar/             calendar dialog, month carousel, time wheels, hold-to-repeat buttons
    results/              result list and copy controls
  data/
    timezones.ts          bundles the abbreviation maps and loads place names
    examples.ts           grouped examples and mistakes used by the guide
    abbreviation_*.json   abbreviation to IANA zone and fallback offset maps
  lib/date-time/
    parse.ts              entry point: Unix, Discord, ISO, and calendar syntax
    natural.ts            relative phrases, weekdays, and durations
    calendar.ts           clock parsing, timezone resolution, and DST validation
    places.ts             city, state, and country lookup built from city-timezones
    format.ts             Discord output formats and relative previews
  styles/
    index.css             import order for the files below
    theme.css             color, shape, and motion tokens
    base.css, converter.css, results.css, format-guide.css, calendar.css
    adaptations.css       motion and responsive overrides, loaded last
public/
  favicon.svg
tests/
  parse.test.ts           absolute input, timezones, DST, and rejections
  natural.test.ts         relative language against a fixed reference date
  format.test.ts          Discord styles and previews
  examples.test.ts        every guide example parses; every mistake is rejected
```

## How parsing works

`parseDateTime(input, timezoneData, reference?)` returns a `Date` or `null`. It tries, in order:

1. Discord tags and Unix timestamps.
2. ISO dates.
3. A trailing timezone is split off (`extractZone`), then the rest goes to the natural-language parser (`parseNatural`).
4. If that fails: a time alone, then `time @ D/M/Y`, numeric dates, and named-month dates.

Calendar math works on wall-clock fields (`CalendarDate`) and converts to an instant only at the end (`dateFromCalendar`). That step rejects impossible dates and DST gaps, and picks the earlier instant in a DST fold. Pass `reference` to make relative input deterministic, as the tests do.

## Place names

City, state, and country names come from `city-timezones`. `src/lib/date-time/places.ts` turns its city list into a lookup from name to zone:

- Each city adds its name, province, country, and the combinations `city province`, `city country`, and `city state-code`.
- A name maps to a zone when one clock holds at least 90% of the population behind it, and to `null` (ambiguous, rejected) otherwise.
- `reserved` keeps parser words such as `mon` and `est` out of the lookup, and `overrides` adds common names the dataset lacks, such as `UK` and `UAE`.

The package is about 250 KB gzipped, so `src/data/timezones.ts` imports it dynamically into its own chunk and fills `timezoneData.places` when it arrives. `placesReady` resolves at that point; the app re-renders and retries a shared link, and tests `await` it before parsing.

## Conventions

- Keep color and motion values in `styles/theme.css`; other stylesheets use its variables.
- Every animation needs a reduced-motion path. Most CSS motion sits inside `prefers-reduced-motion: no-preference` blocks; Motion springs check `useReducedMotion()`.
- Adding an example or mistake to `src/data/examples.ts` automatically adds a test for it.
- Tests set `process.env.TZ = "UTC"` so local-time expectations are stable.

## Dependencies

| Package | Used for |
| --- | --- |
| React | UI. |
| [Motion](https://motion.dev/) | Calendar springs and gestures. |
| [Torph](https://torph.lochie.me/) | Morphing result text. |
| [React Datepicker](https://reactdatepicker.com/) | The month grid, loaded on demand. |
| [city-timezones](https://github.com/kevinroberts/city-timezones) | City, state, and country names, loaded after the page. |
| [Lucide](https://lucide.dev/) | Icons. |

Apart from place names, parsing and formatting use only the built-in `Date` and `Intl` APIs.
