import { useRef, useState } from "react";
import { X } from "lucide-react";
import type { SubmitEvent } from "react";
import { timezoneData } from "./data/timezones";
import { parseDateTime } from "./lib/date-time/parse";
import { FormatHelp } from "./components/FormatHelp";
import { Results } from "./components/results/Results";
import { CalendarPicker } from "./components/calendar/CalendarPicker";

const unreadable = "Couldn't read that. Check the format or timezone.";

function read(value: string) {
  const parsed = parseDateTime(value, timezoneData);
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

// Links carry the input as ?q=. Relative input resolves when the link opens.
function saveQuery(value: string) {
  const url = new URL(location.href);
  if (value) url.searchParams.set("q", value);
  else url.searchParams.delete("q");
  history.replaceState(null, "", url);
}

const sharedInput = new URLSearchParams(location.search).get("q")?.trim() ?? "";
const sharedDate = sharedInput ? read(sharedInput) : null;

export default function App() {
  const [input, setInput] = useState(sharedInput);
  const [date, setDate] = useState<Date | null>(sharedDate);
  const [error, setError] = useState(
    sharedInput && !sharedDate ? unreadable : "",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Shows how the input will be read before it is converted.
  const reading = input.trim() ? read(input.trim()) : null;

  function convert(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a date or time.");
      return;
    }
    const parsed = read(trimmed);
    if (!parsed) {
      setError(unreadable);
      return;
    }
    setInput(trimmed);
    setError("");
    setDate(parsed);
    saveQuery(trimmed);
  }

  // Picking from the guide is a choice, not a draft: convert it straight away
  // and hand the input back for editing.
  function choose(value: string) {
    convert(value);
    inputRef.current?.focus();
  }

  function clear() {
    setInput("");
    setError("");
    setDate(null);
    saveQuery("");
    inputRef.current?.focus();
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    convert(input);
  }

  return (
    <main>
      <h1>Discord Unix Timestamp Converter</h1>

      <div className="input-heading">
        <label htmlFor="date-time">Enter date/time</label>
        <FormatHelp onChoose={choose} />
      </div>
      <form onSubmit={submit} noValidate>
        <div className="input-row">
          <input
            ref={inputRef}
            id="date-time"
            className="main-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError("");
            }}
            aria-describedby={error ? "input-hint input-error" : "input-hint"}
            aria-invalid={Boolean(error)}
            autoComplete="off"
            spellCheck={false}
            maxLength={500}
            enterKeyHint="go"
            placeholder="e.g., tomorrow at 3pm, in 1h 30m, next Friday at noon UTC"
          />
          <button className="convert-button" type="submit">
            Convert
          </button>
          <CalendarPicker value={date} onApply={choose} />
          <button
            className="secondary-button icon-button"
            type="button"
            aria-label="Clear input and results"
            title="Clear input and results"
            disabled={!input && !date}
            onClick={clear}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="form-actions">
          <p id="input-hint" className="format-help">
            {reading ? (
              <>
                Reads as{" "}
                <strong>
                  {reading.toLocaleString(undefined, {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </strong>
                , your time.
              </>
            ) : (
              "Dates without a timezone use your local time."
            )}
          </p>
          <div className="examples" aria-label="Quick dates">
            <span className="chip-legend">Quick</span>
            {["now", "tomorrow", "in 3 hours"].map((example) => (
              <button
                type="button"
                className="chip"
                key={example}
                onClick={() => choose(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </form>
      {error && (
        <p id="input-error" className="error" role="alert">
          {error}
        </p>
      )}
      <div className="sr-only" role="status">
        {date
          ? "Converted to " +
            date.toLocaleString() +
            ". Results available below."
          : ""}
      </div>
      {date && <Results date={date} />}
    </main>
  );
}
