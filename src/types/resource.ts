/**
 * Types for Resource Discovery
 * Defines the data structures for the inspiration resource visualization
 */

/**
 * Normalized resource type for component use (camelCase keys)
 */
export interface NormalizedResource {
  id: number;
  name: string;
  url: string;
  description: string | null;
  category: string | null;
  subCategory: string | null;
  pricing: string | null;
  featured: boolean;
  opensource: boolean;
  tags: string[] | null;
  count: string | null;
  tier: number | null;
  thumbnail: string | null;
  screenshot: string | null;
  /** Gravity score (1.0-10.0), higher = closer to center in 3D view */
  gravityScore: number;
  /** Brief explanation for the score (50 chars max) */
  gravityRationale?: string;
}

/**
 * Category ordering for ring layout
 * Inner rings (fewer resources) to outer rings (more resources)
 */
export const CATEGORY_ORDER = [
  'Community',
  'Inspiration',
  'Learning',
  'Templates',
  'Tools',
  'AI',
] as const;

export type CategoryName = (typeof CATEGORY_ORDER)[number];

/**
 * Category Color Mapping
 */
export const CATEGORY_COLORS: Record<string, string> = {
  'Community': '#3B82F6',
  'Inspiration': '#FF5102',
  'Learning': '#10B981',
  'Templates': '#F59E0B',
  'Tools': '#EC4899',
  'AI': '#06B6D4',
};

export const DEFAULT_COLOR = '#9CA3AF';

/**
 * Get color for a category
 */
export function getCategoryColor(category: string | null): string {
  if (!category) return DEFAULT_COLOR;
  return CATEGORY_COLORS[category] || DEFAULT_COLOR;
}
