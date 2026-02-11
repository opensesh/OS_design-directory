import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CardViewBreadcrumbs } from './CardViewBreadcrumbs';
import { CategoryGrid } from './CategoryGrid';
import { ResourceMosaic } from './ResourceMosaic';
import type { NormalizedResource } from '../../types/resource';
import { PAGE_TRANSITION } from '@/lib/motion-tokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface CardViewProps {
  resources: NormalizedResource[];
}

export function CardView({ resources }: CardViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  // Get transition based on motion preference
  const transition = prefersReducedMotion ? PAGE_TRANSITION.reduced : PAGE_TRANSITION.viewSwitch;

  // Read state from URL
  const activeCategory = searchParams.get('category');
  const activeSubcategory = searchParams.get('subCategory');

  // Determine current level
  const level = activeSubcategory ? 3 : activeCategory ? 2 : 1;

  // Scroll to top when navigating between levels
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevLevelRef = useRef<number>(level);

  useEffect(() => {
    if (scrollContainerRef.current && prevLevelRef.current !== level) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
      prevLevelRef.current = level;
    }
  }, [level, prefersReducedMotion]);

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
      setSearchParams({ display: 'card', category: activeCategory });
    }
  }, [activeCategory, setSearchParams]);

  const handleCategoryClick = useCallback((category: string) => {
    if (activeCategory === category) {
      // Collapse if clicking same category
      setSearchParams({ display: 'card' });
    } else {
      // Expand new category
      setSearchParams({ display: 'card', category: category });
    }
  }, [activeCategory, setSearchParams]);

  const handleSubcategoryClick = useCallback((subcategory: string) => {
    if (activeCategory) {
      setSearchParams({
        display: 'card',
        category: activeCategory,
        subCategory: subcategory
      });
    }
  }, [activeCategory, setSearchParams]);

  return (
    <div ref={scrollContainerRef} className="h-full overflow-auto py-6">
      <div className="max-w-7xl mx-auto px-6">
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
              initial={transition.initial}
              animate={transition.animate}
              exit={transition.exit}
              transition={transition.transition}
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
              initial={transition.initial}
              animate={transition.animate}
              exit={transition.exit}
              transition={transition.transition}
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
