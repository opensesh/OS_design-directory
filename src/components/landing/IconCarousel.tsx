import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASING, DURATION } from '@/lib/motion-tokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getCategoryColor } from '@/types/resource';
import type { NormalizedResource } from '@/types/resource';

interface IconCarouselProps {
  resources: NormalizedResource[];
  /** Duration of each icon display in ms */
  interval?: number;
}

/**
 * Extracts the domain from a URL for favicon lookup.
 */
function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * IconCarousel
 *
 * Vertically rotating favicon carousel showing top-rated resources.
 * Each icon sits in a rounded-square container colored by category.
 * The rotation has a "flipping toward you" 3D perspective effect.
 */
export function IconCarousel({ resources, interval = 2500 }: IconCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Preload all favicons on mount
  useEffect(() => {
    resources.forEach((r) => {
      const img = new Image();
      img.src = `https://www.google.com/s2/favicons?domain=${getDomain(r.url)}&sz=64`;
    });
  }, [resources]);

  // Auto-rotate
  useEffect(() => {
    if (resources.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % resources.length);
    }, interval);
    return () => clearInterval(timer);
  }, [resources.length, interval]);

  const resource = resources[currentIndex];
  if (!resource) return null;

  const categoryColor = getCategoryColor(resource.category);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${getDomain(resource.url)}&sz=64`;

  return (
    <div
      className="relative w-16 h-16 md:w-20 md:h-20 overflow-hidden"
      style={{ perspective: '600px' }}
      aria-live="polite"
      aria-label="Featured design resources"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { y: '100%', opacity: 0, rotateX: -30 }
          }
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : { y: 0, opacity: 1, rotateX: 0 }
          }
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { y: '-100%', opacity: 0, rotateX: 30 }
          }
          transition={{
            duration: prefersReducedMotion ? DURATION.fast : 0.5,
            ease: EASING.spring,
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div
            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `${categoryColor}20`, border: `1px solid ${categoryColor}30` }}
          >
            <FaviconImage
              src={faviconUrl}
              alt={resource.name}
              fallbackName={resource.name}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Favicon image with letter-initial fallback.
 */
function FaviconImage({
  src,
  alt,
  fallbackName,
}: {
  src: string;
  alt: string;
  fallbackName: string;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-sm font-semibold text-[var(--fg-primary)]">
        {fallbackName.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-8 h-8 md:w-10 md:h-10 rounded-lg"
      loading="eager"
      onError={() => setError(true)}
    />
  );
}
