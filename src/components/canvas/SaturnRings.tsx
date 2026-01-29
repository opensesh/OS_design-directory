import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  buildGalaxyPositionMap,
  scoreToSizeMultiplier,
  type CategoryCluster,
} from '../../utils/orbital-layout';
import type { NormalizedResource } from '../../types/resource';
import { getCategoryColor } from '../../types/resource';

/**
 * Ring configuration for high-score resources
 */
const RING_CONFIG = {
  INNER_RADIUS_RATIO: 1.4,    // Ring starts at 1.4x planet radius
  OUTER_RADIUS_RATIO: 2.2,    // Ring extends to 2.2x planet radius
  THETA_SEGMENTS: 48,         // Smooth ring circumference
  PHI_SEGMENTS: 1,            // Single ring thickness
  TILT_RANGE: Math.PI * 0.15, // ±27° random tilt variation
  SCORE_THRESHOLD: 9.0,       // Only show rings for 9+ scores
} as const;

/**
 * Animation configuration (mirrors ResourceNodes)
 */
const ANIMATION = {
  ENTRANCE_DELAY: 400,
  STAGGER_DELAY: 20,
  ENTRANCE_DURATION: 600,
  FILTER_LERP_SPEED: 0.1,
  HOVER_LERP_SPEED: 0.15,
  VISIBLE_OPACITY: 0.55,      // Slightly transparent rings
  FILTERED_OUT_OPACITY: 0.08, // Even more faded when filtered
  DIMMED_OPACITY: 0.12,
  HOVER_SCALE: 1.6,
  NORMAL_SCALE: 1.0,
};

/**
 * Seeded random number generator for consistent tilt
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

interface SaturnRingsProps {
  resources: NormalizedResource[];
  clusters: CategoryCluster[];
  activeCategory?: string | null;
  activeFilter?: string | null;
  activeSubFilter?: string | null;
  filteredResourceIds?: number[] | null;
  hoveredIndex?: number | null;
  clickedIndex?: number | null;
}

/**
 * SaturnRings
 *
 * Renders Saturn-like rings around high-score resources (9.0+).
 * Syncs with ResourceNodes for position, opacity, and hover animations.
 */
export function SaturnRings({
  resources,
  clusters,
  activeCategory,
  activeFilter,
  activeSubFilter,
  filteredResourceIds,
  hoveredIndex,
  clickedIndex,
}: SaturnRingsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Animation state
  const [isInitialized, setIsInitialized] = useState(false);
  const currentOpacitiesRef = useRef<Float32Array | null>(null);
  const targetOpacitiesRef = useRef<Float32Array | null>(null);
  const currentHoverScalesRef = useRef<Float32Array | null>(null);
  const entranceProgressRef = useRef<Float32Array | null>(null);
  const entranceStartTimeRef = useRef<number | null>(null);

  // Filter to only high-score resources
  const ringResources = useMemo(() => {
    return resources.filter(r => r.gravityScore >= RING_CONFIG.SCORE_THRESHOLD);
  }, [resources]);

  // Create mapping from ring index to original resource index
  const ringToResourceIndex = useMemo(() => {
    const map = new Map<number, number>();
    let ringIndex = 0;
    resources.forEach((r, originalIndex) => {
      if (r.gravityScore >= RING_CONFIG.SCORE_THRESHOLD) {
        map.set(ringIndex, originalIndex);
        ringIndex++;
      }
    });
    return map;
  }, [resources]);

  const ringCount = ringResources.length;
  const nodeRadius = 0.5;

  // Calculate positions, colors, and tilts for rings
  const { positions, colors, sizeMultipliers, tilts } = useMemo(() => {
    const count = ringResources.length;
    const posArray = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);
    const sizeArray = new Float32Array(count);
    const tiltArray = new Float32Array(count * 3); // Store rotation as euler angles

    // Build position map using galaxy cluster layout
    const positionMap = buildGalaxyPositionMap(resources, clusters);

    ringResources.forEach((resource, index) => {
      const pos = positionMap.get(String(resource.id)) || { x: 0, y: 0, z: 0 };

      posArray[index * 3] = pos.x;
      posArray[index * 3 + 1] = pos.y;
      posArray[index * 3 + 2] = pos.z;

      const colorHex = getCategoryColor(resource.category);
      const color = new THREE.Color(colorHex);

      colorArray[index * 3] = color.r;
      colorArray[index * 3 + 1] = color.g;
      colorArray[index * 3 + 2] = color.b;

      // Size multiplier matches planet size
      sizeArray[index] = scoreToSizeMultiplier(resource.gravityScore);

      // Seeded random tilt for visual variety
      const tiltX = (seededRandom(resource.id * 7) - 0.5) * 2 * RING_CONFIG.TILT_RANGE;
      const tiltZ = (seededRandom(resource.id * 13) - 0.5) * 2 * RING_CONFIG.TILT_RANGE;

      tiltArray[index * 3] = tiltX;
      tiltArray[index * 3 + 1] = 0; // No Y rotation
      tiltArray[index * 3 + 2] = tiltZ;
    });

    return {
      positions: posArray,
      colors: colorArray,
      sizeMultipliers: sizeArray,
      tilts: tiltArray,
    };
  }, [ringResources, resources, clusters]);

  // Initialize animation arrays
  useEffect(() => {
    if (ringCount === 0) return;

    if (!currentOpacitiesRef.current || currentOpacitiesRef.current.length !== ringCount) {
      currentOpacitiesRef.current = new Float32Array(ringCount).fill(0);
      targetOpacitiesRef.current = new Float32Array(ringCount).fill(ANIMATION.VISIBLE_OPACITY);
      currentHoverScalesRef.current = new Float32Array(ringCount).fill(ANIMATION.NORMAL_SCALE);
      entranceProgressRef.current = new Float32Array(ringCount).fill(0);
      entranceStartTimeRef.current = Date.now();
      setIsInitialized(false);
    }
  }, [ringCount]);

  // Update target opacities based on filters
  useEffect(() => {
    if (!targetOpacitiesRef.current || ringCount === 0) return;

    const hasFilter = activeCategory || activeFilter || activeSubFilter;
    const filteredSet = filteredResourceIds ? new Set(filteredResourceIds) : null;

    ringResources.forEach((resource, ringIndex) => {
      let targetOpacity = ANIMATION.VISIBLE_OPACITY;

      if (filteredSet) {
        // Explicit filter result
        if (!filteredSet.has(resource.id)) {
          targetOpacity = ANIMATION.FILTERED_OUT_OPACITY;
        }
      } else if (hasFilter) {
        // Category filter
        if (activeCategory && resource.category !== activeCategory) {
          targetOpacity = ANIMATION.DIMMED_OPACITY;
        }
      }

      targetOpacitiesRef.current![ringIndex] = targetOpacity;
    });
  }, [ringResources, ringCount, activeCategory, activeFilter, activeSubFilter, filteredResourceIds]);

  // Create ring material with vertex colors
  const ringMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      metalness: 0.1,
      roughness: 0.7,
      depthWrite: false, // Better blending with transparent rings
    });
  }, []);

  // Create ring geometry
  const ringGeometry = useMemo(() => {
    // RingGeometry: innerRadius, outerRadius, thetaSegments, phiSegments
    const geo = new THREE.RingGeometry(
      nodeRadius * RING_CONFIG.INNER_RADIUS_RATIO,
      nodeRadius * RING_CONFIG.OUTER_RADIUS_RATIO,
      RING_CONFIG.THETA_SEGMENTS,
      RING_CONFIG.PHI_SEGMENTS
    );

    // Rotate geometry so rings are horizontal by default
    geo.rotateX(-Math.PI / 2);

    return geo;
  }, []);

  // Setup instanced attributes for colors and opacity
  useEffect(() => {
    if (!meshRef.current || ringCount === 0) return;

    const colorAttribute = new THREE.InstancedBufferAttribute(colors, 3);
    meshRef.current.geometry.setAttribute('color', colorAttribute);
  }, [colors, ringCount]);

  // Animation frame
  useFrame(() => {
    if (!meshRef.current || ringCount === 0) return;
    if (!currentOpacitiesRef.current || !targetOpacitiesRef.current || !currentHoverScalesRef.current) return;
    if (!entranceProgressRef.current) return;

    const now = Date.now();
    const entranceStart = entranceStartTimeRef.current || now;
    const timeSinceStart = now - entranceStart;

    const dummy = new THREE.Object3D();
    let hasChanges = false;
    let allEntranceComplete = true;

    for (let i = 0; i < ringCount; i++) {
      // Get original resource index for hover/click matching
      const originalIndex = ringToResourceIndex.get(i) ?? -1;

      // Entrance animation with stagger (slightly delayed from planets)
      const nodeEntranceDelay = ANIMATION.ENTRANCE_DELAY + 100 + (i * ANIMATION.STAGGER_DELAY);
      const timeSinceNodeStart = timeSinceStart - nodeEntranceDelay;

      let entranceScale = entranceProgressRef.current[i];
      if (!isInitialized) {
        if (timeSinceNodeStart <= 0) {
          entranceScale = 0;
          allEntranceComplete = false;
        } else if (timeSinceNodeStart < ANIMATION.ENTRANCE_DURATION) {
          const progress = timeSinceNodeStart / ANIMATION.ENTRANCE_DURATION;
          entranceScale = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          allEntranceComplete = false;
        } else {
          entranceScale = 1.0;
        }
        if (Math.abs(entranceScale - entranceProgressRef.current[i]) > 0.001) {
          entranceProgressRef.current[i] = entranceScale;
          hasChanges = true;
        }
      } else {
        entranceScale = 1.0;
      }

      // Lerp opacity
      const targetOpacity = targetOpacitiesRef.current[i];
      const currentOpacity = currentOpacitiesRef.current[i];
      const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * ANIMATION.FILTER_LERP_SPEED;

      if (Math.abs(newOpacity - currentOpacity) > 0.001) {
        currentOpacitiesRef.current[i] = newOpacity;
        hasChanges = true;
      }

      // Hover scale - match parent planet's hover state
      const isHovered = hoveredIndex === originalIndex && newOpacity >= 0.2;
      const isClicked = clickedIndex === originalIndex;

      let targetHoverScale = ANIMATION.NORMAL_SCALE;
      if (isClicked) {
        targetHoverScale = ANIMATION.HOVER_SCALE * 0.95; // Slightly less than click scale
      } else if (isHovered) {
        targetHoverScale = ANIMATION.HOVER_SCALE;
      }

      const currentHoverScale = currentHoverScalesRef.current[i];
      const newHoverScale = currentHoverScale + (targetHoverScale - currentHoverScale) * ANIMATION.HOVER_LERP_SPEED;

      if (Math.abs(newHoverScale - currentHoverScale) > 0.001) {
        currentHoverScalesRef.current[i] = newHoverScale;
        hasChanges = true;
      }

      // Calculate final scale
      const scoreSizeMultiplier = sizeMultipliers[i] || 1;
      const finalScale = Math.max(0.001, entranceScale) * newHoverScale * scoreSizeMultiplier;

      // Set position
      dummy.position.set(
        positions[i * 3] || 0,
        positions[i * 3 + 1] || 0,
        positions[i * 3 + 2] || 0
      );

      // Apply tilt rotation
      dummy.rotation.set(
        tilts[i * 3] || 0,
        tilts[i * 3 + 1] || 0,
        tilts[i * 3 + 2] || 0
      );

      // Apply scale
      dummy.scale.set(finalScale, finalScale, finalScale);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Update color with opacity
      const colorAttr = meshRef.current.geometry.getAttribute('color') as THREE.BufferAttribute;
      if (colorAttr) {
        // We can't easily modify opacity per-instance without a shader, so we'll adjust the color brightness
        const baseR = colors[i * 3];
        const baseG = colors[i * 3 + 1];
        const baseB = colors[i * 3 + 2];

        // Modulate color by opacity for visual fade effect
        colorAttr.setXYZ(i, baseR * newOpacity, baseG * newOpacity, baseB * newOpacity);
      }
    }

    if (hasChanges) {
      meshRef.current.instanceMatrix.needsUpdate = true;
      const colorAttr = meshRef.current.geometry.getAttribute('color');
      if (colorAttr) {
        colorAttr.needsUpdate = true;
      }
    }

    // Check if entrance animation is complete
    if (!isInitialized && allEntranceComplete && timeSinceStart > ANIMATION.ENTRANCE_DELAY + ringCount * ANIMATION.STAGGER_DELAY + ANIMATION.ENTRANCE_DURATION + 100) {
      setIsInitialized(true);
    }
  });

  if (ringCount === 0) return null;

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[ringGeometry, ringMaterial, ringCount]}
        frustumCulled={false}
      />
    </group>
  );
}

export default SaturnRings;
