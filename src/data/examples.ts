export const exampleGroups = [
  {
    title: "Natural language",
    note: "Days start at midnight. Tonight means 20:00. Next Friday is the next Friday after today; this Friday belongs to this Monday-to-Sunday week.",
    examples: [
      "now",
      "tomorrow at 3pm",
      "day after tomorrow at noon",
      "next Friday at 18:30",
      "this Monday",
      "last week",
      "tonight",
      "end of month",
      "start of next month",
    ],
    pitfalls: [
      {
        wrong: "tomorrow morning",
        right: "tomorrow at 9am",
        why: "Only tonight, noon, and midnight stand in for a clock time.",
      },
      {
        wrong: "this weekend",
        right: "Saturday at noon",
        why: "Name the day you mean.",
      },
      {
        wrong: "sometime tomorrow",
        right: "tomorrow",
        why: "Filler words around a date are not ignored.",
      },
    ],
  },
  {
    title: "Durations",
    note: "Short forms and word quantities work together. Hours are elapsed time; days, weeks, months, and years follow the calendar. Month shifts clamp to the last valid day.",
    examples: [
      "in 1h 30m",
      "two hours ago",
      "in half an hour",
      "1 day and 2 hours from now",
      "+45m",
      "in 2 weeks",
      "in 1 month",
    ],
    pitfalls: [
      {
        wrong: "in 90",
        right: "in 90m",
        why: "Every quantity needs a unit.",
      },
      {
        wrong: "in a few minutes",
        right: "in 5 minutes",
        why: "Quantities must be digits or number words.",
      },
      {
        wrong: "in 1 fortnight",
        right: "in 2 weeks",
        why: "Units run from seconds to years, nothing between.",
      },
    ],
  },
  {
    title: "Dates and times",
    note: "Slashes use MM/DD/YYYY. Dots and day-first hyphens use DD.MM.YYYY. Named dates without a year use the current year. ISO dates alone use UTC; other dates without a timezone use local time.",
    examples: [
      "Jan 1st 2027 at 3:00 PM",
      "25 December at noon",
      "01/15/2027 14:30",
      "15.01.2027 14:30",
      "4.00 @ 10/5/2027",
      "2027-05-03T10:00Z",
      "noon",
      "midnight",
    ],
    pitfalls: [
      {
        wrong: "15/1/2027",
        right: "15.01.2027",
        why: "Slashes are month-first. Day-first needs dots or hyphens.",
      },
      {
        wrong: "Feb 30 2027",
        right: "Feb 28 2027",
        why: "The day has to exist in that month.",
      },
      {
        wrong: "Jan 1 27",
        right: "Jan 1 2027",
        why: "Years are four digits.",
      },
    ],
  },
  {
    title: "Timezones",
    note: "Append an abbreviation, city alias, IANA zone, or UTC offset. Abbreviations follow their mapped region, including DST. Missing DST times are rejected; repeated times use the earlier occurrence.",
    examples: [
      "tomorrow at 3pm UTC",
      "next Friday at noon Pacific time",
      "14:30 Europe/Istanbul",
      "2 PM EST",
      "12:00 IST (Ireland)",
      "tomorrow at noon UTC+05:30",
      "noon Tokyo",
    ],
    pitfalls: [
      {
        wrong: "2027-03-14 02:30 America/New_York",
        right: "2027-03-14 03:30 America/New_York",
        why: "Clocks skip that hour when daylight saving starts.",
      },
      {
        wrong: "noon UTC+25:00",
        right: "noon UTC+05:30",
        why: "Offsets stop at 14 hours either side.",
      },
      {
        wrong: "noon at Tokyo",
        right: "noon Tokyo",
        why: "The zone follows the time directly, with no at.",
      },
    ],
  },
  {
    title: "Unix and Discord",
    note: "Bare timestamps use seconds, or milliseconds above 10 digits. Add s/ms or unix: to be explicit. Pasted Discord tags and surrounding backticks are accepted.",
    examples: [
      "1704067200",
      "1704067200000ms",
      "unix: 0",
      "-1s",
      "<t:1704067200:F>",
      "<t:1704067200:R>",
    ],
    pitfalls: [
      {
        wrong: "<t:1704067200:X>",
        right: "<t:1704067200:F>",
        why: "Styles are t, T, d, D, f, F, and R.",
      },
      {
        wrong: "<t:1704067200:f",
        right: "<t:1704067200:f>",
        why: "A tag needs both angle brackets.",
      },
      {
        wrong: "unix: abc",
        right: "unix: 1704067200",
        why: "The unix prefix takes digits only.",
      },
    ],
  },
];
