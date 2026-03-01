/**
 * Centralized favicon utilities for consistent resource logo rendering.
 *
 * Single source of truth for favicon URL generation, size presets,
 * and logo background resolution logic.
 */

/** Favicon size presets matching usage contexts */
export const FAVICON_SIZE = {
  /** Tooltips, small inline contexts */
  sm: 32,
  /** Table rows, search results, mobile cards */
  md: 64,
  /** Card view, detail page hero */
  lg: 128,
} as const;

export type FaviconSize = keyof typeof FAVICON_SIZE;

/**
 * Get Google favicon URL for a domain.
 * Returns null if URL is invalid.
 */
export function getFaviconUrl(
  url: string | null,
  size: FaviconSize = 'md',
): string | null {
  if (!url) return null;
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${FAVICON_SIZE[size]}`;
  } catch {
    return null;
  }
}

/** Preset background values for logo containers */
const LOGO_BG_PRESETS: Record<string, string> = {
  light: '#F5F3F0',
  dark: '#1C1C1C',
};

/**
 * Resolve the background color for a logo container.
 *
 * @param logoBg - The logoBg field from resource data
 * @returns CSS-ready background color string, or null for default treatment
 */
export function resolveLogoBg(logoBg: string | null | undefined): string | null {
  if (!logoBg) return null;
  return LOGO_BG_PRESETS[logoBg] ?? logoBg;
}
