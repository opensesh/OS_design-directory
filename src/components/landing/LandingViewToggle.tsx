import { motion } from 'framer-motion';
import { TRANSITION } from '@/lib/motion-tokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface LandingViewToggleProps {
  onNavigate: (display: '3d' | 'card') => void;
  onOpenSearch: () => void;
}

const TOGGLE_OPTIONS = [
  { label: 'Universe', action: '3d' as const },
  { label: 'Card', action: 'card' as const },
  { label: 'Search', action: 'search' as const },
] as const;

/**
 * LandingViewToggle
 *
 * Three equal-width text buttons for navigating to Universe, Card, or Search.
 * Styled to match the existing view toggle in the subheader.
 */
export function LandingViewToggle({ onNavigate, onOpenSearch }: LandingViewToggleProps) {
  const prefersReducedMotion = useReducedMotion();

  const handleClick = (action: 'card' | '3d' | 'search') => {
    if (action === 'search') {
      onOpenSearch();
    } else {
      onNavigate(action);
    }
  };

  return (
    <div className="flex items-center w-full max-w-sm bg-os-surface-dark/50 rounded-lg p-1 border border-[var(--border-secondary)]">
      {TOGGLE_OPTIONS.map((option) => (
        <motion.button
          key={option.label}
          onClick={() => handleClick(option.action)}
          whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
          transition={TRANSITION.fast}
          className="flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors text-os-text-secondary-dark hover:text-os-text-primary-dark hover:bg-[var(--bg-tertiary)]"
        >
          {option.label}
        </motion.button>
      ))}
    </div>
  );
}
