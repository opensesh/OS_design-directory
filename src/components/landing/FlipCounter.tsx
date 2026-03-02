import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { SPRING } from '@/lib/motion-tokens';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Floor-divide value by place to get the rolling digit target. */
function getValueRoundedToPlace(value: number, place: number): number {
  return Math.floor(value / place);
}

/** Derive the places array from a number: 155 → [100, 10, 1]. */
function getPlaces(value: number): number[] {
  const digits = Math.max(String(Math.abs(value)).length, 1);
  return Array.from({ length: digits }, (_, i) => Math.pow(10, digits - 1 - i));
}

// ---------------------------------------------------------------------------
// DigitNumber — one of the ten 0-9 spans inside a digit column
// ---------------------------------------------------------------------------

interface DigitNumberProps {
  mv: MotionValue<number>;
  number: number;
  height: number;
}

function DigitNumber({ mv, number, height }: DigitNumberProps) {
  const y = useTransform(mv, (latest: number) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;
    let memo = offset * height;
    if (offset > 5) memo -= 10 * height;
    return memo;
  });

  return (
    <motion.span
      className="absolute inset-0 flex items-center justify-center font-accent font-bold text-brand-aperol"
      style={{ y }}
    >
      {number}
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// FlipDigit — a single scrolling digit column
// ---------------------------------------------------------------------------

interface FlipDigitProps {
  place: number;
  value: number;
  height: number;
  delay: number;
  reduceMotion: boolean;
}

function FlipDigit({ place, value, height, delay, reduceMotion }: FlipDigitProps) {
  const target = getValueRoundedToPlace(value, place);
  const animatedValue = useSpring(reduceMotion ? target : 0, SPRING.gentle);

  useEffect(() => {
    if (reduceMotion) {
      animatedValue.set(target);
      return;
    }
    const timeout = setTimeout(() => {
      animatedValue.set(target);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [animatedValue, target, delay, reduceMotion]);

  return (
    <span
      className="relative block overflow-hidden tabular-nums"
      style={{ height, width: '100%' }}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <DigitNumber key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// FlipCounter — the exported wrapper
// ---------------------------------------------------------------------------

interface FlipCounterProps {
  /** The number to display (e.g. 155). */
  value: number;
  /** Seconds to wait before the digit springs start (syncs with stagger entrance). */
  delay?: number;
  /** Skip animation entirely (reduced-motion). */
  reduceMotion?: boolean;
}

export function FlipCounter({ value, delay = 0, reduceMotion = false }: FlipCounterProps) {
  const places = useMemo(() => getPlaces(value), [value]);

  // Measure the actual rendered height of a digit container so the spring
  // maths are pixel-perfect at every viewport width (container uses clamp).
  const measureRef = useRef<HTMLDivElement>(null);
  const [digitHeight, setDigitHeight] = useState(48);

  useLayoutEffect(() => {
    if (measureRef.current) {
      setDigitHeight(measureRef.current.clientHeight);
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Label */}
      <span className="text-xs uppercase tracking-wider text-[var(--fg-tertiary)]">
        Total resources
      </span>

      {/* Digit containers */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {places.map((place, idx) => (
          <div
            key={place}
            ref={idx === 0 ? measureRef : undefined}
            className="relative flex items-center justify-center rounded-md bg-[var(--bg-secondary)]/30 border border-[var(--border-secondary)] overflow-hidden"
            style={{
              height: 'clamp(40px, 6vw, 52px)',
              width: 'clamp(30px, 5vw, 38px)',
              fontSize: 'clamp(24px, 4.5vw, 34px)',
            }}
          >
            {/* Top gradient (flip-clock shadow) */}
            <div
              className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
              style={{
                height: '28%',
                background: 'linear-gradient(to bottom, var(--bg-primary), transparent)',
                opacity: 0.5,
              }}
            />

            {/* Digit column */}
            <FlipDigit
              place={place}
              value={value}
              height={digitHeight}
              delay={delay}
              reduceMotion={reduceMotion}
            />

            {/* Bottom gradient */}
            <div
              className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
              style={{
                height: '28%',
                background: 'linear-gradient(to top, var(--bg-primary), transparent)',
                opacity: 0.5,
              }}
            />

            {/* Center crease line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-px h-px bg-[var(--border-secondary)]/40 z-20 pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
