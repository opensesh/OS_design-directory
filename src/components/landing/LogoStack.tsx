import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

/** Classify a resource's effective background as dark, light, or color. */
function classifyBg(resource: NormalizedResource): 'dark' | 'light' | 'color' {
  const custom = CUSTOM_LOGOS[resource.name];
  const bg = custom
    ? custom.bg
    : (resolveLogoBg(resource.logoBg) ?? DEFAULT_SOLID_BG);

  const normalized = bg.toLowerCase();

  const lightSet = new Set(['#f5f3f0', '#fffaee', '#ffffff', '#f5f5f5', '#fafafa']);
  if (lightSet.has(normalized)) return 'light';

  const darkSet = new Set(['#191919', '#1c1c1c', '#2a2a2a', '#323232', '#0d0d0d', '#000000']);
  if (darkSet.has(normalized)) return 'dark';

  return 'color';
}

/**
 * Reorder resources so backgrounds cycle color → light → dark.
 * Gravity-score ordering is preserved within each category bucket.
 */
function interleaveByCategory(sorted: NormalizedResource[]): NormalizedResource[] {
  const buckets: Record<'color' | 'light' | 'dark', NormalizedResource[]> = {
    color: [], light: [], dark: [],
  };
  for (const r of sorted) buckets[classifyBg(r)].push(r);

  const result: NormalizedResource[] = [];
  const maxLen = Math.max(buckets.color.length, buckets.light.length, buckets.dark.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < buckets.color.length) result.push(buckets.color[i]);
    if (i < buckets.light.length) result.push(buckets.light[i]);
    if (i < buckets.dark.length)  result.push(buckets.dark[i]);
  }
  return result;
}

/**
 * LogoStack
 *
 * Five resource logos arranged in a horizontal 3D carousel.
 * The center card is full size; flanking cards scale down uniformly (0.84 → 0.70).
 * Auto-cycles every 2.5 s; supports drag-to-scroll. Every card is individually
 * clickable and navigates to that resource's detail page.
 *
 * Resources are interleaved by background category (color → light → dark) so
 * the carousel never shows long runs of same-tone cards.
 */
export function LogoStack({ resources, interval = 2500 }: LogoStackProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Reorder for visual variety before anything else
  const diversified = useMemo(() => interleaveByCategory(resources), [resources]);
  const len = diversified.length;

  const SLOTS = isMobile ? MOBILE_SLOTS : DESKTOP_SLOTS;
  const cardSize = isMobile ? 56 : 80;

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

  // Wheel scroll (desktop trackpad / mouse wheel) with 600 ms cooldown
  const lastWheelTime = useRef(0);
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastWheelTime.current < 600) return;
    // Prefer horizontal delta (trackpad swipe); fall back to vertical (scroll wheel)
    const delta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta > 5) { lastWheelTime.current = now; advance(); }
    else if (delta < -5) { lastWheelTime.current = now; retreat(); }
  }, [advance, retreat]);

  // Auto-cycle (always forward)
  useEffect(() => {
    if (len <= 1 || prefersReducedMotion) return;
    const timer = setInterval(advance, interval);
    return () => clearInterval(timer);
  }, [len, interval, advance, prefersReducedMotion]);

  if (!diversified.length) return null;

  // 5 visible resources: far-left → near-left → center → near-right → far-right
  const visible = [-2, -1, 0, 1, 2].map((offset) => (index + offset + len) % len);
  const centerResource = diversified[visible[2]];

  const containerW = isMobile ? '300px' : '420px';
  const containerH = `${cardSize}px`;
  const half = cardSize / 2;

  return (
    <motion.div
      className="relative overflow-visible"
      style={{ width: containerW, maxWidth: '95vw', height: containerH, touchAction: 'none' }}
      onWheel={handleWheel}
      onPanEnd={(_, info) => {
        if (info.offset.x < -30) advance();
        else if (info.offset.x > 30) retreat();
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
          const resource = diversified[resIdx];
          const custom = CUSTOM_LOGOS[resource.name];
          const solidBg = !custom
            ? resolveLogoBg(resource.logoBg) ?? DEFAULT_SOLID_BG
            : undefined;

          return (
            <motion.div
              key={`${resIdx}-${resource.name}`}
              className="absolute rounded-2xl overflow-hidden border border-[var(--border-secondary)] cursor-pointer"
              style={{
                top: '50%',
                left: '50%',
                marginTop: `-${half}px`,
                marginLeft: `-${half}px`,
                width: `${cardSize}px`,
                height: `${cardSize}px`,
                backgroundColor: custom ? custom.bg : solidBg,
                boxShadow: cfg.shadow,
              }}
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
              onClick={() => navigate(`/resource/${resource.id}`)}
              title={resource.name}
            >
              {custom ? (
                <img
                  src={custom.src}
                  alt={resource.name}
                  className="w-3/5 h-3/5 object-contain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                />
              ) : (
                <ResourceLogo
                  resource={resource}
                  size="lg"
                  faviconSize="md"
                  bordered={false}
                  className="rounded-2xl !w-full !h-full"
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
