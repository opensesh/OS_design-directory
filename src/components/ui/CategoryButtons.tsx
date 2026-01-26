import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NormalizedResource } from '../../types/resource';
import { CATEGORY_COLORS } from '../../types/resource';

interface CategoryButtonsProps {
  resources: NormalizedResource[];
  activeCategory: string | null;
  activeSubCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onSubCategoryChange: (subCategory: string | null) => void;
}

export function CategoryButtons({
  resources,
  activeCategory,
  activeSubCategory,
  onCategoryChange,
  onSubCategoryChange,
}: CategoryButtonsProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSubCategory, setHoveredSubCategory] = useState<string | null>(null);

  // Extract unique categories from resources
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    resources.forEach(resource => {
      if (resource.category) {
        const cat = resource.category.trim();
        if (cat.toLowerCase() !== 'all' && cat !== '') {
          categorySet.add(cat);
        }
      }
    });
    // Sort alphabetically but move "AI" to the end
    return Array.from(categorySet).sort((a, b) => {
      if (a.toUpperCase() === 'AI') return 1;
      if (b.toUpperCase() === 'AI') return -1;
      return a.localeCompare(b);
    });
  }, [resources]);

  // Extract subcategories for the active category
  const subCategories = useMemo(() => {
    if (!activeCategory) return [];

    const subCategorySet = new Set<string>();
    resources.forEach(resource => {
      if (resource.category === activeCategory && resource.subCategory) {
        const subCat = resource.subCategory.trim();
        if (subCat !== '') {
          subCategorySet.add(subCat);
        }
      }
    });

    return Array.from(subCategorySet).sort((a, b) => a.localeCompare(b));
  }, [resources, activeCategory]);

  // Get the active category color
  const activeCategoryColor = activeCategory
    ? CATEGORY_COLORS[activeCategory] || '#9CA3AF'
    : '#9CA3AF';

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Main Category Row */}
      <div className="overflow-x-auto scrollbar-hide py-1">
        <div className="flex items-center justify-center gap-2 min-w-max px-4">
          {/* All button - resets filter */}
          <motion.button
            onClick={() => {
              onCategoryChange(null);
              onSubCategoryChange(null);
            }}
            className={`
              px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200 whitespace-nowrap
              focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 focus:ring-offset-2 focus:ring-offset-os-bg-dark
              ${activeCategory === null
                ? 'bg-brand-aperol text-white'
                : 'bg-os-surface-dark/60 text-os-text-secondary-dark hover:text-brand-vanilla border border-os-border-dark/40'
              }
            `}
            whileTap={{ scale: 0.95 }}
          >
            All
          </motion.button>

          {/* Category buttons with color-coded hover */}
          {categories.map((category) => {
            const isActive = activeCategory === category;
            const isHovered = hoveredCategory === category;
            const categoryColor = CATEGORY_COLORS[category] || '#9CA3AF';

            return (
              <motion.button
                key={category}
                onClick={() => {
                  onCategoryChange(category);
                  onSubCategoryChange(null); // Reset subcategory when changing category
                }}
                onMouseEnter={() => setHoveredCategory(category)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium
                  transition-all duration-200 whitespace-nowrap
                  focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 focus:ring-offset-2 focus:ring-offset-os-bg-dark
                  ${isActive
                    ? 'text-white'
                    : 'bg-os-surface-dark/60 text-os-text-secondary-dark hover:text-brand-vanilla border border-os-border-dark/40'
                  }
                `}
                style={{
                  backgroundColor: isActive
                    ? categoryColor
                    : isHovered
                      ? `${categoryColor}20`
                      : undefined,
                  borderColor: isHovered && !isActive ? categoryColor : undefined,
                  color: isHovered && !isActive ? categoryColor : undefined,
                }}
                whileTap={{ scale: 0.95 }}
              >
                {category}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Subcategory Row - Animated */}
      <AnimatePresence>
        {activeCategory && subCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.2 }
            }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto scrollbar-hide py-1">
              <motion.div
                className="flex items-center justify-center gap-2 min-w-max px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                {/* All subcategories button */}
                <motion.button
                  onClick={() => onSubCategoryChange(null)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 }}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium
                    transition-all duration-200 whitespace-nowrap
                    focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 focus:ring-offset-2 focus:ring-offset-os-bg-dark
                    ${activeSubCategory === null
                      ? 'text-white'
                      : 'bg-os-surface-dark/40 text-os-text-secondary-dark border border-os-border-dark/30'
                    }
                  `}
                  style={{
                    backgroundColor: activeSubCategory === null ? activeCategoryColor : undefined,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  All {activeCategory}
                </motion.button>

                {/* Subcategory buttons */}
                {subCategories.map((subCategory, index) => {
                  const isActive = activeSubCategory === subCategory;
                  const isHovered = hoveredSubCategory === subCategory;

                  return (
                    <motion.button
                      key={subCategory}
                      onClick={() => onSubCategoryChange(subCategory)}
                      onMouseEnter={() => setHoveredSubCategory(subCategory)}
                      onMouseLeave={() => setHoveredSubCategory(null)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 + (index * 0.03) }}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium
                        transition-all duration-200 whitespace-nowrap
                        focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 focus:ring-offset-2 focus:ring-offset-os-bg-dark
                        ${isActive
                          ? 'text-white'
                          : 'bg-os-surface-dark/40 text-os-text-secondary-dark border border-os-border-dark/30'
                        }
                      `}
                      style={{
                        backgroundColor: isActive
                          ? activeCategoryColor
                          : isHovered
                            ? `${activeCategoryColor}15`
                            : undefined,
                        borderColor: isHovered && !isActive ? `${activeCategoryColor}50` : undefined,
                        color: isHovered && !isActive ? activeCategoryColor : undefined,
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {subCategory}
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
