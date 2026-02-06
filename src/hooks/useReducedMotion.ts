import { useEffect, useState } from 'react';
import {
  DURATION,
  EASING,
  INTERACTION,
  PAGE_TRANSITION,
  LIST_ANIMATION,
} from '@/lib/motion-tokens';

/**
 * Hook to detect user's reduced motion preference
 *
 * Returns true if the user has enabled "Reduce motion" in their
 * system preferences (macOS: Accessibility > Display > Reduce motion)
 *
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * // Use to conditionally disable animations
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns motion-safe animation values
 *
 * When reduced motion is preferred, returns opacity-only animations
 * with no scale or movement. Full motion otherwise.
 *
 * @example
 * const { interaction, pageTransition, listAnimation } = useMotionSafe();
 * // Spread onto motion elements
 * <motion.div {...interaction.cardLift} />
 */
export function useMotionSafe() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return {
      /** No scale on hover/tap */
      interaction: INTERACTION.none,
      /** Opacity-only page transitions */
      pageTransition: PAGE_TRANSITION.reduced,
      /** Opacity-only list animations */
      listAnimation: {
        container: {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        },
        item: LIST_ANIMATION.reducedItem,
        gridItem: LIST_ANIMATION.reducedItem,
      },
      /** Instant transitions */
      transition: { duration: DURATION.fast, ease: EASING.smooth },
      /** Flag for conditional logic */
      isReduced: true,
    };
  }

  return {
    interaction: {
      cardLift: INTERACTION.cardLift,
      buttonLift: INTERACTION.buttonLift,
      subtle: INTERACTION.subtle,
    },
    pageTransition: PAGE_TRANSITION,
    listAnimation: LIST_ANIMATION,
    transition: { duration: DURATION.normal, ease: EASING.smooth },
    isReduced: false,
  };
}
