export const exampleGroups = [
  {
    title: "Natural language",
    note: "Days start at midnight. Morning is 9:00, afternoon 15:00, evening 18:00, and night 20:00.",
    examples: [
      "now",
      "tomorrow at 3pm",
      "3pm tomorrow",
      "tomorrow morning",
      "Friday evening at 7",
      "tonight at 9",
      "next Friday at 18:30",
      "day after tomorrow at noon",
      "this Monday",
      "last week",
      "end of month",
      "start of next month",
    ],
    pitfalls: [
      {
        wrong: "in the morning",
        right: "tomorrow morning",
        why: "Say which day.",
      },
      {
        wrong: "this weekend",
        right: "Saturday at noon",
        why: "Name the day you mean.",
      },
      {
        wrong: "sometime tomorrow",
        right: "tomorrow",
        why: "Leave out filler words.",
      },
    ],
  },
  {
    title: "Durations",
    note: "Mix units and number words. Days and longer can take a time.",
    examples: [
      "in 1h 30m",
      "two hours ago",
      "in half an hour",
      "1 day and 2 hours from now",
      "+45m",
      "in 2 weeks",
      "in 1 month",
      "in 3 days at noon",
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
        why: "Use a number.",
      },
      {
        wrong: "in 1 fortnight",
        right: "in 2 weeks",
        why: "Use days, weeks, months, or years.",
      },
    ],
  },
  {
    title: "Dates and times",
    note: "Slashes are month first, dots are day first. No year means this year.",
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
        why: "Slashes are month first. Use dots for day first.",
      },
      {
        wrong: "Feb 30 2027",
        right: "Feb 28 2027",
        why: "That day doesn't exist.",
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
    note: "End with a place, abbreviation, or UTC offset.",
    examples: [
      "tomorrow at 3pm UTC",
      "8pm in Mumbai",
      "noon India time",
      "noon Springfield, IL",
      "next Friday at noon Pacific time",
      "14:30 Europe/Istanbul",
      "2 PM EST",
      "12:00 IST (Ireland)",
      "tomorrow at noon UTC+05:30",
      "noon California",
    ],
    pitfalls: [
      {
        wrong: "2027-03-14 02:30 America/New_York",
        right: "2027-03-14 03:30 America/New_York",
        why: "That hour is skipped for daylight saving.",
      },
      {
        wrong: "noon UTC+25:00",
        right: "noon UTC+05:30",
        why: "Offsets go up to 14 hours.",
      },
      {
        wrong: "noon Springfield",
        right: "noon Springfield, IL",
        why: "Several cities share that name. Add the state.",
      },
      {
        wrong: "noon at Tokyo",
        right: "noon in Tokyo",
        why: "Use in, not at.",
      },
      {
        wrong: "noon USA",
        right: "noon New York",
        why: "The US has several timezones. Name a city or state.",
      },
    ],
  },
  {
    title: "Unix and Discord",
    note: "Seconds or milliseconds, or paste a Discord tag.",
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
        why: "Styles are t, T, d, D, f, F, s, S, and R.",
      },
      {
        wrong: "<t:1704067200:f",
        right: "<t:1704067200:f>",
        why: "Close the tag.",
      },
      {
        wrong: "unix: abc",
        right: "unix: 1704067200",
        why: "unix: takes a number.",
      },
    ],
  },
];
