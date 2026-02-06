import { motion } from 'framer-motion';
import { getCategoryColor } from '../../types/resource';
import { TRANSITION } from '@/lib/motion-tokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface SubcategoryCardProps {
  subcategory: string;
  category: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

export function SubcategoryCard({
  subcategory,
  category,
  count,
  isActive,
  onClick
}: SubcategoryCardProps) {
  const categoryColor = getCategoryColor(category);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      className={`
        flex-shrink-0 px-4 py-3 rounded-lg text-left
        bg-os-surface-dark/60 border border-[var(--border-secondary)]
        transition-colors duration-200
        focus:outline-none focus:ring-1 focus:ring-[var(--border-primary)]/60 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]
      `}
      style={{
        borderColor: isActive ? categoryColor : undefined,
        backgroundColor: isActive ? `${categoryColor}15` : undefined,
      }}
      whileHover={prefersReducedMotion ? {} : {
        scale: 1.02,
        backgroundColor: `${categoryColor}10`,
      }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
      transition={TRANSITION.fast}
    >
      <div className="flex items-center gap-3">
        {/* Color indicator dot */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: categoryColor }}
        />

        <div>
          <p className="text-sm font-medium text-[var(--fg-primary)] whitespace-nowrap">
            {subcategory}
          </p>
          <p className="text-xs text-os-text-secondary-dark">
            {count} resource{count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
