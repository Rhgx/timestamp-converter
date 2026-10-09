import { useEffect } from "react";
import { RepeatButton } from "./RepeatButton";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";

const rowHeight = 32;

export function TimeWheel({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const reduced = useReducedMotion();
  const y = useMotionValue(-value * rowHeight);
  const clamp = (n: number) => Math.max(0, Math.min(max, n));

  useEffect(() => {
    const animation = animate(
      y,
      -value * rowHeight,
      reduced
        ? { duration: 0 }
        : { type: "spring", stiffness: 400, damping: 32 },
    );
    return () => animation.stop();
  }, [value, reduced, y]);

  function settle(velocity: number) {
    const target = clamp(Math.round(-(y.get() + velocity * 0.12) / rowHeight));
    onChange(target);
    // Also snap back when the final selection has not changed.
    animate(
      y,
      -target * rowHeight,
      reduced
        ? { duration: 0 }
        : { type: "spring", stiffness: 400, damping: 32 },
    );
  }

  return (
    <div className="time-wheel">
      <span className="time-wheel-label">{label}</span>
      <RepeatButton
        type="button"
        className="icon-button spring-icon"
        aria-label={`Increase ${label.toLowerCase()}`}
        disabled={value === max}
        onStep={() => onChange(clamp(value + 1))}
      >
        <ChevronUp size={16} aria-hidden="true" />
      </RepeatButton>
      <div
        className="time-wheel-viewport"
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        onKeyDown={(event) => {
          const delta = { ArrowUp: 1, ArrowDown: -1, PageUp: 5, PageDown: -5 }[
            event.key
          ];
          if (delta !== undefined) {
            event.preventDefault();
            onChange(clamp(value + delta));
          }
          if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            onChange(event.key === "Home" ? 0 : max);
          }
        }}
      >
        <div className="time-wheel-highlight" aria-hidden="true" />
        <motion.div
          className="time-wheel-track"
          style={{ y }}
          drag="y"
          dragConstraints={{ top: -max * rowHeight, bottom: 0 }}
          dragElastic={0.12}
          dragMomentum={false}
          onDragStart={() => y.stop()}
          onDragEnd={(_, info) => settle(reduced ? 0 : info.velocity.y)}
        >
          {Array.from({ length: max + 1 }, (_, number) => (
            <div
              key={number}
              className="time-wheel-number"
              aria-hidden="true"
              onClick={() => {
                if (Math.abs(y.get() + value * rowHeight) < 2) onChange(number);
              }}
            >
              {String(number).padStart(2, "0")}
            </div>
          ))}
        </motion.div>
      </div>
      <RepeatButton
        type="button"
        className="icon-button spring-icon"
        aria-label={`Decrease ${label.toLowerCase()}`}
        disabled={value === 0}
        onStep={() => onChange(clamp(value - 1))}
      >
        <ChevronDown size={16} aria-hidden="true" />
      </RepeatButton>
    </div>
  );
}
