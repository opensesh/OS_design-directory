import { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { generateOrbitalPosition } from '../../utils/orbital-layout';
import type { NormalizedResource } from '../../types/resource';
import { getCategoryColor } from '../../types/resource';

/**
 * Calculate dynamic scale multiplier based on visible node count
 * Fewer nodes = larger nodes for easier interaction
 */
function calculateDensityScale(visibleCount: number): number {
  if (visibleCount === 0) return 1;

  // Scale factors based on visible count
  if (visibleCount <= 2) return 3.5;
  if (visibleCount <= 5) return 2.8;
  if (visibleCount <= 10) return 2.2;
  if (visibleCount <= 20) return 1.8;
  if (visibleCount <= 40) return 1.4;
  if (visibleCount <= 70) return 1.2;
  return 1.0;
}

/**
 * Calculate camera distance based on visible node count
 * Fewer nodes = camera moves closer to fill frame
 */
function calculateCameraDistance(visibleCount: number): number {
  if (visibleCount === 0) return 60;

  if (visibleCount <= 2) return 35;
  if (visibleCount <= 5) return 40;
  if (visibleCount <= 10) return 45;
  if (visibleCount <= 20) return 50;
  if (visibleCount <= 40) return 55;
  return 60;
}

/**
 * Animation configuration
 */
const ANIMATION = {
  ENTRANCE_DELAY: 400,
  STAGGER_DELAY: 20,
  ENTRANCE_DURATION: 600,
  FILTER_LERP_SPEED: 0.1,
  HOVER_LERP_SPEED: 0.15,
  CLICK_LERP_SPEED: 0.3,
  SCALE_LERP_SPEED: 0.08,      // Smooth scale transitions
  CAMERA_LERP_SPEED: 0.05,     // Smooth camera transitions
  VISIBLE_OPACITY: 1.0,
  HIDDEN_OPACITY: 0.0,
  HOVER_SCALE: 1.3,
  CLICK_SCALE: 1.5,
  NORMAL_SCALE: 1.0,
  MIN_OPACITY_FOR_INTERACTION: 0.1,
};

export interface ResourceNodesHandle {
  getMesh: () => THREE.InstancedMesh | null;
  getResourceAtIndex: (index: number) => NormalizedResource | null;
  getOpacityAtIndex: (index: number) => number;
  getGroupRotation: () => THREE.Euler | null;
  getVisibleCount: () => number;
}

interface ResourceNodesProps {
  resources: NormalizedResource[];
  activeFilter?: string | null;
  activeSubFilter?: string | null;
  filteredResourceIds?: number[] | null;
  hoveredIndex?: number | null;
  clickedIndex?: number | null;
}

/**
 * ResourceNodes
 *
 * Renders all resources as individual sphere meshes orbiting the central sphere.
 * Features:
 * - Dynamic sizing: fewer visible nodes = larger nodes
 * - Auto-zoom: camera adjusts to frame visible nodes
 * - Smooth transitions for all changes
 */
const ResourceNodes = forwardRef<ResourceNodesHandle, ResourceNodesProps>(
  function ResourceNodes({
    resources,
    activeFilter,
    activeSubFilter,
    filteredResourceIds,
    hoveredIndex,
    clickedIndex
  }, ref) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree();

    // Animation state
    const [isInitialized, setIsInitialized] = useState(false);
    const currentOpacitiesRef = useRef<Float32Array | null>(null);
    const targetOpacitiesRef = useRef<Float32Array | null>(null);
    const currentHoverScalesRef = useRef<Float32Array | null>(null);
    const entranceStartTimeRef = useRef<number | null>(null);

    // Dynamic scaling state
    const currentDensityScaleRef = useRef(1);
    const targetDensityScaleRef = useRef(1);
    const currentCameraZRef = useRef(60);
    const targetCameraZRef = useRef(60);
    const visibleCountRef = useRef(0);

    const nodeRadius = 0.5;
    const orbitalConfig = { minRadius: 15, maxRadius: 50 };
    const resourceCount = resources.length;

    // Expose mesh and resource lookup for raycasting
    useImperativeHandle(ref, () => ({
      getMesh: () => meshRef.current,
      getResourceAtIndex: (index: number) => resources[index] || null,
      getOpacityAtIndex: (index: number) => currentOpacitiesRef.current?.[index] ?? 0,
      getGroupRotation: () => groupRef.current?.rotation || null,
      getVisibleCount: () => visibleCountRef.current,
    }));

    // Calculate FIXED positions and colors for ALL resources
    const { positions, colors } = useMemo(() => {
      const count = resources.length;
      const posArray = new Float32Array(count * 3);
      const colorArray = new Float32Array(count * 3);

      resources.forEach((resource, index) => {
        const pos = generateOrbitalPosition(
          String(resource.id),
          index,
          count,
          orbitalConfig
        );

        posArray[index * 3] = pos.x;
        posArray[index * 3 + 1] = pos.y;
        posArray[index * 3 + 2] = pos.z;

        const colorHex = getCategoryColor(resource.category);
        const color = new THREE.Color(colorHex);

        colorArray[index * 3] = color.r;
        colorArray[index * 3 + 1] = color.g;
        colorArray[index * 3 + 2] = color.b;
      });

      return { positions: posArray, colors: colorArray };
    }, [resources, orbitalConfig.minRadius, orbitalConfig.maxRadius]);

    // Initialize opacity and hover scale arrays
    useEffect(() => {
      if (resourceCount === 0) return;

      if (!currentOpacitiesRef.current || currentOpacitiesRef.current.length !== resourceCount) {
        currentOpacitiesRef.current = new Float32Array(resourceCount).fill(0);
        targetOpacitiesRef.current = new Float32Array(resourceCount).fill(ANIMATION.VISIBLE_OPACITY);
        currentHoverScalesRef.current = new Float32Array(resourceCount).fill(ANIMATION.NORMAL_SCALE);
        entranceStartTimeRef.current = Date.now();
        setIsInitialized(false);
      }
    }, [resourceCount]);

    // Update target opacities and calculate visible count when filters change
    useEffect(() => {
      if (!targetOpacitiesRef.current || resourceCount === 0) return;

      let visibleCount = 0;

      resources.forEach((resource, index) => {
        let shouldBeVisible = true;

        // AI filter takes priority if set
        if (filteredResourceIds && filteredResourceIds.length > 0) {
          shouldBeVisible = filteredResourceIds.includes(resource.id);
        } else {
          // Category filter
          if (activeFilter) {
            shouldBeVisible = resource.category === activeFilter;
          }

          // Subcategory filter (only applies if category matches)
          if (shouldBeVisible && activeSubFilter) {
            shouldBeVisible = resource.subCategory === activeSubFilter;
          }
        }

        targetOpacitiesRef.current![index] = shouldBeVisible
          ? ANIMATION.VISIBLE_OPACITY
          : ANIMATION.HIDDEN_OPACITY;

        if (shouldBeVisible) visibleCount++;
      });

      // Update visible count and target scales
      visibleCountRef.current = visibleCount;
      targetDensityScaleRef.current = calculateDensityScale(visibleCount);
      targetCameraZRef.current = calculateCameraDistance(visibleCount);

    }, [activeFilter, activeSubFilter, filteredResourceIds, resources, resourceCount]);

    // Initial mesh setup
    useEffect(() => {
      if (!meshRef.current || resourceCount === 0) return;

      const dummy = new THREE.Object3D();

      for (let i = 0; i < resourceCount; i++) {
        dummy.position.set(
          positions[i * 3] || 0,
          positions[i * 3 + 1] || 0,
          positions[i * 3 + 2] || 0
        );
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }

      meshRef.current.instanceMatrix.needsUpdate = true;

      if (meshRef.current.geometry) {
        const colorAttribute = new THREE.InstancedBufferAttribute(colors, 3);
        meshRef.current.geometry.setAttribute('color', colorAttribute);
      }
    }, [positions, colors, resourceCount]);

    // Animation loop
    useFrame((_, delta) => {
      if (!meshRef.current || !groupRef.current || resourceCount === 0) return;
      if (!currentOpacitiesRef.current || !targetOpacitiesRef.current || !currentHoverScalesRef.current) return;

      // Slow orbital rotation - pause when hovering for easier interaction
      if (hoveredIndex === null) {
        groupRef.current.rotation.y += delta * 0.05;
      }

      // Smoothly lerp density scale
      const densityScaleDiff = targetDensityScaleRef.current - currentDensityScaleRef.current;
      if (Math.abs(densityScaleDiff) > 0.001) {
        currentDensityScaleRef.current += densityScaleDiff * ANIMATION.SCALE_LERP_SPEED;
      }

      // Smoothly lerp camera position
      const cameraZDiff = targetCameraZRef.current - currentCameraZRef.current;
      if (Math.abs(cameraZDiff) > 0.01) {
        currentCameraZRef.current += cameraZDiff * ANIMATION.CAMERA_LERP_SPEED;
        camera.position.z = currentCameraZRef.current;
      }

      const now = Date.now();
      const entranceStart = entranceStartTimeRef.current || now;
      const timeSinceStart = now - entranceStart;

      const dummy = new THREE.Object3D();
      let hasChanges = false;

      // Current density scale for this frame
      const densityScale = currentDensityScaleRef.current;

      for (let i = 0; i < resourceCount; i++) {
        // Entrance animation
        const nodeEntranceDelay = ANIMATION.ENTRANCE_DELAY + (i * ANIMATION.STAGGER_DELAY);
        const timeSinceNodeStart = timeSinceStart - nodeEntranceDelay;

        let targetOpacity = targetOpacitiesRef.current[i];

        if (!isInitialized && timeSinceNodeStart < ANIMATION.ENTRANCE_DURATION) {
          if (timeSinceNodeStart <= 0) {
            targetOpacity = 0;
          } else {
            const entranceProgress = timeSinceNodeStart / ANIMATION.ENTRANCE_DURATION;
            const easedProgress = entranceProgress < 0.5
              ? 2 * entranceProgress * entranceProgress
              : 1 - Math.pow(-2 * entranceProgress + 2, 2) / 2;
            targetOpacity = easedProgress * targetOpacitiesRef.current[i];
          }
        }

        // Lerp opacity
        const currentOpacity = currentOpacitiesRef.current[i];
        const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * ANIMATION.FILTER_LERP_SPEED;

        if (Math.abs(newOpacity - currentOpacity) > 0.001) {
          currentOpacitiesRef.current[i] = newOpacity;
          hasChanges = true;
        }

        // Hover and click scale animation
        const isHovered = hoveredIndex === i && newOpacity >= ANIMATION.MIN_OPACITY_FOR_INTERACTION;
        const isClicked = clickedIndex === i;

        // Target scale: clicked > hovered > normal
        let targetHoverScale = ANIMATION.NORMAL_SCALE;
        if (isClicked) {
          targetHoverScale = ANIMATION.CLICK_SCALE;
        } else if (isHovered) {
          targetHoverScale = ANIMATION.HOVER_SCALE;
        }

        const currentHoverScale = currentHoverScalesRef.current[i];
        const lerpSpeed = isClicked ? ANIMATION.CLICK_LERP_SPEED : ANIMATION.HOVER_LERP_SPEED;
        const newHoverScale = currentHoverScale + (targetHoverScale - currentHoverScale) * lerpSpeed;

        if (Math.abs(newHoverScale - currentHoverScale) > 0.001) {
          currentHoverScalesRef.current[i] = newHoverScale;
          hasChanges = true;
        }

        // Final scale = opacity scale * hover/click scale * density scale (for visible nodes)
        const isVisible = targetOpacitiesRef.current[i] > 0;
        const appliedDensityScale = isVisible ? densityScale : 1;
        const finalScale = Math.max(0.001, newOpacity) * newHoverScale * appliedDensityScale;

        dummy.position.set(
          positions[i * 3] || 0,
          positions[i * 3 + 1] || 0,
          positions[i * 3 + 2] || 0
        );
        dummy.scale.set(finalScale, finalScale, finalScale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }

      // Always update if density scale or camera is changing
      if (Math.abs(densityScaleDiff) > 0.001 || Math.abs(cameraZDiff) > 0.01) {
        hasChanges = true;
      }

      if (hasChanges) {
        meshRef.current.instanceMatrix.needsUpdate = true;
      }

      // Check entrance completion
      if (!isInitialized) {
        const lastNodeEntranceEnd = ANIMATION.ENTRANCE_DELAY +
          ((resourceCount - 1) * ANIMATION.STAGGER_DELAY) +
          ANIMATION.ENTRANCE_DURATION;

        if (timeSinceStart > lastNodeEntranceEnd) {
          setIsInitialized(true);
        }
      }
    });

    if (resourceCount === 0) return null;

    return (
      <group ref={groupRef}>
        <instancedMesh
          ref={meshRef}
          args={[undefined, undefined, resourceCount]}
          frustumCulled={false}
        >
          <sphereGeometry args={[nodeRadius, 32, 32]} />
          <meshPhysicalMaterial
            vertexColors
            transparent
            opacity={1}
            metalness={0.1}
            roughness={0.2}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            envMapIntensity={0.8}
          />
        </instancedMesh>
      </group>
    );
  }
);

export default ResourceNodes;
