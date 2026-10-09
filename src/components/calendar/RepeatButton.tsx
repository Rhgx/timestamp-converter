import { useEffect, useLayoutEffect, useRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cubicBezier } from "motion/react";

const accelerate = cubicBezier(0.42, 0, 0.58, 1);

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  // Zero is a single activation; held repeats accelerate from 1x to 2x.
  onStep: (repeatSpeed: number) => void | Promise<void>;
  repeatInterval?: number;
  repeatDelay?: number;
};

export function RepeatButton({
  onStep,
  disabled,
  repeatInterval = 80,
  repeatDelay = 350,
  ...props
}: Props) {
  const latest = useRef(onStep);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const active = useRef(false);
  const sequence = useRef(0);
  const repeated = useRef(false);
  useLayoutEffect(() => {
    latest.current = onStep;
  });

  function stop() {
    ++sequence.current;
    active.current = false;
    clearTimeout(timer.current);
  }
  useEffect(() => {
    if (disabled) stop();
  }, [disabled]);
  useEffect(() => stop, []);

  function start() {
    stop();
    active.current = true;
    repeated.current = false;
    const current = sequence.current;
    const started = performance.now();
    async function tick() {
      if (!active.current || current !== sequence.current) return;
      repeated.current = true;
      const speed =
        1 +
        accelerate(
          Math.min(
            1,
            Math.max(0, performance.now() - started - repeatDelay) / 2500,
          ),
        );
      await latest.current(speed);
      if (active.current && current === sequence.current)
        timer.current = setTimeout(() => void tick(), repeatInterval / speed);
    }
    timer.current = setTimeout(() => void tick(), repeatDelay);
  }

  return (
    <button
      {...props}
      disabled={disabled}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        start();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onBlur={stop}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (!event.repeat) {
          void latest.current(0);
          start();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          stop();
        }
      }}
      onClick={() => {
        if (!repeated.current) void latest.current(0);
        repeated.current = false;
      }}
    />
  );
}
