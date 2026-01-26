import { motion } from 'framer-motion';
import { getCategoryColor } from '../../types/resource';
import {
  Users,
  Lightbulb,
  GraduationCap,
  LayoutTemplate,
  Wrench,
  Brain
} from 'lucide-react';

interface CategoryCardProps {
  category: string;
  count: number;
  isExpanded: boolean;
  isOtherExpanded: boolean;
  onClick: () => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Community': Users,
  'Inspiration': Lightbulb,
  'Learning': GraduationCap,
  'Templates': LayoutTemplate,
  'Tools': Wrench,
  'AI': Brain,
};

export function CategoryCard({
  category,
  count,
  isExpanded,
  isOtherExpanded,
  onClick
}: CategoryCardProps) {
  const categoryColor = getCategoryColor(category);
  const Icon = CATEGORY_ICONS[category] || Wrench;

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative w-full p-6 rounded-xl text-left
        bg-os-surface-dark/40 border border-os-border-dark
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 focus:ring-offset-2 focus:ring-offset-os-bg-dark
        ${isExpanded ? 'ring-2' : ''}
      `}
      style={{
        borderColor: isExpanded ? categoryColor : undefined,
        boxShadow: isExpanded ? `0 0 30px ${categoryColor}20` : undefined,
      }}
      animate={{
        opacity: isOtherExpanded && !isExpanded ? 0.5 : 1,
        scale: isExpanded ? 1.02 : 1,
      }}
      whileHover={{
        scale: isOtherExpanded ? 1 : 1.02,
        boxShadow: `0 8px 30px ${categoryColor}15`,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Category icon with color background */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: `${categoryColor}20` }}
      >
        <Icon
          className="w-6 h-6"
          style={{ color: categoryColor }}
        />
      </div>

      {/* Category name */}
      <h3 className="text-xl font-display font-semibold text-brand-vanilla mb-1">
        {category}
      </h3>

      {/* Resource count */}
      <p className="text-sm text-os-text-secondary-dark">
        <span
          className="font-semibold"
          style={{ color: categoryColor }}
        >
          {count}
        </span>
        {' '}resource{count !== 1 ? 's' : ''}
      </p>

      {/* Expand indicator */}
      <motion.div
        className="absolute top-4 right-4"
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="text-os-text-secondary-dark"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </motion.button>
  );
}
