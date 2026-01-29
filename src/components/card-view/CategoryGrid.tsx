import { useMemo, Fragment, useRef, useEffect, useState } from 'react';
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
  // Ref to track the subcategory row element for scrolling
  const subcategoryRowRef = useRef<HTMLDivElement | null>(null);
  
  // Track actual column count based on viewport
  // Mobile (<640px): 1 column, Tablet (640-1024px): 2 columns, Desktop (1024px+): 3 columns
  const [columnCount, setColumnCount] = useState(3);

  // Update column count on resize
  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth < 640) {
        setColumnCount(1);
      } else if (window.innerWidth < 1024) {
        setColumnCount(2);
      } else {
        setColumnCount(3);
      }
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Scroll to subcategory row when category expands to ensure subcategories are visible
  useEffect(() => {
    if (expandedCategory && subcategoryRowRef.current) {
      // Delay to allow the height animation to start
      const timer = setTimeout(() => {
        subcategoryRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [expandedCategory]);

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

  // Group categories into visual rows based on actual column count
  // This ensures SubcategoryRow appears directly below the correct row
  const rows = useMemo(() => {
    const result: { 
      categories: typeof categoriesWithCounts; 
      hasExpanded: boolean; 
      expandedCategory: string | null;
      expandedColumnIndex: number;
    }[] = [];
    
    for (let i = 0; i < categoriesWithCounts.length; i += columnCount) {
      const rowCategories = categoriesWithCounts.slice(i, i + columnCount);
      const expandedIndex = rowCategories.findIndex(c => c.name === expandedCategory);
      
      result.push({
        categories: rowCategories,
        hasExpanded: expandedIndex !== -1,
        expandedCategory: expandedIndex !== -1 ? rowCategories[expandedIndex].name : null,
        expandedColumnIndex: expandedIndex
      });
    }
    return result;
  }, [categoriesWithCounts, expandedCategory, columnCount]);

  return (
    <motion.div
      className="flex flex-col gap-4"
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
          {/* Each visual row is its own grid - 1 col mobile, 2 tablet, 3 desktop */}
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {row.categories.map((category) => {
              const isExpanded = expandedCategory === category.name;
              return (
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
                    isExpanded={isExpanded}
                    isOtherExpanded={expandedCategory !== null && !isExpanded}
                    onClick={() => onCategoryClick(category.name)}
                  />
                </motion.div>
              );
            })}
          </motion.div>

          {/* SubcategoryRow appears directly below its row, aligned with expanded card */}
          {row.hasExpanded && row.expandedCategory && (
            <SubcategoryRow
              ref={subcategoryRowRef}
              category={row.expandedCategory}
              columnIndex={row.expandedColumnIndex}
              columnCount={columnCount}
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
