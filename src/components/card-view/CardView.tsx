import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CardViewBreadcrumbs } from './CardViewBreadcrumbs';
import { CategoryGrid } from './CategoryGrid';
import { ResourceMosaic } from './ResourceMosaic';
import type { NormalizedResource } from '../../types/resource';

interface CardViewProps {
  resources: NormalizedResource[];
}

export function CardView({ resources }: CardViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read state from URL
  const activeCategory = searchParams.get('cat');
  const activeSubcategory = searchParams.get('sub');

  // Determine current level
  const level = activeSubcategory ? 3 : activeCategory ? 2 : 1;

  // Filter resources based on current state
  const filteredResources = useMemo(() => {
    let filtered = resources;

    if (activeCategory) {
      filtered = filtered.filter(r => r.category === activeCategory);
    }

    if (activeSubcategory) {
      filtered = filtered.filter(r => r.subCategory === activeSubcategory);
    }

    return filtered;
  }, [resources, activeCategory, activeSubcategory]);

  // Navigation handlers
  const navigateToHome = useCallback(() => {
    setSearchParams({ display: 'card' });
  }, [setSearchParams]);

  const navigateToCategory = useCallback(() => {
    if (activeCategory) {
      setSearchParams({ display: 'card', cat: activeCategory });
    }
  }, [activeCategory, setSearchParams]);

  const handleCategoryClick = useCallback((category: string) => {
    if (activeCategory === category) {
      // Collapse if clicking same category
      setSearchParams({ display: 'card' });
    } else {
      // Expand new category
      setSearchParams({ display: 'card', cat: category });
    }
  }, [activeCategory, setSearchParams]);

  const handleSubcategoryClick = useCallback((subcategory: string) => {
    if (activeCategory) {
      setSearchParams({
        display: 'card',
        cat: activeCategory,
        sub: subcategory
      });
    }
  }, [activeCategory, setSearchParams]);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Breadcrumbs */}
        <CardViewBreadcrumbs
          category={activeCategory}
          subcategory={activeSubcategory}
          resourceCount={filteredResources.length}
          onNavigateHome={navigateToHome}
          onNavigateCategory={navigateToCategory}
        />

        {/* Content based on level */}
        <AnimatePresence mode="wait">
          {level <= 2 ? (
            <motion.div
              key="category-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <CategoryGrid
                resources={resources}
                expandedCategory={activeCategory}
                activeSubcategory={activeSubcategory}
                onCategoryClick={handleCategoryClick}
                onSubcategoryClick={handleSubcategoryClick}
              />
            </motion.div>
          ) : (
            <motion.div
              key="resource-mosaic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <ResourceMosaic
                resources={resources}
                category={activeCategory!}
                subcategory={activeSubcategory!}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
