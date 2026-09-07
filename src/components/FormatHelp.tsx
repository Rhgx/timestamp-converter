import { useRef, useState } from "react";
import { ArrowRight, BookOpen, Check, Search, X } from "lucide-react";
import { TextMorph } from "torph/react";
import { exampleGroups } from "../data/examples";

export function FormatHelp({
  onChoose,
}: {
  onChoose: (example: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const groups = exampleGroups
    .map((group, index) => {
      const whole = group.title.toLowerCase().includes(query);
      return {
        ...group,
        step: index + 1,
        examples: whole
          ? group.examples
          : group.examples.filter((example) =>
              example.toLowerCase().includes(query),
            ),
        pitfalls: whole
          ? group.pitfalls
          : group.pitfalls.filter((pitfall) =>
              (pitfall.wrong + pitfall.right + pitfall.why)
                .toLowerCase()
                .includes(query),
            ),
      };
    })
    .filter((group) => group.examples.length || group.pitfalls.length);

  function choose(example: string) {
    dialog.current?.close();
    onChoose(example);
  }

  return (
    <>
      <button
        type="button"
        className="text-button with-icon"
        aria-haspopup="dialog"
        onClick={() => {
          setSearch("");
          dialog.current?.showModal();
          searchInput.current?.focus();
        }}
      >
        <BookOpen size={15} aria-hidden="true" /> Formats & examples
      </button>
      <dialog
        ref={dialog}
        className="format-dialog"
        aria-labelledby="format-title"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <header className="dialog-header">
          <h2 id="format-title">Formats & examples</h2>
          <button
            type="button"
            className="secondary-button icon-button"
            onClick={() => dialog.current?.close()}
            aria-label="Close format guide"
            title="Close format guide"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="dialog-body">
          <label className="sr-only" htmlFor="format-search">
            Search examples
          </label>
          <div className="search-field">
            <Search size={15} aria-hidden="true" />
            <input
              ref={searchInput}
              id="format-search"
              type="search"
              placeholder="Search examples..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="format-groups">
            {groups.map((group) => (
              <section key={group.title}>
                <h3>
                  <span className="step-number" aria-hidden="true">
                    {group.step}
                  </span>
                  {group.title}
                </h3>
                <p className="group-note">{group.note}</p>
                {group.examples.length > 0 && (
                  <>
                    <p className="plate-caption ok">
                      <Check size={13} aria-hidden="true" />
                      These work
                    </p>
                    <div className="example-grid">
                      {group.examples.map((example) => (
                        <button
                          type="button"
                          key={example}
                          onClick={() => choose(example)}
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {group.pitfalls.length > 0 && (
                  <>
                    <p className="plate-caption bad">
                      <X size={13} aria-hidden="true" />
                      These do not
                    </p>
                    <ul className="pitfalls">
                      {group.pitfalls.map((pitfall) => (
                        <li key={pitfall.wrong}>
                          <div className="pitfall-pair">
                            <span className="pitfall-wrong">
                              {pitfall.wrong}
                            </span>
                            <ArrowRight
                              className="pitfall-arrow"
                              size={14}
                              aria-hidden="true"
                            />
                            <button
                              type="button"
                              className="pitfall-right"
                              onClick={() => choose(pitfall.right)}
                              title={"Use this instead: " + pitfall.right}
                            >
                              {pitfall.right}
                            </button>
                          </div>
                          <p className="pitfall-why">{pitfall.why}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            ))}
            {!groups.length && (
              <p className="no-matches" role="status">
                No matching examples. Try “tomorrow”, “UTC”, or “Unix”.
              </p>
            )}
          </div>
        </div>
        <footer className="dialog-footer">
          <span>
            <kbd>Esc</kbd> to close
          </span>
          <span>
            <TextMorph
              ease={{ stiffness: 520, damping: 28 }}
              scale={false}
              respectReducedMotion
            >
              {groups.reduce((total, group) => total + group.examples.length, 0)}
            </TextMorph>{" "}
            examples
          </span>
        </footer>
      </dialog>
    </>
  );
}
