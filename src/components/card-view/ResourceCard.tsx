import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { NormalizedResource } from '../../types/resource';
import { getCategoryColor } from '../../types/resource';
import { SPRING, STAGGER } from '@/lib/motion-tokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ResourceLogo } from '@/components/ui/ResourceLogo';

interface ResourceCardProps {
  resource: NormalizedResource;
  index: number;
}

export function ResourceCard({ resource, index }: ResourceCardProps) {
  const navigate = useNavigate();
  const categoryColor = getCategoryColor(resource.category);
  const prefersReducedMotion = useReducedMotion();

  // Pricing badge color - uses semantic tokens from theme.css
  const getPricingColor = (pricing: string | null) => {
    if (!pricing) return null;
    const p = pricing.toLowerCase();
    if (p.includes('free')) return 'var(--color-pricing-free)';
    if (p.includes('freemium')) return 'var(--color-pricing-freemium)';
    if (p.includes('paid')) return 'var(--color-pricing-paid)';
    return 'var(--color-pricing-default)';
  };

  const pricingColor = getPricingColor(resource.pricing);

  return (
    <motion.button
      onClick={() => navigate(`/resource/${resource.id}`)}
      className={`
        relative w-full aspect-square rounded-lg overflow-hidden
        bg-os-surface-dark/40 border border-[var(--border-secondary)]
        flex flex-col items-center justify-center p-3
        text-center transition-colors duration-200
        focus:outline-none focus:ring-1 focus:ring-[var(--border-primary)]/60 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]
        group
      `}
      variants={prefersReducedMotion ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
      } : {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: {
            type: 'spring',
            ...SPRING.normal,
            delay: index * STAGGER.fast
          }
        }
      }}
      whileHover={prefersReducedMotion ? {} : {
        scale: 1.02,
        boxShadow: `0 8px 30px ${categoryColor}15`,
        borderColor: categoryColor,
      }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
    >
      {/* Resource logo */}
      <ResourceLogo resource={resource} size="lg" faviconSize="lg" className="mb-2" />

      {/* Resource name */}
      <p className="text-xs font-medium text-[var(--fg-primary)] line-clamp-2 leading-tight">
        {resource.name}
      </p>

      {/* Pricing badge */}
      {resource.pricing && pricingColor && (
        <div
          className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{
            backgroundColor: `${pricingColor}20`,
            color: pricingColor,
          }}
        >
          {resource.pricing}
        </div>
      )}

      {/* Hover overlay with category color */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          background: `linear-gradient(135deg, ${categoryColor}05 0%, ${categoryColor}10 100%)`,
        }}
      />
    </motion.button>
  );
}
