import { motion } from 'framer-motion';
import { DURATION, EASING } from '@/lib/motion-tokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { IconCarousel } from './IconCarousel';
import { LandingViewToggle } from './LandingViewToggle';
import type { NormalizedResource } from '@/types/resource';

interface LandingPageProps {
  resources: NormalizedResource[];
  onNavigate: (display: '3d' | 'card') => void;
  onOpenSearch: () => void;
}

/**
 * Container variants for staggered entrance animation.
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASING.smooth },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: DURATION.normal, ease: EASING.smooth },
  },
};

const reducedItemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.fast } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};

/**
 * LandingPage
 *
 * The front door of the Design Directory.
 * Shows a rotating icon carousel, title, description,
 * and a view toggle to jump into Universe, Card, or Search.
 */
export function LandingPage({ resources, onNavigate, onOpenSearch }: LandingPageProps) {
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion ? reducedItemVariants : itemVariants;

  return (
    <motion.div
      className="h-full flex flex-col items-center justify-center gap-6 md:gap-8 px-6 pb-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Icon Carousel */}
      <motion.div variants={variants}>
        <IconCarousel resources={resources} />
      </motion.div>

      {/* Title */}
      <motion.h1
        variants={variants}
        className="font-accent font-bold text-brand-aperol uppercase text-center leading-none"
        style={{ fontSize: 'clamp(2rem, 7vw, 5rem)' }}
      >
        Design Directory
      </motion.h1>

      {/* Description */}
      <motion.p
        variants={variants}
        className="text-lg md:text-xl text-brand-vanilla text-center max-w-md"
      >
        Discover hand-picked design inspiration & resources.
      </motion.p>

      {/* Label + Toggle grouped with tight spacing */}
      <motion.div variants={variants} className="flex flex-col items-center gap-2 w-full">
        <span className="text-xs uppercase tracking-wider text-[var(--fg-tertiary)]">
          Choose your view
        </span>
        <div className="w-full flex justify-center">
          <LandingViewToggle onNavigate={onNavigate} onOpenSearch={onOpenSearch} />
        </div>
      </motion.div>
    </motion.div>
  );
}
