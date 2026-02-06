import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NormalizedResource } from '../../types/resource';
import { CATEGORY_COLORS, DEFAULT_COLOR } from '../../types/resource';
import { GravityScoreBadge } from './GravityScoreBadge';

/**
 * Get favicon URL for a given website URL
 * Uses Google's favicon service as a reliable fallback
 */
function getFaviconUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    // Use Google's favicon service - reliable and fast
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}

interface InspoResourceTooltipProps {
  onClick?: (resource: NormalizedResource) => void;
  resource: NormalizedResource | null;
  mousePosition: { x: number; y: number };
}

/**
 * InspoResourceTooltip
 *
 * Card-style tooltip that follows the cursor and displays resource details.
 * Includes favicon, category badge, and description.
 */
export default function InspoResourceTooltip({
  onClick,
  resource,
  mousePosition,
}: InspoResourceTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0 });

  // Offset from cursor
  const OFFSET_X = 20;
  const OFFSET_Y = 20;

  // Calculate position with viewport edge detection
  useEffect(() => {
    if (!resource) return;

    requestAnimationFrame(() => {
      if (!tooltipRef.current) {
        setAdjustedPosition({ x: mousePosition.x + OFFSET_X, y: mousePosition.y + OFFSET_Y });
        return;
      }

      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = mousePosition.x + OFFSET_X;
      let y = mousePosition.y + OFFSET_Y;

      // Prevent overflow on right edge
      if (x + rect.width > viewportWidth - 20) {
        x = mousePosition.x - rect.width - OFFSET_X;
      }

      // Prevent overflow on bottom edge
      if (y + rect.height > viewportHeight - 20) {
        y = mousePosition.y - rect.height - OFFSET_Y;
      }

      // Ensure not off-screen on left/top
      x = Math.max(20, x);
      y = Math.max(20, y);

      setAdjustedPosition({ x, y });
    });
  }, [mousePosition, resource]);

  const categoryColor = resource?.category
    ? CATEGORY_COLORS[resource.category] || DEFAULT_COLOR
    : DEFAULT_COLOR;

  // Get favicon URL
  const faviconUrl = resource ? getFaviconUrl(resource.url) : null;

  // Truncate description to 100 chars
  const truncatedDescription = resource?.description
    ? resource.description.length > 100
      ? resource.description.slice(0, 100) + '...'
      : resource.description
    : null;

  return (
    <AnimatePresence>
      {resource && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.95, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 5 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed z-[256] pointer-events-auto cursor-pointer"
          onClick={() => resource && onClick?.(resource)}
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
          }}
        >
          {/* Card Container */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg p-4 shadow-xl max-w-xs">
            {/* Header with Favicon and Title */}
            <div className="flex items-start gap-3 mb-3">
              {/* Favicon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-[var(--bg-tertiary)]"
                style={{
                  borderColor: categoryColor,
                  borderWidth: '2px',
                  borderStyle: 'solid'
                }}
              >
                {faviconUrl ? (
                  <img
                    src={faviconUrl}
                    alt=""
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      // Hide broken image
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColor }}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Title */}
                <h3 className="text-[var(--fg-primary)] font-semibold text-base leading-tight">
                  {resource.name}
                </h3>

                {/* Badges row */}
                <div className="flex items-center gap-2 mt-1.5">
                  {/* Category Badge */}
                  <span
                    className="inline-flex items-center text-xs px-2 py-0.5 rounded-full text-white/90"
                    style={{ backgroundColor: categoryColor }}
                  >
                    {resource.category || 'Uncategorized'}
                  </span>

                  {/* Gravity Score Badge */}
                  {resource.gravityScore && (
                    <GravityScoreBadge
                      score={resource.gravityScore}
                      rationale={resource.gravityRationale}
                      size="sm"
                      showTooltip={false}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {truncatedDescription && (
              <p className="text-[var(--fg-secondary)] text-sm leading-relaxed">
                {truncatedDescription}
              </p>
            )}

            {/* Click hint */}
            <p className="text-[var(--fg-tertiary)] text-xs mt-3 pt-2 border-t border-[var(--border-secondary)]">
              Click to view details →
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
