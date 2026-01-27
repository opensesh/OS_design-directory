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
  ACTIVE_OPACITY: 0.8,       // Selected ring - prominent
  INACTIVE_OPACITY: 0.15,    // Non-selected rings - faded
};

interface OrbitalRingProps {
  config: CategoryRingConfig;
  activeCategory: string | null;
}

/**
 * Individual orbital ring component
 * Renders a thin torus at the specified radius with category color
 */
function OrbitalRing({ config, activeCategory }: OrbitalRingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentOpacityRef = useRef(ANIMATION.DEFAULT_OPACITY);
  const pulsePhaseRef = useRef(0);

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

  // Animate opacity based on active category with pulse effect for active ring
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const isActive = activeCategory === config.category;

    // Update pulse phase when active
    if (isActive) {
      pulsePhaseRef.current += delta * 2.5;
    } else {
      // Gradually reset pulse phase when inactive
      pulsePhaseRef.current *= 0.95;
    }

    // Determine target opacity with pulse modulation
    let targetOpacity = ANIMATION.DEFAULT_OPACITY;
    if (activeCategory !== null) {
      if (isActive) {
        // Pulse between 0.6 and 1.0 when active
        const pulse = Math.sin(pulsePhaseRef.current) * 0.2 + 0.8;
        targetOpacity = ANIMATION.ACTIVE_OPACITY * pulse;
      } else {
        targetOpacity = ANIMATION.INACTIVE_OPACITY;
      }
    }

    // Lerp to target
    const currentOpacity = currentOpacityRef.current;
    const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * ANIMATION.OPACITY_LERP_SPEED;

    if (Math.abs(newOpacity - currentOpacity) > 0.001 || isActive) {
      currentOpacityRef.current = newOpacity;
      material.opacity = newOpacity;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[Math.PI / 2 + RING_LAYOUT.TILT_ANGLE, 0, 0]}
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
        />
      ))}
    </group>
  );
}
