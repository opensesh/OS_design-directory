import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { CategoryCluster } from '../../utils/orbital-layout';

/**
 * Cloud configuration for volumetric nebula effect
 * Using billboarded sprites for true 3D parallax
 */
const CLOUD_CONFIG = {
  SPRITES_PER_CLUSTER: 50,    // Number of sprites per cluster (increased for better coverage)
  SPRITE_SIZE: 20,            // Base size of each sprite
  BASE_OPACITY: 0.18,         // Default opacity
  ACTIVE_OPACITY: 0.25,       // Highlighted when category selected
  MATCHED_OPACITY: 0.21,      // Matched via search
  INACTIVE_OPACITY: 0.06,     // Faded when filtered out
  OPACITY_LERP_SPEED: 0.06,   // Smooth transitions
};

/**
 * Seeded random number generator for deterministic sprite positions
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

interface CloudSpriteData {
  opacityFactor: number;
  position: THREE.Vector3;
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
 * NebulaCloud - Volumetric billboarded sprites around a category cluster
 *
 * Uses sprites that always face the camera, positioned at different depths
 * within the cluster to create true 3D parallax when orbiting.
 */
function NebulaCloud({ cluster, texture, isActive, isMatched, hasAnyFilter }: NebulaCloudProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<THREE.SpriteMaterial[]>([]);
  const currentOpacityRef = useRef(CLOUD_CONFIG.BASE_OPACITY);

  // Generate sprite positions deterministically with 3D Gaussian distribution
  const sprites = useMemo<CloudSpriteData[]>(() => {
    const result: CloudSpriteData[] = [];
    const random = seededRandom(cluster.category + '-sprites');

    for (let i = 0; i < CLOUD_CONFIG.SPRITES_PER_CLUSTER; i++) {
      // Random position using Box-Muller for Gaussian distribution
      const u1 = random() || 0.0001;
      const u2 = random();
      const u3 = random() || 0.0001;
      const u4 = random();

      const stdDev = cluster.radius * 0.8;

      // Gaussian distributed offsets for 3D volumetric positioning
      const x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * stdDev;
      const y = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2) * stdDev * 0.5;
      const z = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4) * stdDev;

      // Distance-based opacity: brighter at center, fade at edges
      const dist = Math.sqrt(x * x + y * y + z * z);
      const normalizedDist = dist / (cluster.radius * 1.5);
      const opacityFactor = Math.max(0.2, 1.0 - normalizedDist * 0.8);

      // Size varies inversely with opacity (outer sprites are larger but more transparent)
      const sizeVariation = 0.4 + random() * 1.2;

      result.push({
        position: new THREE.Vector3(
          cluster.center.x + x,
          cluster.center.y + y,
          cluster.center.z + z
        ),
        opacityFactor,
        scale: sizeVariation,
      });
    }

    return result;
  }, [cluster]);

  // Create sprite materials (tinted with cluster color)
  const materials = useMemo(() => {
    const color = new THREE.Color(cluster.color);
    const mats: THREE.SpriteMaterial[] = [];

    for (let i = 0; i < sprites.length; i++) {
      const mat = new THREE.SpriteMaterial({
        map: texture,
        color: color,
        transparent: true,
        opacity: CLOUD_CONFIG.BASE_OPACITY * sprites[i].opacityFactor,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      mats.push(mat);
    }

    materialsRef.current = mats;
    return mats;
  }, [cluster.color, texture, sprites]);

  // Animate opacity transitions
  useFrame(() => {
    if (!groupRef.current) return;

    // Determine target opacity based on filter state
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

    // Smooth lerp opacity
    const currentOpacity = currentOpacityRef.current;
    const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * CLOUD_CONFIG.OPACITY_LERP_SPEED;

    if (Math.abs(newOpacity - currentOpacity) > 0.001) {
      currentOpacityRef.current = newOpacity;
      materialsRef.current.forEach((mat, i) => {
        mat.opacity = newOpacity * sprites[i].opacityFactor;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {sprites.map((sprite, i) => {
        const size = CLOUD_CONFIG.SPRITE_SIZE * sprite.scale;
        return (
          <sprite
            key={i}
            position={sprite.position}
            scale={[size, size, 1]}
            material={materials[i]}
          />
        );
      })}
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
 * Renders volumetric nebula clouds around each category cluster using
 * billboarded sprites for true 3D depth perception.
 *
 * Features:
 * - Billboarded sprites (always face camera) for 3D parallax
 * - 3D Gaussian distribution creates volumetric appearance
 * - Parallax motion when orbiting the galaxy
 * - Additive blending for ethereal glow
 * - Smooth opacity transitions on filter
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
