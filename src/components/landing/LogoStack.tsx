import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DURATION, EASING } from '@/lib/motion-tokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getFaviconUrl } from '@/lib/favicon';
import { ResourceLogo } from '@/components/ui/ResourceLogo';
import type { NormalizedResource } from '@/types/resource';

interface LogoStackProps {
  resources: NormalizedResource[];
  /** Cycle interval in ms */
  interval?: number;
}

/** Position config for each slot in the 3-card stack */
const SLOTS = [
  { scale: 1, y: 0, zIndex: 3, opacity: 1, shadow: '0 8px 24px rgba(0,0,0,0.4)' },
  { scale: 0.88, y: -14, zIndex: 2, opacity: 0.65, shadow: '0 4px 12px rgba(0,0,0,0.25)' },
  { scale: 0.76, y: -24, zIndex: 1, opacity: 0.35, shadow: '0 2px 6px rgba(0,0,0,0.15)' },
] as const;

/**
 * LogoStack
 *
 * Three resource favicons arranged in a forward-facing vertical stack.
 * The front card cycles out (slides down + fades), the stack shifts
 * forward, and a new card enters from behind — infinite carousel.
 */
export function LogoStack({ resources, interval = 2500 }: LogoStackProps) {
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const len = resources.length;

  // Preload favicons
  useEffect(() => {
    resources.forEach((r) => {
      const url = getFaviconUrl(r.url, 'md');
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [resources]);

  // Auto-cycle
  const advance = useCallback(() => {
    setIndex((prev) => (prev + 1) % len);
  }, [len]);

  useEffect(() => {
    if (len <= 1 || prefersReducedMotion) return;
    const timer = setInterval(advance, interval);
    return () => clearInterval(timer);
  }, [len, interval, advance, prefersReducedMotion]);

  if (!resources.length) return null;

  // The 3 visible resource indices (front → back)
  const visible = [0, 1, 2].map((offset) => (index + offset) % len);

  return (
    <div
      className="relative w-16 h-16 md:w-20 md:h-20"
      aria-live="polite"
      aria-label="Featured design resources"
    >
      <AnimatePresence initial={false}>
        {visible.map((resIdx, slot) => {
          const cfg = SLOTS[slot];
          const resource = resources[resIdx];

          return (
            <motion.div
              key={`${resIdx}-${resource.name}`}
              className="absolute inset-0 flex items-center justify-center"
              initial={
                slot === 2
                  ? { scale: 0.68, y: -32, opacity: 0, zIndex: cfg.zIndex }
                  : false
              }
              animate={{
                scale: cfg.scale,
                y: cfg.y,
                opacity: cfg.opacity,
                zIndex: cfg.zIndex,
              }}
              exit={{
                scale: 0.92,
                y: 40,
                opacity: 0,
                zIndex: 4,
              }}
              transition={{
                duration: prefersReducedMotion ? DURATION.fast : DURATION.slower,
                ease: EASING.smooth,
              }}
              style={{ boxShadow: cfg.shadow }}
            >
              <ResourceLogo
                resource={resource}
                size="lg"
                faviconSize="md"
                bordered
                className="rounded-2xl !w-16 !h-16 md:!w-20 md:!h-20 shadow-lg"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
