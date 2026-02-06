import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { PAGE_TRANSITION } from '@/lib/motion-tokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Page transition wrapper for route-level animations
 *
 * Wraps page content with Framer Motion for smooth fade + slide
 * transitions between routes. Respects reduced motion preference.
 *
 * @example
 * // In App.tsx routes
 * <Route path="/" element={<PageTransition><Home /></PageTransition>} />
 */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const transition = prefersReducedMotion
    ? PAGE_TRANSITION.reduced
    : PAGE_TRANSITION.route;

  return (
    <motion.div
      key={location.pathname}
      initial={transition.initial}
      animate={transition.animate}
      exit={transition.exit}
      transition={transition.transition}
    >
      {children}
    </motion.div>
  );
}
