import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../lib/theme-provider';

type ThemeOption = 'light' | 'dark' | 'system';

/**
 * Theme configuration for each mode
 */
const themeConfig: Record<ThemeOption, {
  icon: typeof Sun;
  label: string;
  next: ThemeOption;
}> = {
  light: { icon: Sun, label: 'Light', next: 'dark' },
  dark: { icon: Moon, label: 'Dark', next: 'system' },
  system: { icon: Monitor, label: 'System', next: 'light' },
};

/**
 * Theme toggle button that cycles through light → dark → system modes
 * Features animated icon transitions using framer-motion
 * Hidden on mobile (below md breakpoint)
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show skeleton while mounting to prevent hydration mismatch
  if (!mounted) {
    return (
      <div 
        className="hidden md:flex items-center justify-center w-10 h-10 
          bg-os-surface-dark/50 border border-os-border-dark rounded-lg"
        aria-hidden="true"
      >
        <div className="w-5 h-5 animate-pulse bg-[var(--bg-tertiary)] rounded" />
      </div>
    );
  }

  const { icon: Icon, label, next } = themeConfig[theme];

  return (
    <button
      onClick={() => setTheme(next)}
      className="hidden md:flex items-center justify-center w-10 h-10
        bg-os-surface-dark/50 border border-os-border-dark rounded-lg
        text-os-text-secondary-dark hover:text-os-text-primary-dark
        hover:border-brand-aperol/30 transition-all duration-200"
      aria-label={`Theme: ${label}. Click to switch to ${themeConfig[next].label} mode`}
      title={`${label} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
          transition={{ 
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1] // Custom easing for smooth feel
          }}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
