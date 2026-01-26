import { useMemo, Fragment } from 'react';
import { motion } from 'framer-motion';
import { CategoryCard } from './CategoryCard';
import { SubcategoryRow } from './SubcategoryRow';
import { CATEGORY_COLORS } from '../../types/resource';
import type { NormalizedResource } from '../../types/resource';

interface CategoryGridProps {
  resources: NormalizedResource[];
  expandedCategory: string | null;
  activeSubcategory: string | null;
  onCategoryClick: (category: string) => void;
  onSubcategoryClick: (subcategory: string) => void;
}

export function CategoryGrid({
  resources,
  expandedCategory,
  activeSubcategory,
  onCategoryClick,
  onSubcategoryClick
}: CategoryGridProps) {
  // Get all categories with counts
  const categoriesWithCounts = useMemo(() => {
    const categories = Object.keys(CATEGORY_COLORS);
    return categories
      .map(category => ({
        name: category,
        count: resources.filter(r => r.category === category).length
      }))
      .sort((a, b) => {
        // Sort alphabetically but move "AI" to the end
        if (a.name.toUpperCase() === 'AI') return 1;
        if (b.name.toUpperCase() === 'AI') return -1;
        return a.name.localeCompare(b.name);
      });
  }, [resources]);

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 gap-4"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.08 }
        }
      }}
    >
      {categoriesWithCounts.map((category) => (
        <Fragment key={category.name}>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <CategoryCard
              category={category.name}
              count={category.count}
              isExpanded={expandedCategory === category.name}
              isOtherExpanded={expandedCategory !== null && expandedCategory !== category.name}
              onClick={() => onCategoryClick(category.name)}
            />
          </motion.div>

          {/* Insert SubcategoryRow directly after the expanded category card */}
          {expandedCategory === category.name && (
            <SubcategoryRow
              category={expandedCategory}
              resources={resources}
              activeSubcategory={activeSubcategory}
              onSubcategoryClick={onSubcategoryClick}
            />
          )}
        </Fragment>
      ))}
    </motion.div>
  );
}
