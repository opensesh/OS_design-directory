import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { CategoryCluster } from '../../utils/orbital-layout';

/**
 * Cloud configuration for volumetric nebula effect
 * Inspired by Red Stapler's Three.js nebula tutorial
 */
const CLOUD_CONFIG = {
  PLANES_PER_CLUSTER: 20,      // Number of cloud planes per cluster
  PLANE_SIZE: 30,              // Size of each plane
  BASE_OPACITY: 0.35,          // Default opacity
  ACTIVE_OPACITY: 0.50,        // Highlighted when category selected
  MATCHED_OPACITY: 0.42,       // Matched via search
  INACTIVE_OPACITY: 0.12,      // Faded when filtered out
  ROTATION_SPEED: 0.0008,      // Slow drift animation
  OPACITY_LERP_SPEED: 0.06,    // Smooth transitions
};

/**
 * Seeded random number generator for deterministic plane positions
 */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return function () {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 4294967296;
  };
}

interface CloudPlaneData {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
}

interface NebulaCloudProps {
  cluster: CategoryCluster;
  texture: THREE.Texture;
  isActive: boolean;
  isMatched: boolean;
  hasAnyFilter: boolean;
}

/**
 * NebulaCloud - Volumetric cloud planes around a category cluster
 *
 * Renders multiple textured plane meshes with slow rotation
 * to create a volumetric, foggy nebula effect.
 */
function NebulaCloud({ cluster, texture, isActive, isMatched, hasAnyFilter }: NebulaCloudProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<THREE.MeshBasicMaterial[]>([]);
  const currentOpacityRef = useRef(CLOUD_CONFIG.BASE_OPACITY);

  // Generate plane positions and rotations deterministically
  const planes = useMemo<CloudPlaneData[]>(() => {
    const result: CloudPlaneData[] = [];
    const random = seededRandom(cluster.category + '-planes');

    for (let i = 0; i < CLOUD_CONFIG.PLANES_PER_CLUSTER; i++) {
      // Random position within cluster radius using Gaussian-like distribution
      const u1 = random() || 0.0001;
      const u2 = random();
      const u3 = random() || 0.0001;
      const u4 = random();

      const stdDev = cluster.radius * 0.7;

      // Box-Muller transform for Gaussian distribution
      const x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * stdDev;
      const y = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2) * stdDev * 0.4; // Flatten Y
      const z = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4) * stdDev;

      result.push({
        position: new THREE.Vector3(
          cluster.center.x + x,
          cluster.center.y + y,
          cluster.center.z + z
        ),
        rotation: new THREE.Euler(
          random() * Math.PI,              // Random X (0 to π)
          random() * Math.PI * 2,          // Random Y (0 to 2π)
          random() * Math.PI * 2           // Random Z (0 to 2π)
        ),
        scale: 0.6 + random() * 0.8,  // Size variation (0.6 to 1.4)
      });
    }

    return result;
  }, [cluster]);

  // Create materials for each plane (tinted with cluster color)
  const materials = useMemo(() => {
    const color = new THREE.Color(cluster.color);
    const mats: THREE.MeshBasicMaterial[] = [];

    for (let i = 0; i < CLOUD_CONFIG.PLANES_PER_CLUSTER; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        color: color,
        transparent: true,
        opacity: CLOUD_CONFIG.BASE_OPACITY,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      mats.push(mat);
    }

    materialsRef.current = mats;
    return mats;
  }, [cluster.color, texture]);

  // Animate rotation and opacity
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Determine target opacity
    let targetOpacity = CLOUD_CONFIG.BASE_OPACITY;

    if (hasAnyFilter) {
      if (isActive) {
        targetOpacity = CLOUD_CONFIG.ACTIVE_OPACITY;
      } else if (isMatched) {
        targetOpacity = CLOUD_CONFIG.MATCHED_OPACITY;
      } else {
        targetOpacity = CLOUD_CONFIG.INACTIVE_OPACITY;
      }
    }

    // Lerp opacity
    const currentOpacity = currentOpacityRef.current;
    const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * CLOUD_CONFIG.OPACITY_LERP_SPEED;

    if (Math.abs(newOpacity - currentOpacity) > 0.001) {
      currentOpacityRef.current = newOpacity;
      materialsRef.current.forEach((mat) => {
        mat.opacity = newOpacity;
      });
    }

    // Rotate each plane slowly
    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        child.rotation.z -= CLOUD_CONFIG.ROTATION_SPEED;
      }
    });
  });

  // Shared geometry for all planes
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(CLOUD_CONFIG.PLANE_SIZE, CLOUD_CONFIG.PLANE_SIZE);
  }, []);

  return (
    <group ref={groupRef}>
      {planes.map((plane, i) => (
        <mesh
          key={i}
          position={plane.position}
          rotation={plane.rotation}
          scale={plane.scale}
          geometry={geometry}
          material={materials[i]}
        />
      ))}
    </group>
  );
}

interface NebulaPlanesProps {
  clusters: CategoryCluster[];
  activeCategory?: string | null;
  matchedCategories?: string[];
}

/**
 * NebulaPlanes Component
 *
 * Renders volumetric cloud planes around each category cluster.
 * Creates a realistic nebula effect using textured planes with
 * slow rotation animation and category-colored tinting.
 *
 * Features:
 * - Plane-based volumetric clouds (vs particle-based NebulaClusters)
 * - Additive blending for ethereal glow
 * - Smooth opacity transitions on filter
 * - Slow z-axis rotation for organic feel
 */
export default function NebulaPlanes({
  clusters,
  activeCategory,
  matchedCategories,
}: NebulaPlanesProps) {
  // Load smoke texture
  const texture = useTexture('/textures/clouds/smoke.png');

  const hasAnyFilter = activeCategory !== null || (matchedCategories !== undefined && matchedCategories.length > 0);

  if (clusters.length === 0) return null;

  return (
    <group>
      {clusters.map((cluster) => {
        const isActive = activeCategory === cluster.category;
        const isMatched = matchedCategories?.includes(cluster.category) ?? false;

        return (
          <NebulaCloud
            key={cluster.category}
            cluster={cluster}
            texture={texture}
            isActive={isActive}
            isMatched={isMatched}
            hasAnyFilter={hasAnyFilter}
          />
        );
      })}
    </group>
  );
}
