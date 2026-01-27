import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { NormalizedResource } from '../../types/resource';

// Get favicon URL from domain using Google's service
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return '';
  }
}

// Compact thumbnail for mobile cards
function MobileThumbnail({ resource }: { resource: NormalizedResource }) {
  const [imgError, setImgError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  const faviconUrl = getFaviconUrl(resource.url);
  const hasThumbnail = resource.thumbnail && !imgError;
  const hasFavicon = faviconUrl && !faviconError;

  // Fallback: colored initial
  if (!hasThumbnail && !hasFavicon) {
    const initial = resource.name.charAt(0).toUpperCase();
    return (
      <div className="w-10 h-10 rounded-lg bg-os-surface-dark border border-os-border-dark flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-os-text-secondary-dark">{initial}</span>
      </div>
    );
  }

  // Show thumbnail if available
  if (hasThumbnail) {
    return (
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-os-surface-dark border border-os-border-dark flex-shrink-0">
        <img
          src={resource.thumbnail!}
          alt={resource.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback to favicon
  return (
    <div className="w-10 h-10 rounded-lg overflow-hidden bg-os-surface-dark border border-os-border-dark flex items-center justify-center flex-shrink-0">
      <img
        src={faviconUrl}
        alt={resource.name}
        className="w-6 h-6 object-contain"
        onError={() => setFaviconError(true)}
      />
    </div>
  );
}

interface MobileResourceCardProps {
  resource: NormalizedResource;
  onClick: () => void;
}

export function MobileResourceCard({ resource, onClick }: MobileResourceCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-os-bg-dark border-b border-os-border-dark/50 active:bg-os-surface-dark/30 transition-colors cursor-pointer"
    >
      {/* Thumbnail */}
      <MobileThumbnail resource={resource} />

      {/* Name - flex-shrink allowed, truncate */}
      <h3 className="font-medium text-sm text-os-text-primary-dark truncate min-w-0 flex-1 xs:flex-none xs:w-auto">
        {resource.name}
      </h3>

      {/* Category + Subcategory - hidden on very small, visible on xs+ */}
      <p className="hidden xs:block text-xs text-os-text-secondary-dark truncate whitespace-nowrap">
        {resource.category}
        {resource.subCategory && (
          <>
            <span className="mx-1">•</span>
            {resource.subCategory}
          </>
        )}
      </p>

      {/* Pricing Badge - hidden on very small, visible on xs+ */}
      {resource.pricing && (
        <span className="hidden xs:inline-flex shrink-0 items-center px-2 py-0.5 rounded bg-os-surface-dark text-[10px] font-accent font-bold uppercase text-os-text-primary-dark border border-os-border-dark">
          {resource.pricing}
        </span>
      )}

      {/* Very small viewport fallback - stack category and pricing below name */}
      <div className="xs:hidden flex flex-col gap-0.5">
        <p className="text-xs text-os-text-secondary-dark truncate">
          {resource.category}
          {resource.subCategory && (
            <>
              <span className="mx-1">•</span>
              {resource.subCategory}
            </>
          )}
        </p>
        {resource.pricing && (
          <span className="inline-flex w-fit px-2 py-0.5 rounded bg-os-surface-dark text-[10px] font-accent font-bold uppercase text-os-text-primary-dark border border-os-border-dark">
            {resource.pricing}
          </span>
        )}
      </div>

      {/* External Link Button */}
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-os-surface-dark border border-os-border-dark text-os-text-secondary-dark active:text-brand-aperol active:border-brand-aperol/30 transition-all"
        title={`Visit ${resource.name}`}
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
