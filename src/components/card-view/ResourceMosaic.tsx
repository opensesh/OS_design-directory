import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ResourceCard } from './ResourceCard';
import type { NormalizedResource } from '../../types/resource';

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

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.03 }
        }
      }}
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
