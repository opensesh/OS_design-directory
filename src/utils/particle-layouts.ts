/**
 * Generates positions for Fibonacci sphere distribution
 * Uses golden angle spiral for even distribution
 */
export function generateSphereLayout(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.399963

  for (let i = 0; i < count; i++) {
    // Fibonacci sphere algorithm
    const y = 1 - (i / (count - 1)) * 2; // Range [-1, 1]
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;

    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    // Scale by radius
    positions[i * 3] = x * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = z * radius;
  }

  return positions;
}

/**
 * Generates positions for spiral galaxy with 3 arms
 */
export function generateGalaxyLayout(count: number, maxRadius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const arms = 3;
  const spinFactor = 3;

  for (let i = 0; i < count; i++) {
    const t = i / count; // 0 to 1
    const radius = t * maxRadius;
    const angle = t * Math.PI * 2 * arms * spinFactor;

    // Randomness for natural look
    const randomRadius = radius * (0.9 + Math.random() * 0.2);
    const randomAngle = angle + (Math.random() - 0.5) * 0.5;

    positions[i * 3] = Math.cos(randomAngle) * randomRadius;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2; // Thin disc
    positions[i * 3 + 2] = Math.sin(randomAngle) * randomRadius;
  }

  return positions;
}

/**
 * Generates positions for grid layout
 */
export function generateGridLayout(count: number, spacing: number = 2): Float32Array {
  const positions = new Float32Array(count * 3);
  const columns = Math.ceil(Math.sqrt(count));

  for (let i = 0; i < count; i++) {
    const x = (i % columns) * spacing - (columns * spacing) / 2;
    const y = Math.floor(i / columns) * spacing - (Math.floor(count / columns) * spacing) / 2;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = 0;
  }

  return positions;
}

/**
 * Box-Muller transform for Gaussian random numbers
 */
function gaussianRandom(mean: number = 0, stdDev: number = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Generates positions for nebula/cloud distribution
 * Uses Gaussian distribution for organic cloud-like appearance
 */
export function generateNebulaLayout(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const stdDev = radius / 2.5;

  for (let i = 0; i < count; i++) {
    // Gaussian distribution in all 3 axes for cloud effect
    let x = gaussianRandom(0, stdDev);
    let y = gaussianRandom(0, stdDev);
    let z = gaussianRandom(0, stdDev);

    // Add some turbulence/clustering
    const clusterChance = Math.random();
    if (clusterChance > 0.7) {
      // Create denser pockets
      const clusterOffset = {
        x: gaussianRandom(0, radius * 0.3),
        y: gaussianRandom(0, radius * 0.3),
        z: gaussianRandom(0, radius * 0.3),
      };
      x += clusterOffset.x;
      y += clusterOffset.y;
      z += clusterOffset.z;
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  return positions;
}

/**
 * Generates positions for starfield - sparse 3D scatter
 * Creates a deep space feel with varying densities
 */
export function generateStarfieldLayout(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const depth = radius * 3; // Extended depth for star field effect

  for (let i = 0; i < count; i++) {
    // Random spherical distribution but stretched on Z axis
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    // Variable radius for depth variation
    const r = Math.pow(Math.random(), 0.5) * radius;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    // Stretch z for deeper field
    const z = (Math.random() - 0.5) * depth;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  return positions;
}

/**
 * Generates positions for vortex/tornado spiral
 * Creates a swirling funnel effect
 */
export function generateVortexLayout(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const height = radius * 2;
  const spiralTightness = 4;

  for (let i = 0; i < count; i++) {
    const t = i / count;

    // Height goes from bottom to top
    const y = (t - 0.5) * height;

    // Radius increases from bottom (tight) to top (wide)
    // Creates funnel shape
    const radiusAtHeight = radius * (0.1 + t * 0.9);

    // Spiral angle increases with height
    const angle = t * Math.PI * 2 * spiralTightness;

    // Add randomness for organic look
    const randomRadius = radiusAtHeight * (0.8 + Math.random() * 0.4);
    const randomAngle = angle + (Math.random() - 0.5) * 0.8;

    const x = Math.cos(randomAngle) * randomRadius;
    const z = Math.sin(randomAngle) * randomRadius;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  return positions;
}
