import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CategoryRingConfig } from '../../utils/orbital-layout';
import { RING_LAYOUT } from '../../utils/orbital-layout';

/**
 * Animation configuration for ring opacity and stroke transitions
 */
const ANIMATION = {
  OPACITY_LERP_SPEED: 0.08,
  SCALE_LERP_SPEED: 0.1,
  DEFAULT_OPACITY: 0.35,
  ACTIVE_OPACITY: 0.8,       // Selected ring - prominent
  INACTIVE_OPACITY: 0.15,    // Non-selected rings - faded
  DEFAULT_STROKE_SCALE: 1.0,
  ACTIVE_STROKE_SCALE: 2.0,  // 2x thicker when highlighted
  FILL_OPACITY: 0.35,        // Medium fill opacity per user preference
};

/**
 * RingFill Component
 *
 * Renders a flat, camera-facing circular fill between inner and outer radii.
 * Creates Saturn-like fill effect that fills inward toward the center sphere.
 */
interface RingFillProps {
  innerRadius: number;
  outerRadius: number;
  color: string;
  isActive: boolean;
}

function RingFill({ innerRadius, outerRadius, color, isActive }: RingFillProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const opacityRef = useRef(0);

  const geometry = useMemo(() => {
    return new THREE.RingGeometry(innerRadius, outerRadius, 64);
  }, [innerRadius, outerRadius]);

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,  // Prevent z-fighting with nodes
    });
  }, [color]);

  useFrame(() => {
    const targetOpacity = isActive ? ANIMATION.FILL_OPACITY : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * 0.1;
    material.opacity = opacityRef.current;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      rotation={[Math.PI / 2 + RING_LAYOUT.TILT_ANGLE, 0, 0]}  // Match ring tilt
      position={[0, 0, 0]}
    />
  );
}

interface OrbitalRingProps {
  config: CategoryRingConfig;
  activeCategory: string | null;
  matchedCategories?: string[];
}

/**
 * Individual orbital ring component
 * Renders a thin torus at the specified radius with category color
 * Supports both single-category (button filter) and multi-category (search) highlighting
 */
function OrbitalRing({ config, activeCategory, matchedCategories }: OrbitalRingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentOpacityRef = useRef(ANIMATION.DEFAULT_OPACITY);
  const currentStrokeScaleRef = useRef(ANIMATION.DEFAULT_STROKE_SCALE);
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

  // Animate opacity and stroke scale based on active category or matched categories
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const isActive = activeCategory === config.category;
    const isMatched = matchedCategories?.includes(config.category) ?? false;
    const hasAnyFilter = activeCategory !== null || (matchedCategories && matchedCategories.length > 0);

    // Update pulse phase when active or matched
    if (isActive || isMatched) {
      pulsePhaseRef.current += delta * 2.5;
    } else {
      // Gradually reset pulse phase when inactive
      pulsePhaseRef.current *= 0.95;
    }

    // Determine target opacity and stroke scale with pulse modulation
    let targetOpacity = ANIMATION.DEFAULT_OPACITY;
    let targetStrokeScale = ANIMATION.DEFAULT_STROKE_SCALE;

    if (hasAnyFilter) {
      if (isActive || isMatched) {
        // Pulse between 0.6 and 1.0 when active/matched
        const pulse = Math.sin(pulsePhaseRef.current) * 0.2 + 0.8;
        targetOpacity = ANIMATION.ACTIVE_OPACITY * pulse;
        targetStrokeScale = ANIMATION.ACTIVE_STROKE_SCALE;  // Thicker stroke
      } else {
        targetOpacity = ANIMATION.INACTIVE_OPACITY;
        targetStrokeScale = ANIMATION.DEFAULT_STROKE_SCALE;
      }
    }

    // Lerp opacity
    const currentOpacity = currentOpacityRef.current;
    const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * ANIMATION.OPACITY_LERP_SPEED;

    if (Math.abs(newOpacity - currentOpacity) > 0.001 || isActive || isMatched) {
      currentOpacityRef.current = newOpacity;
      material.opacity = newOpacity;
    }

    // Lerp stroke scale (Y and Z scale for torus thickness)
    const currentStrokeScale = currentStrokeScaleRef.current;
    const newStrokeScale = currentStrokeScale + (targetStrokeScale - currentStrokeScale) * ANIMATION.SCALE_LERP_SPEED;

    if (Math.abs(newStrokeScale - currentStrokeScale) > 0.001) {
      currentStrokeScaleRef.current = newStrokeScale;
      // Scale Y and Z to make the torus tube thicker
      meshRef.current.scale.set(1, newStrokeScale, newStrokeScale);
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
  matchedCategories?: string[];
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
 * - Saturn-like ring fills when categories are active
 */
export default function OrbitalRings({ ringConfigs, activeCategory, matchedCategories }: OrbitalRingsProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Sort configs by radius for fill boundary calculation
  const sortedConfigs = useMemo(() =>
    [...ringConfigs].sort((a, b) => a.radius - b.radius),
  [ringConfigs]);

  // Determine active categories
  const activeCategories = useMemo(() => {
    const active = new Set<string>();
    if (activeCategory) active.add(activeCategory);
    matchedCategories?.forEach(c => active.add(c));
    return active;
  }, [activeCategory, matchedCategories]);

  // Calculate fill boundaries for active categories
  const fillConfigs = useMemo(() => {
    const fills: Array<{
      category: string;
      innerRadius: number;
      outerRadius: number;
      color: string;
    }> = [];

    let lastActiveRadius = RING_LAYOUT.CENTER_RADIUS; // Start from center sphere (10 units)

    for (const config of sortedConfigs) {
      if (activeCategories.has(config.category)) {
        fills.push({
          category: config.category,
          innerRadius: lastActiveRadius,
          outerRadius: config.radius,
          color: config.color,
        });
        lastActiveRadius = config.radius;
      }
    }

    return fills;
  }, [sortedConfigs, activeCategories]);

  const hasActiveFilters = activeCategories.size > 0;

  if (ringConfigs.length === 0) return null;

  return (
    <group ref={groupRef}>
      {/* Ring fills (flat, tilted) - only when filters active */}
      {hasActiveFilters && fillConfigs.map((fill) => (
        <RingFill
          key={`fill-${fill.category}`}
          innerRadius={fill.innerRadius}
          outerRadius={fill.outerRadius}
          color={fill.color}
          isActive={true}
        />
      ))}

      {/* Existing orbital ring tori */}
      {ringConfigs.map((config) => (
        <OrbitalRing
          key={config.category}
          config={config}
          activeCategory={activeCategory}
          matchedCategories={matchedCategories}
        />
      ))}
    </group>
  );
}
