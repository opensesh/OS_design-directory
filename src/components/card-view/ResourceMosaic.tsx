import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ResourceCard } from './ResourceCard';
import type { NormalizedResource } from '../../types/resource';
import { LIST_ANIMATION } from '@/lib/motion-tokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ResourceMosaicProps {
  resources: NormalizedResource[];
  category: string;
  subcategory: string;
}

export function ResourceMosaic({
  resources,
  category,
  subcategory
}: ResourceMosaicProps) {
  const prefersReducedMotion = useReducedMotion();
  // Filter resources for the selected category and subcategory
  const filteredResources = useMemo(() => {
    return resources.filter(
      r => r.category === category && r.subCategory === subcategory
    );
  }, [resources, category, subcategory]);

  if (filteredResources.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-os-text-secondary-dark">
          No resources found in this subcategory.
        </p>
      </div>
    );
  }

  // Use reduced motion container if preferred
  const containerVariants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : LIST_ANIMATION.container;

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {filteredResources.map((resource, index) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          index={index}
        />
      ))}
    </motion.div>
  );
}
