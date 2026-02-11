import { useMemo, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SubcategoryCard } from './SubcategoryCard';
import { DURATION, EASING, STAGGER } from '@/lib/motion-tokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { NormalizedResource } from '../../types/resource';

interface SubcategoryRowProps {
  category: string;
  columnIndex: number;
  columnCount: number;
  resources: NormalizedResource[];
  activeSubcategory: string | null;
  onSubcategoryClick: (subcategory: string) => void;
  onExpandComplete?: () => void;
}

export const SubcategoryRow = forwardRef<HTMLDivElement, SubcategoryRowProps>(
  function SubcategoryRow({
    category,
    columnIndex,
    columnCount: _columnCount,
    resources,
    activeSubcategory,
    onSubcategoryClick,
    onExpandComplete
  }, ref) {
    const prefersReducedMotion = useReducedMotion();
    const isEnteringRef = useRef(true);

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
          initial={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={prefersReducedMotion ? { duration: DURATION.fast } : {
            height: { duration: DURATION.slow, ease: EASING.spring },
            opacity: { duration: DURATION.normal, delay: 0.05 }
          }}
          onAnimationComplete={() => {
            if (isEnteringRef.current) {
              onExpandComplete?.();
              isEnteringRef.current = false;
            }
          }}
          style={{ overflow: 'hidden' }}
        >
          {/* Use matching grid structure to align with cards - 1 col mobile, 2 tablet, 3 desktop */}
          {/* Added padding to accommodate hover scale effect on subcategory cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4 px-1 -mx-1">
            <div
              style={{
                gridColumn: gridColumnStart + ' / -1'
              }}
            >
              <p className="text-xs text-os-text-secondary-dark mb-3 uppercase tracking-wider">
                Subcategories
              </p>
              <div className="flex flex-wrap gap-2 py-1 -my-1">
                {subcategories.map((sub, index) => (
                  <motion.div
                    key={sub.name}
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                    transition={prefersReducedMotion ? { duration: DURATION.fast } : {
                      duration: DURATION.normal,
                      ease: EASING.spring,
                      delay: DURATION.fast + (index * STAGGER.normal)
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
