import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import type { NormalizedResource } from '../../types/resource';
import { getCategoryColor } from '../../types/resource';

interface ResourceCardProps {
  resource: NormalizedResource;
  index: number;
}

export function ResourceCard({ resource, index }: ResourceCardProps) {
  const navigate = useNavigate();
  const categoryColor = getCategoryColor(resource.category);

  // Extract domain for favicon
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return null;
    }
  };

  const faviconUrl = getFaviconUrl(resource.url);

  // Pricing badge color
  const getPricingColor = (pricing: string | null) => {
    if (!pricing) return null;
    const p = pricing.toLowerCase();
    if (p.includes('free')) return '#10B981'; // Green
    if (p.includes('freemium')) return '#F59E0B'; // Amber
    if (p.includes('paid')) return '#EC4899'; // Pink
    return '#9CA3AF'; // Gray
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
      variants={{
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 24,
            delay: index * 0.03
          }
        }
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: `0 8px 30px ${categoryColor}15`,
        borderColor: categoryColor,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Thumbnail or Favicon */}
      <div className="w-12 h-12 rounded-lg overflow-hidden mb-2 bg-os-bg-dark/50 flex items-center justify-center">
        {resource.thumbnail ? (
          <img
            src={resource.thumbnail}
            alt={resource.name}
            width={48}
            height={48}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to favicon on error
              const target = e.target as HTMLImageElement;
              if (faviconUrl) {
                target.src = faviconUrl;
              }
            }}
          />
        ) : faviconUrl ? (
          <img
            src={faviconUrl}
            alt={resource.name}
            width={32}
            height={32}
            loading="lazy"
            decoding="async"
            className="w-8 h-8"
            onError={(e) => {
              // Hide on error
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <Globe className="w-6 h-6 text-os-text-secondary-dark" />
        )}
      </div>

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
