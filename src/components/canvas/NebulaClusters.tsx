import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CategoryCluster } from '../../utils/orbital-layout';

/**
 * Animation configuration for particle nebulas
 */
const ANIMATION = {
  OPACITY_LERP_SPEED: 0.08,
  DEFAULT_OPACITY: 0.6,
  ACTIVE_OPACITY: 0.85,
  MATCHED_OPACITY: 0.7,
  INACTIVE_OPACITY: 0.25,
};

/**
 * Particle count for nebula clouds
 */
const PARTICLE_COUNT = 2500;

/**
 * Seeded random number generator for deterministic particle positions
 */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return function() {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 4294967296;
  };
}

interface ParticleNebulaProps {
  cluster: CategoryCluster;
  isActive: boolean;
  isMatched: boolean;
  hasAnyFilter: boolean;
  globalOpacity: number;
}

/**
 * ParticleNebula - Organic particle cloud around a category cluster
 *
 * Uses Points-based geometry with Gaussian distribution for organic,
 * cloud-like appearance. Particles are denser near center and sparse at edges.
 */
function ParticleNebula({ 
  cluster, 
  isActive, 
  isMatched, 
  hasAnyFilter,
  globalOpacity,
}: ParticleNebulaProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const currentOpacityRef = useRef(ANIMATION.DEFAULT_OPACITY);
  const pulsePhaseRef = useRef(Math.random() * Math.PI * 2);

  // Generate particle positions with Gaussian distribution
  const { positions, sizes, baseOpacities } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const baseOpacities = new Float32Array(PARTICLE_COUNT);

    const random = seededRandom(cluster.category);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Box-Muller transform for Gaussian distribution
      const u1 = random() || 0.0001;
      const u2 = random();
      const u3 = random() || 0.0001;
      const u4 = random();

      // Standard deviation based on cluster radius
      const stdDev = cluster.radius * 0.6;

      // Gaussian distributed offsets
      const x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * stdDev;
      const y = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2) * stdDev * 0.5; // Flatten Y for disc shape
      const z = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4) * stdDev;

      positions[i * 3] = cluster.center.x + x;
      positions[i * 3 + 1] = cluster.center.y + y;
      positions[i * 3 + 2] = cluster.center.z + z;

      // Size varies 0.15 to 0.6
      sizes[i] = 0.15 + random() * 0.45;

      // Opacity based on distance from center (closer = more opaque)
      const dist = Math.sqrt(x * x + y * y + z * z);
      const normalizedDist = dist / (cluster.radius * 1.5);
      baseOpacities[i] = Math.max(0.1, 1.0 - normalizedDist * 0.7);
    }

    return { positions, sizes, baseOpacities };
  }, [cluster]);

  // Shader material for soft glowing particles
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color(cluster.color) },
        uOpacity: { value: ANIMATION.DEFAULT_OPACITY },
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        varying float vOpacity;

        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vOpacity;

        void main() {
          float r = distance(gl_PointCoord, vec2(0.5));
          if (r > 0.5) discard;

          // Soft circular falloff
          float alpha = (1.0 - smoothstep(0.0, 0.5, r)) * vOpacity * uOpacity;

          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });
  }, [cluster.color]);

  // Animate opacity
  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    material.uniforms.uTime.value += delta;

    // Update pulse phase for active/matched clusters
    if (isActive || isMatched) {
      pulsePhaseRef.current += delta * 1.5;
    }

    // Determine target opacity
    let targetOpacity = ANIMATION.DEFAULT_OPACITY;

    if (hasAnyFilter) {
      if (isActive) {
        const pulse = Math.sin(pulsePhaseRef.current) * 0.05;
        targetOpacity = ANIMATION.ACTIVE_OPACITY + pulse;
      } else if (isMatched) {
        const pulse = Math.sin(pulsePhaseRef.current) * 0.03;
        targetOpacity = ANIMATION.MATCHED_OPACITY + pulse;
      } else {
        targetOpacity = ANIMATION.INACTIVE_OPACITY;
      }
    }

    // Lerp opacity
    const currentOpacity = currentOpacityRef.current;
    const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * ANIMATION.OPACITY_LERP_SPEED;

    if (Math.abs(newOpacity - currentOpacity) > 0.0005 || globalOpacity < 1) {
      currentOpacityRef.current = newOpacity;
      // Apply both filter opacity AND global fade-in opacity
      material.uniforms.uOpacity.value = newOpacity * globalOpacity;
    }
  });

  return (
    <points ref={pointsRef} material={material}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={PARTICLE_COUNT}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          array={sizes}
          count={PARTICLE_COUNT}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-opacity"
          array={baseOpacities}
          count={PARTICLE_COUNT}
          itemSize={1}
        />
      </bufferGeometry>
    </points>
  );
}

interface NebulaClustersProps {
  clusters: CategoryCluster[];
  activeCategory?: string | null;
  matchedCategories?: string[];
  globalOpacity?: number;
}

/**
 * NebulaClusters Component
 *
 * Renders organic particle clouds around each category cluster.
 * Provides visual grouping and hierarchy for the galaxy view.
 *
 * Features:
 * - Points-based particle system with Gaussian distribution
 * - Soft additive blending for glowing appearance
 * - Smooth opacity transitions on filter
 * - Pulse animation for active/matched clusters
 * 
 * Uses globalOpacity prop for synchronized fade-in with other layers.
 */
export default function NebulaClusters({
  clusters,
  activeCategory,
  matchedCategories,
  globalOpacity = 1,
}: NebulaClustersProps) {
  const hasAnyFilter = activeCategory !== null || (matchedCategories !== undefined && matchedCategories.length > 0);

  // Don't render if not visible yet
  if (globalOpacity <= 0 || clusters.length === 0) return null;

  return (
    <group>
      {clusters.map((cluster) => {
        const isActive = activeCategory === cluster.category;
        const isMatched = matchedCategories?.includes(cluster.category) ?? false;

        return (
          <ParticleNebula
            key={cluster.category}
            cluster={cluster}
            isActive={isActive}
            isMatched={isMatched}
            hasAnyFilter={hasAnyFilter}
            globalOpacity={globalOpacity}
          />
        );
      })}
    </group>
  );
}
