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

  // Group categories into rows of 3 for desktop (md+) 
  // SubcategoryRow will be inserted after the row containing the expanded card
  const rows = useMemo(() => {
    const result: { categories: typeof categoriesWithCounts; hasExpanded: boolean; expandedCategory: string | null }[] = [];
    const columnsPerRow = 3; // This matches md:grid-cols-3
    
    for (let i = 0; i < categoriesWithCounts.length; i += columnsPerRow) {
      const rowCategories = categoriesWithCounts.slice(i, i + columnsPerRow);
      const expandedInRow = rowCategories.find(c => c.name === expandedCategory);
      result.push({
        categories: rowCategories,
        hasExpanded: !!expandedInRow,
        expandedCategory: expandedInRow?.name || null
      });
    }
    return result;
  }, [categoriesWithCounts, expandedCategory]);

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
      {rows.map((row, rowIndex) => (
        <Fragment key={rowIndex}>
          {/* Render all cards in this row */}
          {row.categories.map((category) => (
            <motion.div
              key={category.name}
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
          ))}

          {/* Insert SubcategoryRow after the complete row if any card in this row is expanded */}
          {row.hasExpanded && row.expandedCategory && (
            <SubcategoryRow
              category={row.expandedCategory}
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
