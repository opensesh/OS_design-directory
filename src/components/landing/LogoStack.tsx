import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DURATION, EASING } from '@/lib/motion-tokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ResourceLogo } from '@/components/ui/ResourceLogo';
import type { NormalizedResource } from '@/types/resource';

interface LogoStackProps {
  resources: NormalizedResource[];
  /** Cycle interval in ms */
  interval?: number;
}

/** Custom SVG logo overrides: path + container background */
const CUSTOM_LOGOS: Record<string, { src: string; bg: string }> = {
  Claude: { src: '/logos/claude.svg', bg: '#D77655' },
  Figma: { src: '/logos/figma.svg', bg: '#FFFAEE' },
  GitHub: { src: '/logos/github.svg', bg: '#191919' },
  Midjourney: { src: '/logos/midjourney.svg', bg: '#FFFAEE' },
  'React Bits': { src: '/logos/react-bits.svg', bg: '#191919' },
};

/** Position config for each slot in the 3-card stack */
const SLOTS = [
  { scale: 1, y: 0, zIndex: 3, opacity: 1, shadow: '0 8px 24px rgba(0,0,0,0.4)' },
  { scale: 0.88, y: -14, zIndex: 2, opacity: 0.65, shadow: '0 4px 12px rgba(0,0,0,0.25)' },
  { scale: 0.76, y: -24, zIndex: 1, opacity: 0.35, shadow: '0 2px 6px rgba(0,0,0,0.15)' },
] as const;

/**
 * LogoStack
 *
 * Three resource logos arranged in a forward-facing vertical stack.
 * The front card cycles out (slides down + fades), the stack shifts
 * forward, and a new card enters from behind — infinite carousel.
 *
 * Only shows resources rated 9+, cycling from highest to lowest score,
 * then looping back. Hover shows a tooltip; click navigates to the
 * resource detail page.
 */
export function LogoStack({ resources, interval = 2500 }: LogoStackProps) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const len = resources.length;

  // Preload custom SVGs
  useEffect(() => {
    Object.values(CUSTOM_LOGOS).forEach(({ src }) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Auto-cycle (pauses on hover)
  const advance = useCallback(() => {
    setIndex((prev) => (prev + 1) % len);
  }, [len]);

  useEffect(() => {
    if (len <= 1 || prefersReducedMotion || hovered) return;
    const timer = setInterval(advance, interval);
    return () => clearInterval(timer);
  }, [len, interval, advance, prefersReducedMotion, hovered]);

  if (!resources.length) return null;

  // The 3 visible resource indices (front → back)
  const visible = [0, 1, 2].map((offset) => (index + offset) % len);
  const frontResource = resources[visible[0]];

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip — appears above the stack on hover */}
      <AnimatePresence>
        {hovered && frontResource && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap pointer-events-none"
          >
            <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-secondary)] shadow-lg">
              <span className="text-xs font-medium text-[var(--fg-primary)]">
                {frontResource.name}
              </span>
              {frontResource.category && (
                <span className="text-xs text-[var(--fg-tertiary)] ml-1.5">
                  · {frontResource.category}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logo cards */}
      <div
        className="relative w-16 h-16 md:w-20 md:h-20 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-live="polite"
        aria-label={`Featured resource: ${frontResource?.name ?? 'loading'}`}
        onClick={() => frontResource && navigate(`/resource/${frontResource.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && frontResource) navigate(`/resource/${frontResource.id}`);
        }}
      >
        <AnimatePresence initial={false}>
          {visible.map((resIdx, slot) => {
            const cfg = SLOTS[slot];
            const resource = resources[resIdx];
            const custom = CUSTOM_LOGOS[resource.name];

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
                {custom ? (
                  <div
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center overflow-hidden border border-[var(--border-secondary)]"
                    style={{ backgroundColor: custom.bg }}
                  >
                    <img
                      src={custom.src}
                      alt={resource.name}
                      className="w-3/5 h-3/5 object-contain"
                    />
                  </div>
                ) : (
                  <ResourceLogo
                    resource={resource}
                    size="lg"
                    faviconSize="md"
                    bordered
                    className="rounded-2xl !w-16 !h-16 md:!w-20 md:!h-20"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
