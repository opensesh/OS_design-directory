import { memo, forwardRef, useState } from 'react';
import { Globe } from 'lucide-react';
import { getFaviconUrl, resolveLogoBg } from '@/lib/favicon';
import type { NormalizedResource } from '@/types/resource';

interface OrbitIconProps {
  resource: NormalizedResource;
  size: number;
  ringGlowColor: string;
}

/**
 * A single orbiting icon. Renders the resource favicon inside a circular
 * container styled to match its ring's glow color. Uses direct favicon
 * rendering (not ResourceLogo) to avoid container-size conflicts at
 * small orbit sizes.
 */
export const OrbitIcon = memo(
  forwardRef<HTMLDivElement, OrbitIconProps>(function OrbitIcon(
    { resource, size, ringGlowColor },
    ref,
  ) {
    const [imgError, setImgError] = useState(false);
    const faviconUrl = getFaviconUrl(resource.url, 'sm');
    const hasFavicon = faviconUrl && !imgError;
    const explicitBg = resolveLogoBg(resource.logoBg);
    const imgSize = Math.round(size * 0.55);

    return (
      <div
        ref={ref}
        className="absolute left-1/2 top-1/2 will-change-transform"
        style={{
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
        }}
        title={resource.name}
      >
        <div
          className="w-full h-full rounded-full overflow-hidden border flex items-center justify-center"
          style={{
            backgroundColor: explicitBg || '#1C1C1C',
            borderColor: `${ringGlowColor}40`,
            boxShadow: `0 0 8px ${ringGlowColor}20`,
          }}
        >
          {hasFavicon ? (
            <img
              src={faviconUrl}
              alt={resource.name}
              width={imgSize}
              height={imgSize}
              className="object-contain"
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          ) : (
            <Globe
              size={imgSize}
              className="text-[var(--fg-tertiary)]"
              strokeWidth={1.5}
            />
          )}
        </div>
      </div>
    );
  }),
);
