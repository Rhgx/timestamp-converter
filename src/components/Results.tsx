import { useEffect, useMemo, useState } from "react";
import { TextMorph } from "torph/react";
import {
  formatDateTime,
  formats,
  getRelativeTime,
} from "../lib/date-time/format";
import { ResultRow } from "./ResultRow";

export function Results({ date }: { date: Date }) {
  const [relative, setRelative] = useState(() => getRelativeTime(date));
  const [utc, setUtc] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const results = useMemo(
    () => formatDateTime(date, utc ? "UTC" : undefined),
    [date, utc],
  );
  const zone = utc ? "UTC" : Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    setRelative(getRelativeTime(date));
    const timer = setInterval(() => setRelative(getRelativeTime(date)), 1000);
    return () => clearInterval(timer);
  }, [date]);

  return (
    <section className="results" aria-labelledby="results-title">
      <div className="results-header">
        <h2 id="results-title">Results</h2>
        <div className="result-options">
          <label className="toggle">
            <input
              type="checkbox"
              checked={utc}
              onChange={(event) => setUtc(event.target.checked)}
            />
            <span>UTC previews</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={showCode}
              onChange={(event) => setShowCode(event.target.checked)}
            />
            <span>Show codes</span>
          </label>
        </div>
      </div>
      <p className="result-help">
        Preview timezone:{" "}
        <strong>
          <TextMorph
            ease={{ stiffness: 480, damping: 28 }}
            scale={false}
            numbers={false}
            respectReducedMotion
          >
            {zone}
          </TextMorph>
        </strong>
        . Discord shows each reader their own local time.
      </p>
      <dl>
        {formats.map(({ key, label, style }, index) => (
          <ResultRow
            key={key}
            index={index}
            label={label}
            syntax={style ? "<t:ts:" + style + ">" : null}
            display={
              showCode
                ? results[key].copy
                : key === "relative"
                  ? relative
                  : results[key].display
            }
            copy={results[key].copy}
          />
        ))}
      </dl>
    </section>
  );
}
