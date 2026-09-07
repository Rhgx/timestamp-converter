import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { TextMorph } from 'torph/react';
import { timezoneData } from './data';
import { formatDateTime, getRelativeTime } from './formatter';
import { parseDateTime } from './parser';

const formats = [
  { key: 'unixTimestamp', label: 'Unix timestamp', style: null },
  { key: 'shortTime', label: 'Short time', style: 't' },
  { key: 'longTime', label: 'Long time', style: 'T' },
  { key: 'shortDate', label: 'Short date', style: 'd' },
  { key: 'longDate', label: 'Long date', style: 'D' },
  { key: 'longDateShortTime', label: 'Date & time', style: 'f' },
  { key: 'longDateDayShortTime', label: 'Date, day & time', style: 'F' },
  { key: 'relative', label: 'Relative', style: 'R' },
] as const;

function ResultRow({ label, syntax, display, copy }: {
  label: string;
  syntax: string | null;
  display: string;
  copy: string;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const currentCopy = useRef(copy);
  currentCopy.current = copy;

  useEffect(() => {
    setCopied(false);
    setCopyError(false);
    return () => clearTimeout(resetTimer.current);
  }, [copy]);

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(copy);
      if (currentCopy.current !== copy) return;
      setCopied(true);
      setCopyError(false);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      if (currentCopy.current === copy) setCopyError(true);
    }
  }

  return (
    <div className="result-row">
      <dt className="result-label">
        {label}
        {syntax && <code>{syntax}</code>}
      </dt>
      <dd className="result-content">
        <div className="result-value" aria-label={`${label}: ${display}`}>
          <TextMorph duration={220} scale={false} respectReducedMotion>{display}</TextMorph>
        </div>
        <button
          className={`copy-button${copied ? ' copied' : ''}`}
          type="button"
          onClick={copyResult}
          aria-label={`${copied ? 'Copied' : 'Copy'} ${label.toLowerCase()}`}
          title={copy}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path className="copy-icon" d="M7 6V3.75A.75.75 0 0 1 7.75 3h8.5a.75.75 0 0 1 .75.75v8.5a.75.75 0 0 1-.75.75H14" />
            <rect className="copy-icon" x="3" y="7" width="10" height="10" rx="1" />
            <path className="check-icon" d="m4 10 4 4 8-8" />
          </svg>
          <TextMorph duration={180} scale={false} respectReducedMotion>{copied ? 'Copied!' : 'Copy'}</TextMorph>
        </button>
        <span className="sr-only" role="status">{copied ? `${label} copied to clipboard.` : ''}</span>
        {copyError && <p className="copy-error" role="alert">Couldn't access the clipboard. Copy this text: <code>{copy}</code></p>}
      </dd>
    </div>
  );
}

function Results({ date }: { date: Date }) {
  const [relative, setRelative] = useState(() => getRelativeTime(date));
  const results = formatDateTime(date);

  useEffect(() => {
    setRelative(getRelativeTime(date));
    const timer = setInterval(() => setRelative(getRelativeTime(date)), 1000);
    return () => clearInterval(timer);
  }, [date]);

  return (
    <section className="results" aria-labelledby="results-title">
      <h2 id="results-title">Results</h2>
      <p className="result-help">Previews use your local timezone. Copy a format to display it in each Discord reader's timezone.</p>
      <dl>
        {formats.map(({ key, label, style }) => (
          <ResultRow key={key} label={label}
            syntax={style ? `<t:ts:${style}>` : null}
            display={key === 'relative' ? relative : String(results[key].display)}
            copy={String(results[key].copy)} />
        ))}
      </dl>
    </section>
  );
}

export default function App() {
  const [input, setInput] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [error, setError] = useState('');

  function convert(value: string) {
    if (!value.trim()) {
      setError('Please enter a date/time value.');
      setDate(null);
      return;
    }
    const parsed = parseDateTime(value, timezoneData);
    if (!parsed || Number.isNaN(parsed.getTime())) {
      setError("Invalid date/time or unknown timezone. Try '14:30 UTC', '2 PM EST', or '2025-05-03T10:00Z'.");
      setDate(null);
      return;
    }
    setError('');
    setDate(parsed);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    convert(input);
  }

  return (
    <main>
      <h1>Discord Unix Timestamp Converter</h1>
      <form onSubmit={submit}>
        <label htmlFor="date-time">Enter date/time:</label>
        <input id="date-time" value={input} onChange={event => setInput(event.target.value)}
          aria-describedby={error ? 'format-help input-error' : 'format-help'}
          aria-invalid={Boolean(error)} autoComplete="off" spellCheck={false}
          placeholder="e.g., 14:30 UTC, 2 PM EST, 4.00 @ 10/5/2025 CDT, 2025-05-03T10:00Z" />
        <p id="format-help" className="format-help">Formats: Unix timestamp, <code>{'<t:ts:F>'}</code>, today/tomorrow/in 3 hours, Jan 1 2024, MM/DD/YYYY, HH:MM [TZ], Time @ D/M/Y</p>
        <div className="form-actions">
          <button className="convert-button" type="submit">Convert</button>
          <div className="examples" aria-label="Example dates">
            <span>Try</span>
            {['now', 'tomorrow', 'in 3 hours'].map(example => (
              <button type="button" key={example} onClick={() => { setInput(example); convert(example); }}>{example}</button>
            ))}
          </div>
        </div>
      </form>
      {error && <p id="input-error" className="error" role="alert">{error}</p>}
      <div className="sr-only" role="status">{date ? `Converted to ${date.toLocaleString()}. Results available below.` : ''}</div>
      {date && <Results date={date} />}
    </main>
  );
}
