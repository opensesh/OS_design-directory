/**
 * Orbital Layout Utilities
 *
 * Generates deterministic 3D positions for resources orbiting around
 * a central sphere. Uses Fibonacci sphere distribution for even spacing.
 * Higher gravity scores place resources closer to the center sphere.
 */

/**
 * Simple seeded random number generator
 * Creates deterministic "randomness" based on a string seed (resourceId)
 * So the same resource always appears in the same position
 */
function seededRandom(seed: string): () => number {
  // Convert string to a numeric hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Use the hash as a seed for a simple LCG (Linear Congruential Generator)
  let state = Math.abs(hash) || 1;

  return () => {
    // LCG parameters (same as glibc)
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Convert gravity score (1-10) to orbital radius
 * Higher scores = closer to center (smaller radius)
 *
 * Score 10.0 → radius 15 (closest to center)
 * Score 5.5  → radius 32.5 (middle)
 * Score 1.0  → radius 50 (furthest from center)
 */
export function scoreToRadius(
  score: number,
  minRadius: number = 15,
  maxRadius: number = 50
): number {
  // Clamp score to valid range
  const clamped = Math.max(1, Math.min(10, score));

  // Normalize to 0-1 range (inverted so higher score = smaller radius)
  const normalized = (clamped - 1) / 9;

  // Map to radius range (inverted: high score = low radius)
  return maxRadius - normalized * (maxRadius - minRadius);
}

/**
 * Radius ranges by score tier
 */
export const SCORE_TIERS = {
  'industry-leader': { min: 9.0, max: 10.0, radiusRange: [15, 18] as const },
  'excellent': { min: 7.5, max: 8.9, radiusRange: [18, 25] as const },
  'good': { min: 6.0, max: 7.4, radiusRange: [25, 35] as const },
  'niche': { min: 4.0, max: 5.9, radiusRange: [35, 45] as const },
  'limited': { min: 1.0, max: 3.9, radiusRange: [45, 50] as const },
} as const;

export type ScoreTier = keyof typeof SCORE_TIERS;

/**
 * Get the tier for a given gravity score
 */
export function getScoreTier(score: number): ScoreTier {
  if (score >= 9.0) return 'industry-leader';
  if (score >= 7.5) return 'excellent';
  if (score >= 6.0) return 'good';
  if (score >= 4.0) return 'niche';
  return 'limited';
}

/**
 * Tier labels for display
 */
export const TIER_LABELS: Record<ScoreTier, string> = {
  'industry-leader': 'Industry Leader',
  'excellent': 'Excellent',
  'good': 'Good',
  'niche': 'Niche',
  'limited': 'Limited',
};

/**
 * Position in 3D space
 */
export interface OrbitalPosition {
  x: number;
  y: number;
  z: number;
}

/**
 * Configuration for orbital positioning
 */
export interface OrbitalConfig {
  minRadius?: number;      // Minimum distance from center (default: 15)
  maxRadius?: number;      // Maximum distance from center (default: 50)
  flatness?: number;       // 0 = sphere, 1 = flat disk (default: 0.85)
  gravityScore?: number;   // Gravity score (1-10), higher = closer to center
  radiusVariance?: number; // Variance percentage for radius jitter (default: 0.05)
}

/**
 * Generates a deterministic 3D position for a resource in orbital space
 *
 * Uses Fibonacci sphere algorithm for base distribution, then applies
 * seeded randomness based on resourceId for radius variation.
 * This ensures:
 * - Even distribution across 3D space (Fibonacci sphere)
 * - Same resource always gets same position (seeded by ID)
 * - Natural-looking variation in orbital distances
 *
 * @param resourceId - Unique identifier for the resource (determines position)
 * @param index - Index in the resource array (for Fibonacci distribution)
 * @param totalResources - Total number of resources being positioned
 * @param config - Optional configuration for radius bounds
 * @returns Position { x, y, z } for the resource
 */
export function generateOrbitalPosition(
  resourceId: string,
  index: number,
  totalResources: number,
  config: OrbitalConfig = {}
): OrbitalPosition {
  const {
    minRadius = 15,
    maxRadius = 50,
    flatness = 0.85,
    gravityScore,
    radiusVariance = 0.05
  } = config;

  // Fibonacci sphere distribution for even spacing
  // Golden angle in radians
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  // Calculate position on unit sphere using Fibonacci lattice
  // y goes from 1 to -1 (top to bottom of sphere)
  // Apply flatness to compress Y-axis (0 = sphere, 1 = flat disk)
  const rawY = 1 - (index / (totalResources - 1)) * 2;
  const y = rawY * (1 - flatness);

  // Calculate radius at this y level (use rawY for proper spiral distribution)
  const radiusAtY = Math.sqrt(1 - rawY * rawY);

  // Theta is the angle around the y-axis
  const theta = goldenAngle * index;

  // Calculate x and z on the unit sphere
  const x = Math.cos(theta) * radiusAtY;
  const z = Math.sin(theta) * radiusAtY;

  // Normalize the flattened position to ensure consistent distance from center
  // Without this, flattening compresses Y without normalizing, causing some
  // nodes to end up closer to center than minRadius (inside the central sphere)
  const flatLength = Math.sqrt(x * x + y * y + z * z);
  const nx = x / flatLength;
  const ny = y / flatLength;
  const nz = z / flatLength;

  // Use seeded random for consistent variance
  const random = seededRandom(resourceId);

  // Calculate orbital radius based on gravity score or random distribution
  let radius: number;
  if (gravityScore !== undefined) {
    // Use gravity score to determine base radius
    radius = scoreToRadius(gravityScore, minRadius, maxRadius);

    // Add small variance for visual interest (seeded for consistency)
    const variance = radius * radiusVariance;
    radius += (random() - 0.5) * 2 * variance;

    // Clamp to valid range
    radius = Math.max(minRadius, Math.min(maxRadius, radius));
  } else {
    // Fallback: random radius within full range (legacy behavior)
    const radiusVariation = random(); // 0 to 1
    radius = minRadius + (maxRadius - minRadius) * radiusVariation;
  }

  // Scale the normalized position by the calculated radius
  // Every node is now exactly `radius` units from center
  return {
    x: nx * radius,
    y: ny * radius,
    z: nz * radius
  };
}

/**
 * Generates orbital positions for all resources at once
 *
 * @param resources - Array of resources with id property
 * @param config - Optional configuration for radius bounds
 * @returns Map of resource ID to position
 */
export function generateAllOrbitalPositions(
  resources: Array<{ id: string | number }>,
  config: OrbitalConfig = {}
): Map<string, OrbitalPosition> {
  const positions = new Map<string, OrbitalPosition>();
  const total = resources.length;

  resources.forEach((resource, index) => {
    const id = String(resource.id);
    const position = generateOrbitalPosition(id, index, total, config);
    positions.set(id, position);
  });

  return positions;
}

/**
 * Generates a Float32Array of positions for efficient Three.js rendering
 * Useful for InstancedMesh or BufferGeometry
 *
 * @param resources - Array of resources with id property
 * @param config - Optional configuration for radius bounds
 * @returns Float32Array with x,y,z positions packed sequentially
 */
export function generateOrbitalPositionsArray(
  resources: Array<{ id: string | number }>,
  config: OrbitalConfig = {}
): Float32Array {
  const total = resources.length;
  const positions = new Float32Array(total * 3);

  resources.forEach((resource, index) => {
    const id = String(resource.id);
    const pos = generateOrbitalPosition(id, index, total, config);

    positions[index * 3] = pos.x;
    positions[index * 3 + 1] = pos.y;
    positions[index * 3 + 2] = pos.z;
  });

  return positions;
}

// ============================================================
// Ring-Based Orbital Layout System
// ============================================================

/**
 * Ring configuration for a category
 */
export interface CategoryRingConfig {
  category: string;
  resourceCount: number;
  radius: number;
  color: string;
  ringIndex: number;
}

/**
 * Ring layout constants
 */
export const RING_LAYOUT = {
  MIN_RADIUS: 18,
  MAX_RADIUS: 50,
  CENTER_RADIUS: 10,
  TILT_ANGLE: Math.PI * 0.1, // ~18° tilt for NASA Eyes aesthetic
} as const;

/**
 * Calculate ring radii for each category based on resource count
 * Categories with fewer resources get inner (closer) rings
 *
 * @param resources - Array of resources with category property
 * @param categoryOrder - Ordered list of categories
 * @param categoryColors - Map of category to color hex
 * @returns Array of CategoryRingConfig sorted by ring radius
 */
export function calculateCategoryRings(
  resources: Array<{ category: string | null }>,
  categoryOrder: readonly string[],
  categoryColors: Record<string, string>
): CategoryRingConfig[] {
  // Count resources per category
  const categoryCounts = new Map<string, number>();

  for (const resource of resources) {
    const cat = resource.category || 'Other';
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  }

  // Filter to only categories that exist in the data
  const activeCategories = categoryOrder.filter(cat => categoryCounts.has(cat));

  // Sort by count (fewer = inner ring)
  const sortedCategories = [...activeCategories].sort((a, b) => {
    const countA = categoryCounts.get(a) || 0;
    const countB = categoryCounts.get(b) || 0;
    return countA - countB;
  });

  const ringCount = sortedCategories.length;
  if (ringCount === 0) return [];

  // Distribute rings evenly between min and max radius
  const radiusStep = ringCount > 1
    ? (RING_LAYOUT.MAX_RADIUS - RING_LAYOUT.MIN_RADIUS) / (ringCount - 1)
    : 0;

  return sortedCategories.map((category, index) => ({
    category,
    resourceCount: categoryCounts.get(category) || 0,
    radius: RING_LAYOUT.MIN_RADIUS + (radiusStep * index),
    color: categoryColors[category] || '#9CA3AF',
    ringIndex: index,
  }));
}

/**
 * Generate position for a resource on its category ring
 * Distributes resources with organic randomness around the ring
 *
 * @param resourceId - Unique identifier for consistent positioning
 * @param indexInCategory - Index of this resource within its category
 * @param totalInCategory - Total resources in this category
 * @param ringRadius - Radius of the category ring
 * @param tilt - Tilt angle in radians (default: ~18°)
 * @returns OrbitalPosition in 3D space
 */
export function generateRingPosition(
  resourceId: string,
  indexInCategory: number,
  totalInCategory: number,
  ringRadius: number,
  tilt: number = RING_LAYOUT.TILT_ANGLE
): OrbitalPosition {
  // Use seeded random for consistent positioning
  const random = seededRandom(resourceId);

  // Base angle: evenly distributed around the ring
  const baseAngle = (indexInCategory / totalInCategory) * Math.PI * 2;

  // Add larger random offset for organic look (±50% of spacing instead of ±5%)
  const spacing = Math.PI * 2 / totalInCategory;
  const angleOffset = (random() - 0.5) * spacing * 0.5;
  const angle = baseAngle + angleOffset;

  // Add radius jitter (±5%) so nodes aren't on a perfect circle
  const radiusJitter = 1 + (random() - 0.5) * 0.1;
  const jitteredRadius = ringRadius * radiusJitter;

  // Position on XZ plane (the ring)
  const x = Math.cos(angle) * jitteredRadius;
  const z = Math.sin(angle) * jitteredRadius;

  // Apply tilt around the X-axis
  // Tilted Y = original_y * cos(tilt) - original_z * sin(tilt)
  // Tilted Z = original_y * sin(tilt) + original_z * cos(tilt)
  // Since we start on XZ plane, original_y = 0
  const tiltedY = -z * Math.sin(tilt);
  const tiltedZ = z * Math.cos(tilt);

  // Add vertical scatter (±1.5 units) for more organic feel
  const yVariance = (random() - 0.5) * 3;

  return { x, y: tiltedY + yVariance, z: tiltedZ };
}

/**
 * Convert gravity score to size multiplier
 * Higher scores = larger nodes (more visual prominence)
 *
 * Uses steep power curve for dramatic high-score emphasis:
 * Score 1.0  → 0.40x (smallest)
 * Score 5.0  → 0.60x (medium)
 * Score 9.0  → 1.80x (very large)
 * Score 10.0 → 2.00x (largest)
 *
 * Ratio: Score 9 / Score 5 = 3x (triple size for high performers)
 *
 * @param score - Gravity score (1-10)
 * @returns Size multiplier (0.25 to 2.50)
 */
export function scoreToSizeMultiplier(score: number): number {
  // Clamp score to valid range
  const clamped = Math.max(1, Math.min(10, score));

  // Normalize to 0-1 range
  const normalized = (clamped - 1) / 9;

  // Very steep power curve for dramatic high-score emphasis
  // Score 1 → 0.25x, Score 5 → 0.46x, Score 9 → 2.24x, Score 10 → 2.50x
  // Using power of 2.5 for steeper curve (4.9x ratio between score 5 and 9)
  return 0.25 + Math.pow(normalized, 2.5) * 2.25;
}

/**
 * Build a lookup map for ring positions
 * Groups resources by category and calculates positions for all
 *
 * @param resources - Array of resources with id and category
 * @param ringConfigs - Category ring configurations
 * @returns Map of resource ID to position
 */
export function buildRingPositionMap(
  resources: Array<{ id: string | number; category: string | null }>,
  ringConfigs: CategoryRingConfig[]
): Map<string, OrbitalPosition> {
  const positions = new Map<string, OrbitalPosition>();

  // Create a lookup for ring config by category
  const ringByCategory = new Map<string, CategoryRingConfig>();
  for (const config of ringConfigs) {
    ringByCategory.set(config.category, config);
  }

  // Group resources by category
  const byCategory = new Map<string, Array<{ id: string | number; category: string | null }>>();
  for (const resource of resources) {
    const cat = resource.category || 'Other';
    if (!byCategory.has(cat)) {
      byCategory.set(cat, []);
    }
    byCategory.get(cat)!.push(resource);
  }

  // Calculate positions for each resource
  for (const [category, categoryResources] of byCategory) {
    const ringConfig = ringByCategory.get(category);
    if (!ringConfig) continue;

    categoryResources.forEach((resource, indexInCategory) => {
      const pos = generateRingPosition(
        String(resource.id),
        indexInCategory,
        categoryResources.length,
        ringConfig.radius
      );
      positions.set(String(resource.id), pos);
    });
  }

  return positions;
}

// ============================================================
// Galaxy Cluster Layout System
// ============================================================

/**
 * Category cluster configuration for galaxy layout
 */
export interface CategoryCluster {
  category: string;
  center: { x: number; y: number; z: number };
  radius: number;  // Cluster spread radius
  color: string;
  resourceCount: number;
}

/**
 * Galaxy layout constants
 */
export const GALAXY_LAYOUT = {
  MIN_CLUSTER_DISTANCE: 60,  // Minimum distance between cluster centers - increased for larger nodes
  MAX_CLUSTER_DISTANCE: 120,  // Maximum distance from origin for cluster centers
  BASE_CLUSTER_RADIUS: 15,   // Base radius for clusters
  MAX_CLUSTER_RADIUS: 25,    // Maximum cluster radius
  PLACEMENT_ATTEMPTS: 50,    // Max attempts to place a cluster before using best position
} as const;

/**
 * Seeded random for deterministic cluster placement
 */
function seededRandomCluster(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  let state = Math.abs(hash) || 1;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Calculate distance between two 3D points
 */
function distance3D(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate category clusters distributed in 3D space
 *
 * Algorithm:
 * 1. For each category, generate random position in 3D space
 * 2. Check distance to all existing cluster centers
 * 3. If too close (< minDistance), regenerate position
 * 4. Retry up to N times, then place at best available spot
 *
 * @param resources - Array of resources with category property
 * @param categoryOrder - Ordered list of categories
 * @param categoryColors - Map of category to color hex
 * @returns Array of CategoryCluster with 3D positions
 */
export function calculateCategoryClusters(
  resources: Array<{ category: string | null }>,
  categoryOrder: readonly string[],
  categoryColors: Record<string, string>
): CategoryCluster[] {
  // Count resources per category
  const categoryCounts = new Map<string, number>();
  for (const resource of resources) {
    const cat = resource.category || 'Other';
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  }

  // Filter to only categories that exist in the data
  const activeCategories = categoryOrder.filter(cat => categoryCounts.has(cat));

  if (activeCategories.length === 0) return [];

  const clusters: CategoryCluster[] = [];
  const placedCenters: Array<{ x: number; y: number; z: number }> = [];

  for (const category of activeCategories) {
    const resourceCount = categoryCounts.get(category) || 0;
    const random = seededRandomCluster(category);

    // Calculate cluster radius based on resource count (more resources = larger cluster)
    const countFactor = Math.min(1, resourceCount / 30); // Normalize to max 30 resources
    const clusterRadius = GALAXY_LAYOUT.BASE_CLUSTER_RADIUS +
      countFactor * (GALAXY_LAYOUT.MAX_CLUSTER_RADIUS - GALAXY_LAYOUT.BASE_CLUSTER_RADIUS);

    // Try to find a valid position
    let bestPosition = { x: 0, y: 0, z: 0 };
    let bestMinDistance = 0;

    for (let attempt = 0; attempt < GALAXY_LAYOUT.PLACEMENT_ATTEMPTS; attempt++) {
      // Generate random 3D position
      // Use spherical coordinates for even distribution
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const r = GALAXY_LAYOUT.MIN_CLUSTER_DISTANCE +
        random() * (GALAXY_LAYOUT.MAX_CLUSTER_DISTANCE - GALAXY_LAYOUT.MIN_CLUSTER_DISTANCE);

      const candidate = {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta) * 0.5, // Flatten Y for more disk-like galaxy
        z: r * Math.cos(phi),
      };

      // Check distance to all placed clusters
      let minDistToExisting = Infinity;
      for (const existing of placedCenters) {
        const dist = distance3D(candidate, existing);
        minDistToExisting = Math.min(minDistToExisting, dist);
      }

      // If no other clusters yet, or distance is valid, use this position
      if (placedCenters.length === 0 || minDistToExisting >= GALAXY_LAYOUT.MIN_CLUSTER_DISTANCE) {
        bestPosition = candidate;
        bestMinDistance = minDistToExisting;
        break;
      }

      // Track best position found so far
      if (minDistToExisting > bestMinDistance) {
        bestMinDistance = minDistToExisting;
        bestPosition = candidate;
      }
    }

    placedCenters.push(bestPosition);

    clusters.push({
      category,
      center: bestPosition,
      radius: clusterRadius,
      color: categoryColors[category] || '#9CA3AF',
      resourceCount,
    });
  }

  return clusters;
}

/**
 * Seeded Gaussian random for consistent cluster distribution
 */
function seededGaussian(random: () => number): number {
  const u1 = random();
  const u2 = random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
  return z0;
}

/**
 * Generate position for a resource within its category cluster
 * Uses Gaussian distribution for organic nebula-like appearance
 *
 * @param resourceId - Unique identifier for consistent positioning
 * @param cluster - The category cluster configuration
 * @returns OrbitalPosition in 3D space
 */
export function generateClusterPosition(
  resourceId: string,
  cluster: CategoryCluster
): OrbitalPosition {
  const random = seededRandom(resourceId);
  // Increased spread: was cluster.radius / 2.5, now / 1.6 for more spacing
  const stdDev = cluster.radius / 1.6;

  // Gaussian distribution for nebula-like clustering
  const offsetX = seededGaussian(random) * stdDev;
  const offsetY = seededGaussian(random) * stdDev * 0.7; // Slightly more Y spread
  const offsetZ = seededGaussian(random) * stdDev;

  return {
    x: cluster.center.x + offsetX,
    y: cluster.center.y + offsetY,
    z: cluster.center.z + offsetZ,
  };
}

/**
 * Build a lookup map for galaxy cluster positions
 * Groups resources by category and calculates positions within clusters
 *
 * @param resources - Array of resources with id and category
 * @param clusters - Category cluster configurations
 * @returns Map of resource ID to position
 */
export function buildGalaxyPositionMap(
  resources: Array<{ id: string | number; category: string | null }>,
  clusters: CategoryCluster[]
): Map<string, OrbitalPosition> {
  const positions = new Map<string, OrbitalPosition>();

  // Create a lookup for cluster by category
  const clusterByCategory = new Map<string, CategoryCluster>();
  for (const cluster of clusters) {
    clusterByCategory.set(cluster.category, cluster);
  }

  // Calculate positions for each resource
  for (const resource of resources) {
    const cat = resource.category || 'Other';
    const cluster = clusterByCategory.get(cat);

    if (cluster) {
      const pos = generateClusterPosition(String(resource.id), cluster);
      positions.set(String(resource.id), pos);
    } else {
      // Fallback: position at origin if no cluster found
      positions.set(String(resource.id), { x: 0, y: 0, z: 0 });
    }
  }

  return positions;
}

/**
 * Calculate bounding sphere for a set of positions
 * Used for camera animation to encompass filtered nodes
 *
 * @param positions - Array of 3D positions
 * @returns Center point and radius of bounding sphere
 */
export function calculateBoundingSphere(
  positions: Array<{ x: number; y: number; z: number }>
): { center: { x: number; y: number; z: number }; radius: number } {
  if (positions.length === 0) {
    return { center: { x: 0, y: 0, z: 0 }, radius: 50 };
  }

  // Calculate centroid
  let sumX = 0, sumY = 0, sumZ = 0;
  for (const pos of positions) {
    sumX += pos.x;
    sumY += pos.y;
    sumZ += pos.z;
  }
  const center = {
    x: sumX / positions.length,
    y: sumY / positions.length,
    z: sumZ / positions.length,
  };

  // Calculate maximum distance from centroid
  let maxDistance = 0;
  for (const pos of positions) {
    const dist = distance3D(pos, center);
    maxDistance = Math.max(maxDistance, dist);
  }

  // Add padding to ensure all nodes are visible
  return { center, radius: maxDistance + 10 };
}
