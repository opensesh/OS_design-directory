import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SubcategoryCard } from './SubcategoryCard';
import type { NormalizedResource } from '../../types/resource';

interface SubcategoryRowProps {
  category: string;
  resources: NormalizedResource[];
  activeSubcategory: string | null;
  onSubcategoryClick: (subcategory: string) => void;
}

export function SubcategoryRow({
  category,
  resources,
  activeSubcategory,
  onSubcategoryClick
}: SubcategoryRowProps) {
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{
          duration: 0.35,
          ease: [0.4, 0, 0.2, 1],
          opacity: { duration: 0.25 }
        }}
        className="overflow-hidden col-span-full"
      >
        <div className="py-4">
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
      </motion.div>
    </AnimatePresence>
  );
}
