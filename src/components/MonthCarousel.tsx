import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { PointerEvent } from "react";
import { flushSync } from "react-dom";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RepeatButton } from "./RepeatButton";

const DatePicker = lazy(() => import("react-datepicker"));
const minDate = new Date(1900, 0, 1);
const maxDate = new Date(3000, 11, 31);
const firstMonth = 1900 * 12;
const lastMonth = 3000 * 12 + 11;
const clampMonth = (month: number) =>
  Math.max(firstMonth, Math.min(lastMonth, month));
const monthDate = (month: number) =>
  new Date(Math.floor(month / 12), month % 12, 1);
const monthLabel = (month: number) =>
  monthDate(month).toLocaleDateString("en", { month: "long", year: "numeric" });

// Heading changes must not rerender three date pickers while the pointer moves.
const MonthPage = memo(function MonthPage({
  month,
  selected,
  onChange,
  onMonthChange,
}: {
  month: number;
  selected: Date;
  onChange: (date: Date | null) => void;
  onMonthChange: (date: Date) => void;
}) {
  return (
    <DatePicker
      inline
      fixedHeight
      openToDate={monthDate(month)}
      selected={
        selected.getFullYear() * 12 + selected.getMonth() === month
          ? selected
          : null
      }
      onChange={onChange}
      minDate={minDate}
      maxDate={maxDate}
      calendarStartDay={1}
      shouldCloseOnSelect={false}
      renderCustomHeader={() => <></>}
      onMonthChange={onMonthChange}
    />
  );
});

type Drag = {
  pointerId: number;
  startX: number;
  origin: number;
  width: number;
  lastX: number;
  lastTime: number;
  velocity: number;
};

export function MonthCarousel({
  selected,
  onChange,
}: {
  selected: Date;
  onChange: (date: Date | null) => void;
}) {
  const [center, setCenter] = useState(
    () => selected.getFullYear() * 12 + selected.getMonth(),
  );
  const centerRef = useRef(center);
  const [previewDirection, setPreviewDirection] = useState(0);
  const heading = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const dragged = useRef(false);
  const target = useRef(center);
  const nextButtonAt = useRef(0);
  const reduced = useReducedMotion();
  // A continuous position in month units, never reset when a gesture ends.
  const position = useMotionValue(center);

  useEffect(() => () => position.stop(), [position]);
  useMotionValueEvent(position, "change", (value) => {
    const nearest = clampMonth(Math.round(value));
    if (nearest !== centerRef.current) {
      centerRef.current = nearest;
      // Recycle offscreen pages and update the track in the same frame.
      flushSync(() => setCenter(nearest));
    }
    const offset = value - nearest;
    viewport.current?.style.setProperty("--month-offset", String(-offset));
    const direction = Math.abs(offset) < 0.0001 ? 0 : Math.sign(offset);
    setPreviewDirection(direction);
    heading.current?.style.setProperty(
      "--month-direction",
      String(direction || 1),
    );
    heading.current?.style.setProperty(
      "--month-progress",
      String(Math.min(1, Math.abs(offset))),
    );
  });

  function settle(destination: number, velocity = 0, repeatSpeed = 0) {
    const incomingVelocity = repeatSpeed ? position.getVelocity() : velocity;
    position.stop();
    target.current = clampMonth(destination);
    return animate(
      position,
      target.current,
      reduced
        ? { duration: 0 }
        : {
            type: "spring",
            stiffness: 500,
            damping: 46,
            velocity: incomingVelocity,
            restDelta: 0.001,
            restSpeed: 0.01,
          },
    );
  }

  function stepMonth(direction: number, repeatSpeed: number) {
    const now = performance.now();
    // Ignore extra clicks, without queuing them or extending the cooldown.
    if (!repeatSpeed && now < nextButtonAt.current) return;
    nextButtonAt.current = now + 220;
    void settle(target.current + direction, 0, repeatSpeed);
  }

  const selectDate = useCallback(
    (date: Date | null) => {
      if (!date) return;
      const next = new Date(date);
      next.setHours(
        selected.getHours(),
        selected.getMinutes(),
        selected.getSeconds(),
        selected.getMilliseconds(),
      );
      onChange(next);
    },
    [selected, onChange],
  );

  const keyboardMonth = useCallback(
    (date: Date) => {
      if (drag.current || position.isAnimating()) return;
      target.current = date.getFullYear() * 12 + date.getMonth();
      position.set(target.current);
    },
    [position],
  );

  function beginDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !event.isPrimary || drag.current) return;
    position.stop();
    dragged.current = false;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      origin: position.get(),
      width: event.currentTarget.clientWidth,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
    };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const distance = event.clientX - current.startX;
    if (!dragged.current && Math.abs(distance) > 3) {
      dragged.current = true;
      // Capture only a drag, so ordinary day clicks retain their original target.
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const elapsed = event.timeStamp - current.lastTime;
    if (elapsed > 0)
      current.velocity =
        -(event.clientX - current.lastX) / current.width / (elapsed / 1000);
    current.lastX = event.clientX;
    current.lastTime = event.timeStamp;
    const startMonth = Math.round(current.origin);
    const next = Math.max(
      startMonth - 1,
      Math.min(startMonth + 1, current.origin - distance / current.width),
    );
    const bounded = clampMonth(next);
    position.set(bounded + (next - bounded) * 0.15);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    const travel = (current.startX - current.lastX) / current.width;
    const distance = Math.abs(travel);
    const velocity =
      cancelled || event.timeStamp - current.lastTime > 100
        ? 0
        : Math.max(-1.5, Math.min(1.5, current.velocity));
    const deliberateFlick =
      distance >= 0.18 &&
      Math.abs(velocity) >= 1.1 &&
      Math.sign(velocity) === Math.sign(travel);
    const committed = !cancelled && (distance >= 0.38 || deliberateFlick);
    const destination = cancelled
      ? Math.round(position.get())
      : Math.round(current.origin) + (committed ? Math.sign(travel) : 0);
    const towardDestination =
      Math.sign(destination - position.get()) === Math.sign(velocity);
    void settle(destination, towardDestination ? velocity : 0);
  }

  return (
    <div className="calendar-month-shell">
      <div className="calendar-navigation">
        <RepeatButton
          type="button"
          className="secondary-button icon-button spring-icon"
          aria-label="Previous month"
          disabled={center <= firstMonth}
          repeatInterval={440}
          repeatDelay={500}
          onStep={(speed) => {
            stepMonth(-1, speed);
          }}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </RepeatButton>
        <div
          className="calendar-month-heading"
          ref={heading}
          aria-label={monthLabel(center)}
        >
          <span className="month-label-current" aria-hidden="true">
            {monthLabel(center)}
          </span>
          <span className="month-label-preview" aria-hidden="true">
            {monthLabel(center + previewDirection)}
          </span>
        </div>
        <RepeatButton
          type="button"
          className="secondary-button icon-button spring-icon"
          aria-label="Next month"
          disabled={center >= lastMonth}
          repeatInterval={440}
          repeatDelay={500}
          onStep={(speed) => {
            stepMonth(1, speed);
          }}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </RepeatButton>
      </div>
      <div className="calendar-weekdays" aria-hidden="true">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div
        className="calendar-month-viewport"
        ref={viewport}
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={(event) => endDrag(event)}
        onPointerCancel={(event) => endDrag(event, true)}
        onPointerLeave={(event) => {
          if (!dragged.current) endDrag(event, true);
        }}
        onLostPointerCapture={(event) => {
          // Touch implicitly captures the day cell first. Its bubbled release
          // must not cancel the drag when capture moves to this viewport.
          if (event.target === event.currentTarget) endDrag(event, true);
        }}
        onClickCapture={(event) => {
          if (dragged.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        <div className="calendar-month-track">
          <Suspense
            fallback={
              <div className="calendar-loading" role="status">
                Loading calendar…
              </div>
            }
          >
            {[-1, 0, 1].map((offset) => (
              <div
                className="calendar-month-page"
                key={center + offset}
                aria-hidden={offset !== 0 || undefined}
                inert={offset !== 0}
              >
                <MonthPage
                  month={center + offset}
                  selected={selected}
                  onChange={selectDate}
                  onMonthChange={keyboardMonth}
                />
              </div>
            ))}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
