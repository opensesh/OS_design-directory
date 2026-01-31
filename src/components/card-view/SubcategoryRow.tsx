import { useMemo, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SubcategoryCard } from './SubcategoryCard';
import type { NormalizedResource } from '../../types/resource';

interface SubcategoryRowProps {
  category: string;
  columnIndex: number;
  columnCount: number;
  resources: NormalizedResource[];
  activeSubcategory: string | null;
  onSubcategoryClick: (subcategory: string) => void;
}

export const SubcategoryRow = forwardRef<HTMLDivElement, SubcategoryRowProps>(
  function SubcategoryRow({
    category,
    columnIndex,
    columnCount: _columnCount,
    resources,
    activeSubcategory,
    onSubcategoryClick
  }, ref) {
    // Extract unique subcategories with counts for this category
    const subcategories = useMemo(() => {
      const subcategoryMap = new Map<string, number>();

      resources.forEach(resource => {
        if (resource.category === category && resource.subCategory) {
          const subCat = resource.subCategory.trim();
          if (subCat !== '') {
            subcategoryMap.set(subCat, (subcategoryMap.get(subCat) || 0) + 1);
          }
        }
      });

      return Array.from(subcategoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }, [category, resources]);

    if (subcategories.length === 0) return null;

    // Calculate grid column start (1-indexed for CSS grid)
    const gridColumnStart = columnIndex + 1;

    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
          transition={{
            duration: 0.35,
            ease: [0.4, 0, 0.2, 1],
            opacity: { duration: 0.25 }
          }}
          style={{ transformOrigin: 'top', overflow: 'hidden' }}
          className="overflow-hidden"
        >
          {/* Use matching grid structure to align with cards - 1 col mobile, 2 tablet, 3 desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            <div 
              style={{ 
                gridColumn: gridColumnStart + ' / -1'
              }}
            >
              <p className="text-xs text-os-text-secondary-dark mb-3 uppercase tracking-wider">
                Subcategories
              </p>
              <div className="flex flex-wrap gap-2">
                {subcategories.map((sub, index) => (
                  <motion.div
                    key={sub.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.05
                    }}
                  >
                    <SubcategoryCard
                      subcategory={sub.name}
                      category={category}
                      count={sub.count}
                      isActive={activeSubcategory === sub.name}
                      onClick={() => onSubcategoryClick(sub.name)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);
