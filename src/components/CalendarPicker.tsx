import { useRef, useState } from "react";
import { CalendarDays, Clock3, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { MonthCarousel } from "./MonthCarousel";
import { TimeWheel } from "./TimeWheel";

export function CalendarPicker({
  value,
  onApply,
}: {
  value: Date | null;
  onApply: (value: string) => void;
}) {
  const reduced = useReducedMotion();
  const backdropPress = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const [calendarVersion, setCalendarVersion] = useState(0);

  function close() {
    dialog.current?.close();
  }

  function apply() {
    if (!draft) return;
    // Preserve local wall time for the existing parser and its DST validation.
    const pad = (n: number) => String(n).padStart(2, "0");
    const input = `${draft.getFullYear()}-${pad(draft.getMonth() + 1)}-${pad(draft.getDate())}T${pad(draft.getHours())}:${pad(draft.getMinutes())}`;
    close();
    onApply(input);
  }

  return (
    <>
      <button
        className="secondary-button icon-button spring-icon"
        type="button"
        aria-label="Choose date and time from a calendar"
        title="Choose from calendar"
        aria-haspopup="dialog"
        onClick={() => {
          setDraft(new Date(value ?? Date.now()));
          setOpen(true);
          dialog.current?.showModal();
        }}
      >
        <CalendarDays size={18} aria-hidden="true" />
      </button>
      <dialog
        ref={dialog}
        className="calendar-dialog"
        aria-labelledby="calendar-title"
        onClose={() => setOpen(false)}
        onPointerDown={(event) => {
          backdropPress.current = event.target === dialog.current;
        }}
        onPointerCancel={() => {
          backdropPress.current = false;
        }}
        onClick={(event) => {
          if (backdropPress.current && event.target === dialog.current) close();
          backdropPress.current = false;
        }}
      >
        <motion.div
          className="calendar-body"
          initial={false}
          animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.96 }}
          transition={
            reduced
              ? { duration: 0 }
              : { type: "spring", stiffness: 420, damping: 26 }
          }
        >
          <header className="calendar-title-row">
            <h2 id="calendar-title">Choose date & time</h2>
            <button
              className="secondary-button icon-button spring-icon"
              type="button"
              onClick={close}
              aria-label="Close calendar"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>
          <div className="calendar-layout">
            {open && draft && (
              <MonthCarousel
                key={calendarVersion}
                selected={draft}
                onChange={setDraft}
              />
            )}
            {draft && (
              <aside className="calendar-time" aria-label="Choose time">
                <TimeWheel
                  label="Hour"
                  value={draft.getHours()}
                  max={23}
                  onChange={(hour) => {
                    const date = new Date(draft);
                    date.setHours(hour, draft.getMinutes(), 0, 0);
                    setDraft(date);
                  }}
                />
                <span className="time-separator" aria-hidden="true">
                  :
                </span>
                <TimeWheel
                  label="Minute"
                  value={draft.getMinutes()}
                  max={59}
                  onChange={(minute) => {
                    const date = new Date(draft);
                    date.setMinutes(minute, 0, 0);
                    setDraft(date);
                  }}
                />
              </aside>
            )}
          </div>
          <footer className="calendar-actions">
            <button
              className="calendar-now"
              type="button"
              title="Reset to current date and time"
              onClick={() => {
                setDraft(new Date());
                setCalendarVersion((version) => version + 1);
              }}
            >
              <Clock3 size={16} aria-hidden="true" />
              Now
            </button>
            <motion.button
              whileTap={reduced ? undefined : { scale: 0.94 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              className="convert-button"
              type="button"
              disabled={!draft}
              onClick={apply}
            >
              Apply
            </motion.button>
          </footer>
        </motion.div>
      </dialog>
    </>
  );
}
