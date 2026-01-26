import { motion } from 'framer-motion';
import { getCategoryColor } from '../../types/resource';

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

  return (
    <motion.button
      onClick={onClick}
      className={`
        flex-shrink-0 px-4 py-3 rounded-lg text-left
        bg-os-surface-dark/60 border border-os-border-dark
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 focus:ring-offset-2 focus:ring-offset-os-bg-dark
      `}
      style={{
        borderColor: isActive ? categoryColor : undefined,
        backgroundColor: isActive ? `${categoryColor}15` : undefined,
      }}
      whileHover={{
        scale: 1.02,
        backgroundColor: `${categoryColor}10`,
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        {/* Color indicator dot */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: categoryColor }}
        />

        <div>
          <p className="text-sm font-medium text-brand-vanilla whitespace-nowrap">
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
