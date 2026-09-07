import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { TextMorph } from "torph/react";
import { Check, Copy } from "lucide-react";

export function ResultRow({
  label,
  syntax,
  display,
  copy,
  index,
}: {
  label: string;
  syntax: string | null;
  display: string;
  copy: string;
  index: number;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
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
    <div
      className="result-row"
      style={{ "--row-index": index } as CSSProperties}
    >
      <dt className="result-label">
        {label}
        {syntax && <code>{syntax}</code>}
      </dt>
      <dd className="result-content">
        <div className="result-value" aria-label={`${label}: ${display}`}>
          <TextMorph
            ease={{ stiffness: 420, damping: 30 }}
            scale={false}
            respectReducedMotion
          >
            {display}
          </TextMorph>
        </div>
        <button
          className={`copy-button${copied ? " copied" : ""}`}
          type="button"
          onClick={copyResult}
          aria-label={`${copied ? "Copied" : "Copy"} ${label.toLowerCase()}`}
          title={(copied ? "Copied: " : "Copy: ") + copy}
        >
          <span className="icon-swap">
            <Copy size={15} className="copy-icon" aria-hidden="true" />
            <Check size={15} className="check-icon" aria-hidden="true" />
          </span>
          <span className="copy-label" aria-hidden="true">
            <TextMorph
              ease={{ stiffness: 560, damping: 28 }}
              scale={false}
              numbers={false}
              respectReducedMotion
            >
              {copied ? "Copied" : "Copy"}
            </TextMorph>
          </span>
        </button>
        <span className="sr-only" role="status">
          {copied ? `${label} copied to clipboard.` : ""}
        </span>
        {copyError && (
          <p className="copy-error" role="alert">
            Couldn't access the clipboard. Copy this text: <code>{copy}</code>
          </p>
        )}
      </dd>
    </div>
  );
}
