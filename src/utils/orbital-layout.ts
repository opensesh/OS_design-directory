/**
 * Orbital Layout Utilities
 *
 * Generates deterministic 3D positions for resources orbiting around
 * a central sphere. Uses Fibonacci sphere distribution for even spacing.
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
  minRadius?: number;  // Minimum distance from center (default: 15)
  maxRadius?: number;  // Maximum distance from center (default: 50)
  flatness?: number;   // 0 = sphere, 1 = flat disk (default: 0.85)
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
  const { minRadius = 15, maxRadius = 50, flatness = 0.85 } = config;

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

  // Use seeded random to determine orbital radius for this specific resource
  // This creates variation in distance while keeping same resource at same distance
  const random = seededRandom(resourceId);
  const radiusVariation = random(); // 0 to 1

  // Interpolate between min and max radius
  const radius = minRadius + (maxRadius - minRadius) * radiusVariation;

  // Scale the normalized position by the calculated radius
  // Every node is now exactly `radius` units from center (between minRadius and maxRadius)
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
