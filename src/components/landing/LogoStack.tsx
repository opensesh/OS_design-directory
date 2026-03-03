import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DURATION, EASING } from '@/lib/motion-tokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { resolveLogoBg } from '@/lib/favicon';
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

/** Solid fallback for resources without an explicit logoBg */
const DEFAULT_SOLID_BG = '#2A2A2A';

/**
 * 5-slot horizontal carousel positions.
 * Scale deduction is uniform: 1.0 → 0.84 → 0.70 (−0.16 per level).
 * x values are pixel offsets from the container center.
 */
const DESKTOP_SLOTS = [
  { x: -170, scale: 0.70, zIndex: 1, opacity: 0.45, shadow: '0 2px 6px rgba(0,0,0,0.15)' },  // far left
  { x:  -85, scale: 0.84, zIndex: 2, opacity: 0.70, shadow: '0 4px 12px rgba(0,0,0,0.25)' }, // near left
  { x:    0, scale: 1.00, zIndex: 3, opacity: 1.00, shadow: '0 8px 24px rgba(0,0,0,0.4)'  }, // center
  { x:  +85, scale: 0.84, zIndex: 2, opacity: 0.70, shadow: '0 4px 12px rgba(0,0,0,0.25)' }, // near right
  { x: +170, scale: 0.70, zIndex: 1, opacity: 0.45, shadow: '0 2px 6px rgba(0,0,0,0.15)' },  // far right
] as const;

const MOBILE_SLOTS = [
  { x: -108, scale: 0.70, zIndex: 1, opacity: 0.45, shadow: '0 2px 6px rgba(0,0,0,0.15)' },
  { x:  -54, scale: 0.84, zIndex: 2, opacity: 0.70, shadow: '0 4px 12px rgba(0,0,0,0.25)' },
  { x:    0, scale: 1.00, zIndex: 3, opacity: 1.00, shadow: '0 8px 24px rgba(0,0,0,0.4)'  },
  { x:  +54, scale: 0.84, zIndex: 2, opacity: 0.70, shadow: '0 4px 12px rgba(0,0,0,0.25)' },
  { x: +108, scale: 0.70, zIndex: 1, opacity: 0.45, shadow: '0 2px 6px rgba(0,0,0,0.15)' },
] as const;

/** Detects whether the viewport is below the md breakpoint (768px) */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

/**
 * LogoStack
 *
 * Five resource logos arranged in a horizontal 3D carousel.
 * The center card is full size; flanking cards scale down uniformly (0.84 → 0.70).
 * Auto-cycles every 2.5 s; supports drag-to-scroll. Every card is individually
 * clickable and navigates to that resource's detail page.
 */
export function LogoStack({ resources, interval = 2500 }: LogoStackProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const len = resources.length;

  const SLOTS = isMobile ? MOBILE_SLOTS : DESKTOP_SLOTS;

  // Preload custom SVGs
  useEffect(() => {
    Object.values(CUSTOM_LOGOS).forEach(({ src }) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const advance = useCallback(() => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % len);
  }, [len]);

  const retreat = useCallback(() => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + len) % len);
  }, [len]);

  // Auto-cycle (always forward)
  useEffect(() => {
    if (len <= 1 || prefersReducedMotion) return;
    const timer = setInterval(advance, interval);
    return () => clearInterval(timer);
  }, [len, interval, advance, prefersReducedMotion]);

  if (!resources.length) return null;

  // 5 visible resources: far-left → near-left → center → near-right → far-right
  const visible = [-2, -1, 0, 1, 2].map((offset) => (index + offset + len) % len);
  const centerResource = resources[visible[2]];

  const containerW = isMobile ? '300px' : '420px';
  const containerH = isMobile ? '56px' : '80px';

  return (
    <motion.div
      className="relative overflow-visible cursor-grab active:cursor-grabbing"
      style={{ width: containerW, maxWidth: '95vw', height: containerH }}
      onPanEnd={(_, info) => {
        if (info.offset.x < -40) advance();
        else if (info.offset.x > 40) retreat();
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') advance();
        else if (e.key === 'ArrowLeft') retreat();
        else if (e.key === 'Enter' && centerResource) navigate(`/resource/${centerResource.id}`);
      }}
      tabIndex={0}
      role="region"
      aria-label="Resource carousel"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {visible.map((resIdx, slotIdx) => {
          const cfg = SLOTS[slotIdx];
          const resource = resources[resIdx];
          const custom = CUSTOM_LOGOS[resource.name];

          const solidBg = !custom
            ? resolveLogoBg(resource.logoBg) ?? DEFAULT_SOLID_BG
            : undefined;

          const cardClass = isMobile
            ? 'w-14 h-14'
            : 'w-20 h-20';

          return (
            <motion.div
              key={`${resIdx}-${resource.name}`}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{
                x: direction > 0 ? 260 : -260,
                scale: 0.55,
                opacity: 0,
                zIndex: cfg.zIndex,
              }}
              animate={{
                x: cfg.x,
                scale: cfg.scale,
                opacity: cfg.opacity,
                zIndex: cfg.zIndex,
              }}
              exit={{
                x: direction > 0 ? -260 : 260,
                scale: 0.55,
                opacity: 0,
                zIndex: cfg.zIndex,
              }}
              transition={{
                duration: prefersReducedMotion ? DURATION.fast : DURATION.slower,
                ease: EASING.smooth,
              }}
              style={{ boxShadow: cfg.shadow }}
            >
              {custom ? (
                <div
                  className={`${cardClass} rounded-2xl flex items-center justify-center overflow-hidden border border-[var(--border-secondary)] pointer-events-auto cursor-pointer`}
                  style={{ backgroundColor: custom.bg }}
                  onClick={() => navigate(`/resource/${resource.id}`)}
                  title={resource.name}
                >
                  <img
                    src={custom.src}
                    alt={resource.name}
                    className="w-3/5 h-3/5 object-contain"
                  />
                </div>
              ) : (
                <div
                  className={`${cardClass} rounded-2xl overflow-hidden border border-[var(--border-secondary)] pointer-events-auto cursor-pointer`}
                  style={{ backgroundColor: solidBg }}
                  onClick={() => navigate(`/resource/${resource.id}`)}
                  title={resource.name}
                >
                  <ResourceLogo
                    resource={resource}
                    size="lg"
                    faviconSize="md"
                    bordered={false}
                    className="rounded-2xl !w-full !h-full"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
