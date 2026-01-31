/**
 * Motion Design Tokens
 * 
 * Standardized animation values for consistent motion across the app.
 * Use these instead of hardcoded duration/easing values.
 */

/**
 * Duration presets in seconds (for framer-motion)
 */
export const DURATION = {
  /** Fast interactions: hover, tap feedback (150ms) */
  fast: 0.15,
  /** Default transitions: most UI elements (200ms) */
  normal: 0.2,
  /** Entrance/exit animations: modals, dropdowns (300ms) */
  slow: 0.3,
  /** Complex animations: page transitions (500ms) */
  slower: 0.5,
  /** Cinematic: large canvas animations (800ms) */
  cinematic: 0.8,
} as const;

/**
 * Easing curves (for framer-motion)
 * Format: [x1, y1, x2, y2] cubic-bezier
 */
export const EASING = {
  /** Standard UI transitions - smooth deceleration */
  smooth: [0.4, 0, 0.2, 1] as const,
  /** Spring-like feel - fast start, bouncy finish */
  spring: [0.16, 1, 0.3, 1] as const,
  /** Linear - no easing (use sparingly) */
  linear: [0, 0, 1, 1] as const,
} as const;

/**
 * Spring physics presets (for framer-motion type: 'spring')
 */
export const SPRING = {
  /** Soft, slow animations: counters, progress meters */
  gentle: { stiffness: 50, damping: 20 },
  /** Standard entrance/exit animations */
  normal: { stiffness: 300, damping: 24 },
  /** Snappy, responsive feedback: hover, tap */
  snappy: { stiffness: 400, damping: 25 },
} as const;

/**
 * Stagger delay for list animations (in seconds)
 */
export const STAGGER = {
  /** Fast stagger between items (30ms) */
  fast: 0.03,
  /** Normal stagger (50ms) */
  normal: 0.05,
  /** Slow stagger for dramatic effect (100ms) */
  slow: 0.1,
} as const;

/**
 * Common transition presets combining duration + easing
 */
export const TRANSITION = {
  /** Fast UI feedback */
  fast: { duration: DURATION.fast, ease: EASING.smooth },
  /** Default transition */
  normal: { duration: DURATION.normal, ease: EASING.smooth },
  /** Entrance/exit animations */
  slow: { duration: DURATION.slow, ease: EASING.smooth },
  /** Spring-based entrance */
  springIn: { type: 'spring' as const, ...SPRING.normal },
  /** Snappy spring feedback */
  springSnappy: { type: 'spring' as const, ...SPRING.snappy },
} as const;
