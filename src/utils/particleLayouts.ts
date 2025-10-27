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
