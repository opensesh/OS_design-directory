import type { NormalizedResource } from '@/types/resource';

/* ─── Types ─── */

export interface OrbitRingConfig {
  /** Radius in px at base (1.0) scale */
  radius: number;
  /** Angular speed in rad/s (positive = CW) */
  speed: number;
  /** Number of icons on this ring */
  count: number;
  /** Glow color for ring stroke & icon border */
  glowColor: string;
  /** Stroke opacity for ring path */
  strokeOpacity: number;
}

export interface OrbitIconConfig {
  resource: NormalizedResource;
  ring: number;
  phaseShift: number;
  size: number;
}

/* ─── Ring Definitions ─── */

export const RING_CONFIGS: OrbitRingConfig[] = [
  {
    radius: 60,
    speed: 0.4,
    count: 2,
    glowColor: '#FE5102', // Aperol (brightest, center)
    strokeOpacity: 0.35,
  },
  {
    radius: 105,
    speed: -0.25,
    count: 3,
    glowColor: '#cc4100', // Darker orange
    strokeOpacity: 0.25,
  },
  {
    radius: 155,
    speed: 0.15,
    count: 4,
    glowColor: '#8B2D00', // Darkest orange
    strokeOpacity: 0.18,
  },
];

/* ─── Icon Sizes ─── */

const ICON_SIZES: Record<number, number> = {
  0: 36, // inner
  1: 32, // middle
  2: 28, // outer
};

/* ─── Responsive Scale ─── */

export const RESPONSIVE_BREAKPOINTS = {
  sm: 640,
  lg: 1024,
} as const;

export const RESPONSIVE_SCALES = {
  sm: 0.65,
  md: 0.85,
  lg: 1.0,
} as const;

/* ─── Distribution ─── */

export function distributeResources(
  resources: NormalizedResource[],
): OrbitIconConfig[] {
  const configs: OrbitIconConfig[] = [];
  let idx = 0;

  for (let ring = 0; ring < RING_CONFIGS.length; ring++) {
    const { count } = RING_CONFIGS[ring];
    const size = ICON_SIZES[ring] ?? 28;

    for (let i = 0; i < count; i++) {
      if (idx >= resources.length) break;
      configs.push({
        resource: resources[idx],
        ring,
        phaseShift: (2 * Math.PI * i) / count,
        size,
      });
      idx++;
    }
  }

  return configs;
}

/* ─── Container Size ─── */

const outerRing = RING_CONFIGS[RING_CONFIGS.length - 1];
const outerIconSize = ICON_SIZES[RING_CONFIGS.length - 1] ?? 28;

export const BASE_CONTAINER_SIZE = (outerRing.radius + outerIconSize) * 2;
