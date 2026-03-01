import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getFaviconUrl, resolveLogoBg, type FaviconSize } from '@/lib/favicon';
import type { NormalizedResource } from '@/types/resource';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg';

interface ResourceLogoProps {
  resource: NormalizedResource;
  /** Visual size of the logo container */
  size?: LogoSize;
  /** Favicon resolution size */
  faviconSize?: FaviconSize;
  /** Additional className for the outer container */
  className?: string;
  /** Whether to show a border on the container */
  bordered?: boolean;
}

const SIZE_MAP: Record<LogoSize, { container: string; img: string; text: string }> = {
  xs: { container: 'w-6 h-6 rounded',     img: 'w-4 h-4',  text: 'text-[10px]' },
  sm: { container: 'w-8 h-8 rounded-md',   img: 'w-5 h-5',  text: 'text-xs' },
  md: { container: 'w-10 h-10 rounded-lg',  img: 'w-6 h-6',  text: 'text-sm' },
  lg: { container: 'w-12 h-12 rounded-lg',  img: 'w-8 h-8',  text: 'text-base' },
};

/**
 * ResourceLogo
 *
 * Renders a resource's logo with consistent container treatment,
 * intelligent background handling, and graceful fallback chain:
 * thumbnail → favicon → letter initial
 */
export function ResourceLogo({
  resource,
  size = 'md',
  faviconSize = 'md',
  className,
  bordered = true,
}: ResourceLogoProps) {
  const [imgError, setImgError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  const faviconUrl = getFaviconUrl(resource.url, faviconSize);
  const hasThumbnail = resource.thumbnail && !imgError;
  const hasFavicon = faviconUrl && !faviconError;
  const sizeConfig = SIZE_MAP[size];

  // Resolve background: explicit override > default container treatment
  const explicitBg = resolveLogoBg(resource.logoBg);

  const containerStyle = explicitBg ? { backgroundColor: explicitBg } : undefined;

  const containerClass = cn(
    sizeConfig.container,
    'flex items-center justify-center flex-shrink-0 overflow-hidden',
    !explicitBg && 'bg-[var(--bg-secondary)]/40',
    bordered && 'border border-[var(--border-secondary)]',
    className,
  );

  // 1. Thumbnail (full bleed)
  if (hasThumbnail) {
    return (
      <div className={containerClass} style={containerStyle}>
        <img
          src={resource.thumbnail!}
          alt={resource.name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // 2. Favicon (centered with padding)
  if (hasFavicon) {
    return (
      <div className={containerClass} style={containerStyle}>
        <img
          src={faviconUrl}
          alt={resource.name}
          className={cn(sizeConfig.img, 'object-contain')}
          loading="lazy"
          decoding="async"
          onError={() => setFaviconError(true)}
        />
      </div>
    );
  }

  // 3. Letter initial fallback
  const initial = resource.name.charAt(0).toUpperCase();
  return (
    <div className={containerClass} style={containerStyle}>
      <span className={cn(sizeConfig.text, 'font-medium text-[var(--fg-secondary)]')}>
        {initial}
      </span>
    </div>
  );
}
