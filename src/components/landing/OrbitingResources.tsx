import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getFaviconUrl } from '@/lib/favicon';
import { OrbitIcon } from './OrbitIcon';
import {
  RING_CONFIGS,
  BASE_CONTAINER_SIZE,
  RESPONSIVE_BREAKPOINTS,
  RESPONSIVE_SCALES,
  distributeResources,
} from './orbit-config';
import type { NormalizedResource } from '@/types/resource';

/* ─── OS Monogram SVG (vanilla fill) ─── */

function BrandMonogram({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M235.792 155.669C234.317 152.587 232.568 150.162 230.565 148.375C228.553 146.589 225.808 145.028 222.32 143.674C218.832 142.329 215.784 141.377 213.185 140.837C210.586 140.297 207.274 139.708 203.259 139.06C202.312 138.952 201.071 138.766 199.537 138.491C198.003 138.226 196.792 138 195.903 137.843C195.014 137.676 193.89 137.49 192.532 137.274C191.174 137.058 190.109 136.842 189.337 136.626C188.566 136.41 187.706 136.135 186.768 135.811C185.82 135.487 185.088 135.163 184.55 134.839C184.023 134.515 183.485 134.142 182.958 133.71C182.43 133.279 182.04 132.788 181.805 132.248C181.571 131.708 181.453 131.109 181.453 130.461C181.453 127.978 182.606 126.083 184.912 124.788C187.217 123.492 190.256 122.844 194.046 122.844C201.041 122.844 205.545 124.915 207.548 129.067C208.554 131.148 210.557 132.572 212.863 132.572H235.186C234.473 124.258 230.634 117.74 223.658 113.048C216.683 108.346 206.874 106 194.222 106C182.987 106 173.657 108.326 166.203 112.969C159.11 117.396 155.398 123.541 155.066 131.394C152.848 126.663 149.702 122.383 145.599 118.555C136.679 110.24 125.004 106.079 110.584 106.079C96.1644 106.079 84.4604 110.24 75.4723 118.555C66.494 126.879 62 137.352 62 149.995C62 162.638 66.494 173.112 75.4723 181.436C84.4506 189.76 96.1547 193.912 110.575 193.912C124.995 193.912 136.669 189.75 145.589 181.436C148.901 178.353 151.588 174.977 153.669 171.296C155.447 177.313 159.227 182.27 165.031 186.137C172.885 191.379 183.437 194 196.684 194C208.974 194 218.939 191.625 226.56 186.874C234.18 182.123 238 175.31 238 166.456C238 162.353 237.258 158.761 235.782 155.679L235.792 155.669ZM124.682 131.6C127.75 135.791 129.41 141.269 129.684 148.012C121.321 145.578 115.811 137.519 112.773 124.837C117.785 125.367 121.761 127.615 124.682 131.6ZM108.328 124.817C105.289 137.755 99.701 145.833 91.3089 148.052C91.5727 141.19 93.1944 135.674 96.223 131.531C99.1442 127.526 103.189 125.288 108.328 124.827V124.817ZM96.223 168.302C92.9111 163.767 91.2601 157.661 91.2601 149.995C91.2601 149.809 91.2698 149.642 91.2698 149.465C100.141 152.007 105.534 160.92 108.279 175.006C103.159 174.535 99.1344 172.297 96.223 168.302ZM124.682 168.302C121.653 172.375 117.501 174.604 112.235 175.016C115.166 160.891 120.921 151.85 129.713 149.436C129.713 149.622 129.733 149.799 129.733 149.985C129.733 157.661 128.053 163.757 124.682 168.292V168.302ZM206.893 174.623C204.353 176.076 200.895 176.812 196.518 176.812C188.146 176.812 182.889 173.966 180.76 168.263C179.9 165.956 177.614 164.503 175.152 164.503H156.707C158.221 160.037 158.983 155.207 158.983 150.005C158.983 148.601 158.915 147.217 158.807 145.863C159.716 147.217 160.732 148.395 161.855 149.357C163.809 151.036 166.349 152.518 169.476 153.813C172.612 155.109 175.474 156.061 178.073 156.65C180.672 157.249 183.866 157.809 187.647 158.348C188.478 158.456 189.777 158.643 191.545 158.918C193.314 159.193 194.613 159.409 195.443 159.566C196.264 159.733 197.417 159.948 198.902 160.213C200.377 160.488 201.501 160.724 202.272 160.94C203.044 161.156 203.953 161.45 205.018 161.833C206.083 162.216 206.884 162.618 207.411 163.05C207.939 163.482 208.505 163.973 209.092 164.513C209.678 165.053 210.098 165.652 210.332 166.299C210.567 166.947 210.684 167.703 210.684 168.567C210.684 171.158 209.414 173.19 206.874 174.643L206.893 174.623Z"
        fill="#FFFAEE"
      />
    </svg>
  );
}

/* ─── Props ─── */

interface OrbitingResourcesProps {
  resources: NormalizedResource[];
}

/* ─── Main Component ─── */

export function OrbitingResources({ resources }: OrbitingResourcesProps) {
  const prefersReducedMotion = useReducedMotion();
  const [scale, setScale] = useState(1);
  const animationRef = useRef(0);
  const timeRef = useRef(0);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Distribute resources across rings
  const iconConfigs = useMemo(
    () => distributeResources(resources),
    [resources],
  );

  // Responsive scale
  const updateScale = useCallback(() => {
    const w = window.innerWidth;
    if (w < RESPONSIVE_BREAKPOINTS.sm) setScale(RESPONSIVE_SCALES.sm);
    else if (w < RESPONSIVE_BREAKPOINTS.lg) setScale(RESPONSIVE_SCALES.md);
    else setScale(RESPONSIVE_SCALES.lg);
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  // Preload favicons
  useEffect(() => {
    iconConfigs.forEach(({ resource }) => {
      const url = getFaviconUrl(resource.url, 'sm');
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [iconConfigs]);

  // Place icons at static positions (used for reduced motion & initial frame)
  const placeIcons = useCallback(
    (time: number) => {
      let idx = 0;
      for (const ring of RING_CONFIGS) {
        const r = ring.radius * scale;
        for (let i = 0; i < ring.count; i++) {
          const phase = (2 * Math.PI * i) / ring.count;
          const angle = time * ring.speed + phase;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          const el = iconRefs.current[idx];
          if (el) el.style.transform = `translate(${x}px, ${y}px)`;
          idx++;
        }
      }
    },
    [scale],
  );

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion) {
      placeIcons(0);
      return;
    }

    let last = 0;

    const tick = (ts: number) => {
      if (!last) last = ts;
      const dt = (ts - last) / 1000;
      last = ts;
      timeRef.current += dt;
      placeIcons(timeRef.current);
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationRef.current);
  }, [prefersReducedMotion, placeIcons]);

  const containerSize = BASE_CONTAINER_SIZE * scale;
  const center = containerSize / 2;

  return (
    <div
      className="relative"
      style={{ width: containerSize, height: containerSize }}
      role="img"
      aria-label="Top design resources orbiting around the Open Session logo"
    >
      {/* Ring paths + glow */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${containerSize} ${containerSize}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          {RING_CONFIGS.map((ring, i) => (
            <radialGradient
              key={i}
              id={`ring-glow-${i}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop
                offset="0%"
                stopColor={ring.glowColor}
                stopOpacity={ring.strokeOpacity * 0.6}
              />
              <stop
                offset="100%"
                stopColor={ring.glowColor}
                stopOpacity={0}
              />
            </radialGradient>
          ))}
        </defs>

        {RING_CONFIGS.map((ring, i) => {
          const r = ring.radius * scale;
          return (
            <g key={i}>
              {/* Ambient glow disc */}
              <circle
                cx={center}
                cy={center}
                r={r + 12 * scale}
                fill={`url(#ring-glow-${i})`}
                opacity={0.5}
              />
              {/* Ring stroke */}
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={ring.glowColor}
                strokeWidth={1}
                strokeOpacity={ring.strokeOpacity * 0.4}
                strokeDasharray="4 8"
                shapeRendering="geometricPrecision"
              />
            </g>
          );
        })}
      </svg>

      {/* Center glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="rounded-full"
          style={{
            width: 80 * scale,
            height: 80 * scale,
            background:
              'radial-gradient(circle, rgba(254,81,2,0.12) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Center logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <BrandMonogram size={Math.round(48 * scale)} />
      </div>

      {/* Orbiting icons */}
      {iconConfigs.map((config, i) => (
        <OrbitIcon
          key={config.resource.id ?? config.resource.name}
          ref={(el) => {
            iconRefs.current[i] = el;
          }}
          resource={config.resource}
          size={Math.round(config.size * scale)}
          ringGlowColor={RING_CONFIGS[config.ring].glowColor}
        />
      ))}
    </div>
  );
}
