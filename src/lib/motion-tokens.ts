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

/**
 * Interaction presets for consistent hover/tap behavior
 * Use these on motion elements for standardized gestures
 */
export const INTERACTION = {
  /** Cards: subtle lift on hover (scale 1.02) */
  cardLift: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: TRANSITION.fast,
  },
  /** Buttons: more prominent lift (scale 1.05) */
  buttonLift: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: TRANSITION.springSnappy,
  },
  /** Inline elements: very subtle (scale 1.01) */
  subtle: {
    whileHover: { scale: 1.01 },
    whileTap: { scale: 0.99 },
    transition: TRANSITION.fast,
  },
  /** No interaction: for reduced motion */
  none: {
    whileHover: {},
    whileTap: {},
  },
} as const;

/**
 * Page/View transition presets
 * Use with AnimatePresence for route or view changes
 */
export const PAGE_TRANSITION = {
  /** Display mode switching (3D/card/table) - vertical movement */
  viewSwitch: {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.98 },
    transition: { duration: DURATION.slow, ease: EASING.smooth },
  },
  /** Route transitions - horizontal slide + fade */
  route: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: DURATION.normal, ease: EASING.smooth },
  },
  /** Modal/overlay entry */
  modal: {
    initial: { opacity: 0, scale: 0.95, y: -20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -20 },
    transition: { duration: DURATION.fast, ease: EASING.smooth },
  },
  /** Backdrop fade */
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: DURATION.fast },
  },
  /** Reduced motion: opacity only */
  reduced: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: DURATION.fast },
  },
} as const;

/**
 * List/Grid animation presets
 * Use with variants for staggered children
 */
export const LIST_ANIMATION = {
  /** Container that enables stagger - use as variants */
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: STAGGER.fast },
    },
  },
  /** List items with vertical entrance */
  item: {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATION.slow, ease: EASING.smooth },
    },
  },
  /** Grid items with scale entrance */
  gridItem: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring' as const, ...SPRING.normal },
    },
  },
  /** Reduced motion: opacity only */
  reducedItem: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: DURATION.fast } },
  },
} as const;
