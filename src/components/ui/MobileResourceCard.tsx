import { GravityScoreBadge } from './GravityScoreBadge';
import { ResourceLogo } from './ResourceLogo';
import type { NormalizedResource } from '../../types/resource';

interface MobileResourceCardProps {
  resource: NormalizedResource;
  onClick: () => void;
}

export function MobileResourceCard({ resource, onClick }: MobileResourceCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-os-bg-dark border-b border-[var(--border-secondary)] active:bg-os-surface-dark/30 transition-colors cursor-pointer"
    >
      {/* Column 1: Thumbnail (fixed width) */}
      <ResourceLogo resource={resource} size="md" />

      {/* Column 2: Name + Category below (flex-grow) */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm text-os-text-primary-dark truncate">
          {resource.name}
        </h3>
        <p className="text-xs text-os-text-secondary-dark truncate mt-0.5">
          {resource.category}
          {resource.subCategory && (
            <>
              <span className="mx-1">•</span>
              {resource.subCategory}
            </>
          )}
        </p>
      </div>

      {/* Column 3: Pricing chip (fixed width, right-aligned) */}
      <div className="shrink-0 w-20 flex justify-end">
        {resource.pricing && (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-os-surface-dark text-[10px] font-accent font-bold uppercase text-os-text-primary-dark border border-[var(--border-secondary)]">
            {resource.pricing}
          </span>
        )}
      </div>

      {/* Column 4: Rating (fixed width) */}
      <div className="shrink-0 flex items-center justify-center">
        {resource.gravityScore ? (
          <GravityScoreBadge
            score={resource.gravityScore}
            size="sm"
            showTooltip={false}
          />
        ) : (
          <span className="text-xs text-os-text-secondary-dark">-</span>
        )}
      </div>
    </div>
  );
}
