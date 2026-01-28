import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CategoryCluster } from '../../utils/orbital-layout';

/**
 * Animation configuration for cluster halos
 */
const ANIMATION = {
  OPACITY_LERP_SPEED: 0.08,
  DEFAULT_OPACITY: 0.05,    // Subtle glow when not filtered
  ACTIVE_OPACITY: 0.12,     // Brighter when active/filtered
  MATCHED_OPACITY: 0.10,    // Multi-category search match
  INACTIVE_OPACITY: 0.03,   // Very subtle when other category is active
};

interface ClusterHaloProps {
  cluster: CategoryCluster;
  isActive: boolean;
  isMatched: boolean;
  hasAnyFilter: boolean;
}

/**
 * ClusterHalo - Soft spherical glow around a category cluster
 *
 * Uses additive blending for ethereal nebula-like effect.
 * Opacity changes based on filter state for visual hierarchy.
 */
function ClusterHalo({ cluster, isActive, isMatched, hasAnyFilter }: ClusterHaloProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentOpacityRef = useRef(ANIMATION.DEFAULT_OPACITY);
  const pulsePhaseRef = useRef(Math.random() * Math.PI * 2);

  // Create material with category color and additive blending
  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: cluster.color,
      transparent: true,
      opacity: ANIMATION.DEFAULT_OPACITY,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [cluster.color]);

  // Animate opacity based on filter state
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Update pulse phase for active/matched clusters
    if (isActive || isMatched) {
      pulsePhaseRef.current += delta * 1.5;
    }

    // Determine target opacity
    let targetOpacity = ANIMATION.DEFAULT_OPACITY;

    if (hasAnyFilter) {
      if (isActive) {
        // Pulse between 0.08 and 0.12 when active
        const pulse = Math.sin(pulsePhaseRef.current) * 0.02 + 0.10;
        targetOpacity = Math.max(ANIMATION.ACTIVE_OPACITY, pulse);
      } else if (isMatched) {
        // Subtle pulse for matched categories
        const pulse = Math.sin(pulsePhaseRef.current) * 0.015 + 0.085;
        targetOpacity = pulse;
      } else {
        targetOpacity = ANIMATION.INACTIVE_OPACITY;
      }
    }

    // Lerp opacity
    const currentOpacity = currentOpacityRef.current;
    const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * ANIMATION.OPACITY_LERP_SPEED;

    if (Math.abs(newOpacity - currentOpacity) > 0.0005) {
      currentOpacityRef.current = newOpacity;
      material.opacity = newOpacity;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[cluster.center.x, cluster.center.y, cluster.center.z]}
      material={material}
    >
      <sphereGeometry args={[cluster.radius * 1.3, 32, 32]} />
    </mesh>
  );
}

interface NebulaClustersCoreProps {
  cluster: CategoryCluster;
  isActive: boolean;
  isMatched: boolean;
  hasAnyFilter: boolean;
}

/**
 * NebulaClustersCore - Inner bright core for active clusters
 *
 * Smaller, brighter sphere at cluster center for emphasis
 */
function NebulaClustersCore({ cluster, isActive, isMatched, hasAnyFilter }: NebulaClustersCoreProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentOpacityRef = useRef(0);

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: cluster.color,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [cluster.color]);

  useFrame(() => {
    if (!meshRef.current) return;

    // Only show core when active or matched
    const shouldShow = hasAnyFilter && (isActive || isMatched);
    const targetOpacity = shouldShow ? 0.15 : 0;

    const currentOpacity = currentOpacityRef.current;
    const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * 0.1;

    if (Math.abs(newOpacity - currentOpacity) > 0.001) {
      currentOpacityRef.current = newOpacity;
      material.opacity = newOpacity;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[cluster.center.x, cluster.center.y, cluster.center.z]}
      material={material}
    >
      <sphereGeometry args={[cluster.radius * 0.3, 24, 24]} />
    </mesh>
  );
}

interface NebulaClustersProps {
  clusters: CategoryCluster[];
  activeCategory?: string | null;
  matchedCategories?: string[];
}

/**
 * NebulaClusters Component
 *
 * Renders soft glowing halos around each category cluster.
 * Provides visual grouping and hierarchy for the galaxy view.
 *
 * Features:
 * - Subtle additive-blended spherical glows
 * - Smooth opacity transitions on filter
 * - Pulse animation for active/matched clusters
 * - Bright inner core for emphasized clusters
 */
export default function NebulaClusters({
  clusters,
  activeCategory,
  matchedCategories,
}: NebulaClustersProps) {
  // Determine active categories
  const activeCategories = useMemo(() => {
    const active = new Set<string>();
    if (activeCategory) active.add(activeCategory);
    matchedCategories?.forEach(c => active.add(c));
    return active;
  }, [activeCategory, matchedCategories]);

  const hasAnyFilter = activeCategory !== null || (matchedCategories && matchedCategories.length > 0);

  if (clusters.length === 0) return null;

  return (
    <group>
      {clusters.map((cluster) => {
        const isActive = activeCategory === cluster.category;
        const isMatched = matchedCategories?.includes(cluster.category) ?? false;

        return (
          <group key={cluster.category}>
            {/* Outer halo glow */}
            <ClusterHalo
              cluster={cluster}
              isActive={isActive}
              isMatched={isMatched}
              hasAnyFilter={hasAnyFilter}
            />

            {/* Inner core (only visible when active/matched) */}
            <NebulaClustersCore
              cluster={cluster}
              isActive={isActive}
              isMatched={isMatched}
              hasAnyFilter={hasAnyFilter}
            />
          </group>
        );
      })}
    </group>
  );
}
