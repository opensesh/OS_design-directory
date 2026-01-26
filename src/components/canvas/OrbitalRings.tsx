import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CategoryRingConfig } from '../../utils/orbital-layout';
import { RING_LAYOUT } from '../../utils/orbital-layout';

/**
 * Animation configuration for ring opacity transitions
 */
const ANIMATION = {
  OPACITY_LERP_SPEED: 0.08,
  DEFAULT_OPACITY: 0.35,
  ACTIVE_OPACITY: 0.7,
  INACTIVE_OPACITY: 0.1,
};

interface OrbitalRingProps {
  config: CategoryRingConfig;
  activeCategory: string | null;
  groupRef: React.RefObject<THREE.Group | null>;
}

/**
 * Individual orbital ring component
 * Renders a thin torus at the specified radius with category color
 */
function OrbitalRing({ config, activeCategory, groupRef }: OrbitalRingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentOpacityRef = useRef(ANIMATION.DEFAULT_OPACITY);

  // Ring geometry parameters
  const tubeRadius = 0.02;
  const radialSegments = 64;
  const tubularSegments = 8;

  // Create material with category color
  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: ANIMATION.DEFAULT_OPACITY,
      side: THREE.DoubleSide,
    });
  }, [config.color]);

  // Animate opacity based on active category
  useFrame(() => {
    if (!meshRef.current) return;

    // Determine target opacity
    let targetOpacity = ANIMATION.DEFAULT_OPACITY;
    if (activeCategory !== null) {
      targetOpacity = activeCategory === config.category
        ? ANIMATION.ACTIVE_OPACITY
        : ANIMATION.INACTIVE_OPACITY;
    }

    // Lerp to target
    const currentOpacity = currentOpacityRef.current;
    const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * ANIMATION.OPACITY_LERP_SPEED;

    if (Math.abs(newOpacity - currentOpacity) > 0.001) {
      currentOpacityRef.current = newOpacity;
      material.opacity = newOpacity;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[RING_LAYOUT.TILT_ANGLE, 0, 0]}
      material={material}
    >
      <torusGeometry args={[config.radius, tubeRadius, tubularSegments, radialSegments]} />
    </mesh>
  );
}

interface OrbitalRingsProps {
  ringConfigs: CategoryRingConfig[];
  activeCategory: string | null;
}

/**
 * OrbitalRings Component
 *
 * Renders concentric category rings around the central sphere.
 * Each ring is colored by category and tilted ~18° for NASA Eyes aesthetic.
 *
 * Features:
 * - Thin torus geometry for each category
 * - Smooth opacity transitions on category selection
 * - Synchronized rotation with ResourceNodes group
 */
export default function OrbitalRings({ ringConfigs, activeCategory }: OrbitalRingsProps) {
  const groupRef = useRef<THREE.Group>(null);

  if (ringConfigs.length === 0) return null;

  return (
    <group ref={groupRef}>
      {ringConfigs.map((config) => (
        <OrbitalRing
          key={config.category}
          config={config}
          activeCategory={activeCategory}
          groupRef={groupRef}
        />
      ))}
    </group>
  );
}
