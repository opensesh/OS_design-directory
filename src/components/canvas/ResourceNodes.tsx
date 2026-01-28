import { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import {
  buildGalaxyPositionMap,
  scoreToSizeMultiplier,
  type CategoryCluster,
} from '../../utils/orbital-layout';
import type { NormalizedResource } from '../../types/resource';
import { getCategoryColor } from '../../types/resource';

/**
 * Planet texture paths for node surface detail
 */
const PLANET_TEXTURES = [
  '/textures/planets/2k_jupiter.jpg',
  '/textures/planets/2k_mars.jpg',
  '/textures/planets/2k_mercury.jpg',
  '/textures/planets/2k_neptune.jpg',
  '/textures/planets/2k_saturn.jpg',
  '/textures/planets/2k_uranus.jpg',
  '/textures/planets/2k_venus_atmosphere.jpg',
  '/textures/planets/2k_venus_surface.jpg',
];

/**
 * Seeded random number generator for consistent texture assignment
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
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
  VISIBLE_OPACITY: 1.0,
  HIDDEN_OPACITY: 0.0,           // Keep for semantic clarity (fully hidden)
  FILTERED_OUT_OPACITY: 0.15,    // Filtered nodes stay visible but faded
  DIMMED_OPACITY: 0.25,          // Non-selected category nodes
  HOVER_SCALE: 1.3,
  CLICK_SCALE: 1.5,
  NORMAL_SCALE: 1.0,
  MIN_OPACITY_FOR_INTERACTION: 0.2,  // Above FILTERED_OUT_OPACITY (0.15) so filtered nodes aren't hoverable
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
  clusters: CategoryCluster[];
  activeCategory?: string | null;
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
 * - Score-based sizing: higher gravity scores = larger nodes (~2x range)
 * - Smooth opacity transitions on filter (no size/camera changes)
 * - Hover and click scale animations
 */
const ResourceNodes = forwardRef<ResourceNodesHandle, ResourceNodesProps>(
  function ResourceNodes({
    resources,
    clusters,
    activeCategory,
    activeFilter,
    activeSubFilter,
    filteredResourceIds,
    hoveredIndex,
    clickedIndex
  }, ref) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);

    // Load planet textures using drei's useTexture (handles Suspense gracefully)
    const planetTextures = useTexture(PLANET_TEXTURES);

    // Animation state
    const [isInitialized, setIsInitialized] = useState(false);
    const currentOpacitiesRef = useRef<Float32Array | null>(null);
    const targetOpacitiesRef = useRef<Float32Array | null>(null);
    const currentHoverScalesRef = useRef<Float32Array | null>(null);
    const currentHoverIntensityRef = useRef<Float32Array | null>(null);  // For color enhancement on hover
    const entranceProgressRef = useRef<Float32Array | null>(null);  // Separate entrance progress from opacity
    const entranceStartTimeRef = useRef<number | null>(null);
    const opacityAttributeRef = useRef<THREE.InstancedBufferAttribute | null>(null);
    const hoverIntensityAttributeRef = useRef<THREE.InstancedBufferAttribute | null>(null);

    // Visible count for external access
    const visibleCountRef = useRef(0);

    const nodeRadius = 0.5;
    const resourceCount = resources.length;

    // Expose mesh and resource lookup for raycasting
    useImperativeHandle(ref, () => ({
      getMesh: () => meshRef.current,
      getResourceAtIndex: (index: number) => resources[index] || null,
      getOpacityAtIndex: (index: number) => currentOpacitiesRef.current?.[index] ?? 0,
      getGroupRotation: () => groupRef.current?.rotation || null,
      getVisibleCount: () => visibleCountRef.current,
    }));

    // Calculate FIXED positions, colors, size multipliers, and texture indices for ALL resources
    // Resources are positioned within their category's 3D cluster
    const { positions, colors, sizeMultipliers, textureIndices } = useMemo(() => {
      const count = resources.length;
      const posArray = new Float32Array(count * 3);
      const colorArray = new Float32Array(count * 3);
      const sizeArray = new Float32Array(count);
      const texIndexArray = new Float32Array(count);

      // Build position map using galaxy cluster layout
      const positionMap = buildGalaxyPositionMap(resources, clusters);

      resources.forEach((resource, index) => {
        const pos = positionMap.get(String(resource.id)) || { x: 0, y: 0, z: 0 };

        posArray[index * 3] = pos.x;
        posArray[index * 3 + 1] = pos.y;
        posArray[index * 3 + 2] = pos.z;

        const colorHex = getCategoryColor(resource.category);
        const color = new THREE.Color(colorHex);

        colorArray[index * 3] = color.r;
        colorArray[index * 3 + 1] = color.g;
        colorArray[index * 3 + 2] = color.b;

        // Score-based size multiplier (0.8x to 1.4x)
        sizeArray[index] = scoreToSizeMultiplier(resource.gravityScore);

        // Seeded random texture index based on resource ID for consistency
        texIndexArray[index] = Math.floor(seededRandom(resource.id) * PLANET_TEXTURES.length);
      });

      return {
        positions: posArray,
        colors: colorArray,
        sizeMultipliers: sizeArray,
        textureIndices: texIndexArray,
      };
    }, [resources, clusters]);

    // Initialize opacity, hover scale, and entrance progress arrays
    useEffect(() => {
      if (resourceCount === 0) return;

      if (!currentOpacitiesRef.current || currentOpacitiesRef.current.length !== resourceCount) {
        currentOpacitiesRef.current = new Float32Array(resourceCount).fill(0);
        targetOpacitiesRef.current = new Float32Array(resourceCount).fill(ANIMATION.VISIBLE_OPACITY);
        currentHoverScalesRef.current = new Float32Array(resourceCount).fill(ANIMATION.NORMAL_SCALE);
        currentHoverIntensityRef.current = new Float32Array(resourceCount).fill(0);  // Start muted
        entranceProgressRef.current = new Float32Array(resourceCount).fill(0);  // Track entrance separately
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
        let categoryDimmed = false;

        // AI filter takes priority if set
        if (filteredResourceIds && filteredResourceIds.length > 0) {
          shouldBeVisible = filteredResourceIds.includes(resource.id);
        } else {
          // Category selection for ring highlighting
          if (activeCategory) {
            categoryDimmed = resource.category !== activeCategory;
          }

          // Category filter (legacy)
          if (activeFilter) {
            shouldBeVisible = resource.category === activeFilter;
          }

          // Subcategory filter (only applies if category matches)
          if (shouldBeVisible && activeSubFilter) {
            shouldBeVisible = resource.subCategory === activeSubFilter;
          }
        }

        // Determine final opacity (no scale change, only opacity)
        // Filtered-out nodes stay visible but faded, not fully hidden
        if (!shouldBeVisible) {
          targetOpacitiesRef.current![index] = ANIMATION.FILTERED_OUT_OPACITY;
        } else if (categoryDimmed) {
          // Dimmed but still visible at 20% opacity
          targetOpacitiesRef.current![index] = ANIMATION.DIMMED_OPACITY;
        } else {
          targetOpacitiesRef.current![index] = ANIMATION.VISIBLE_OPACITY;
        }

        if (shouldBeVisible && !categoryDimmed) visibleCount++;
      });

      // Update visible count for external access
      visibleCountRef.current = visibleCount;

    }, [activeCategory, activeFilter, activeSubFilter, filteredResourceIds, resources, resourceCount]);

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

        // Add texture index attribute for per-instance texture selection
        const texIndexAttribute = new THREE.InstancedBufferAttribute(textureIndices, 1);
        meshRef.current.geometry.setAttribute('texIndex', texIndexAttribute);

        // Add per-instance opacity attribute
        const opacityArray = new Float32Array(resourceCount).fill(1.0);
        const opacityAttribute = new THREE.InstancedBufferAttribute(opacityArray, 1);
        opacityAttribute.setUsage(THREE.DynamicDrawUsage);  // Will be updated frequently
        meshRef.current.geometry.setAttribute('instanceOpacity', opacityAttribute);
        opacityAttributeRef.current = opacityAttribute;

        // Add per-instance hover intensity attribute for color enhancement
        const hoverIntensityArray = new Float32Array(resourceCount).fill(0);
        const hoverIntensityAttribute = new THREE.InstancedBufferAttribute(hoverIntensityArray, 1);
        hoverIntensityAttribute.setUsage(THREE.DynamicDrawUsage);
        meshRef.current.geometry.setAttribute('hoverIntensity', hoverIntensityAttribute);
        hoverIntensityAttributeRef.current = hoverIntensityAttribute;
      }
    }, [positions, colors, textureIndices, resourceCount]);

    // Animation loop
    useFrame(() => {
      if (!meshRef.current || !groupRef.current || resourceCount === 0) return;
      if (!currentOpacitiesRef.current || !targetOpacitiesRef.current || !currentHoverScalesRef.current) return;
      if (!currentHoverIntensityRef.current) return;
      if (!entranceProgressRef.current || !opacityAttributeRef.current || !hoverIntensityAttributeRef.current) return;

      // Note: Rotation is now handled by parent OrbitalSystem group
      // Note: Camera position stays fixed - no zoom on filter

      const now = Date.now();
      const entranceStart = entranceStartTimeRef.current || now;
      const timeSinceStart = now - entranceStart;

      const dummy = new THREE.Object3D();
      let hasChanges = false;
      let opacityChanged = false;

      for (let i = 0; i < resourceCount; i++) {
        // Entrance animation - track progress separately for scale
        const nodeEntranceDelay = ANIMATION.ENTRANCE_DELAY + (i * ANIMATION.STAGGER_DELAY);
        const timeSinceNodeStart = timeSinceStart - nodeEntranceDelay;

        let entranceScale = entranceProgressRef.current[i];
        if (!isInitialized) {
          if (timeSinceNodeStart <= 0) {
            entranceScale = 0;
          } else if (timeSinceNodeStart < ANIMATION.ENTRANCE_DURATION) {
            const progress = timeSinceNodeStart / ANIMATION.ENTRANCE_DURATION;
            // Ease out quad for smooth pop-in
            entranceScale = progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;
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

        // Lerp filter opacity (independent of scale now)
        const targetOpacity = targetOpacitiesRef.current[i];
        const currentOpacity = currentOpacitiesRef.current[i];
        const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * ANIMATION.FILTER_LERP_SPEED;

        if (Math.abs(newOpacity - currentOpacity) > 0.001) {
          currentOpacitiesRef.current[i] = newOpacity;
          opacityChanged = true;
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

        // Hover intensity for color enhancement (0 = muted, 1 = full color)
        const targetHoverIntensity = isHovered ? 1.0 : 0.0;
        const currentHoverIntensity = currentHoverIntensityRef.current[i];
        const newHoverIntensity = currentHoverIntensity + (targetHoverIntensity - currentHoverIntensity) * ANIMATION.HOVER_LERP_SPEED;

        if (Math.abs(newHoverIntensity - currentHoverIntensity) > 0.001) {
          currentHoverIntensityRef.current[i] = newHoverIntensity;
          hoverIntensityAttributeRef.current.setX(i, newHoverIntensity);
          opacityChanged = true;  // Reuse flag to mark attribute update needed
        }

        // Final scale = entrance scale * hover/click scale * size multiplier
        // Opacity is now handled separately via shader attribute
        const scoreSizeMultiplier = sizeMultipliers[i] || 1;
        const finalScale = Math.max(0.001, entranceScale) * newHoverScale * scoreSizeMultiplier;

        dummy.position.set(
          positions[i * 3] || 0,
          positions[i * 3 + 1] || 0,
          positions[i * 3 + 2] || 0
        );
        dummy.scale.set(finalScale, finalScale, finalScale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);

        // Update per-instance opacity attribute for shader
        opacityAttributeRef.current.setX(i, newOpacity);
      }

      if (hasChanges) {
        meshRef.current.instanceMatrix.needsUpdate = true;
      }

      if (opacityChanged || hasChanges) {
        opacityAttributeRef.current.needsUpdate = true;
        hoverIntensityAttributeRef.current.needsUpdate = true;
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

    // Create custom material with planet texture blending
    // Reduced clearcoat and increased roughness to show textures better
    const customMaterial = useMemo(() => {
      const material = new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 1,
        metalness: 0.05,          // Reduced from 0.1
        roughness: 0.45,          // Increased from 0.3 for less shine
        clearcoat: 0.3,           // Reduced from 0.8 - less glassy
        clearcoatRoughness: 0.4,  // Increased from 0.2 - diffuse the coating
        envMapIntensity: 0.4,     // Reduced from 0.6
      });

      // Set up texture uniforms
      planetTextures.forEach((tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      });

      // Inject custom shader code to sample planet textures
      material.onBeforeCompile = (shader) => {
        // Add texture uniforms
        shader.uniforms.planetTex0 = { value: planetTextures[0] };
        shader.uniforms.planetTex1 = { value: planetTextures[1] };
        shader.uniforms.planetTex2 = { value: planetTextures[2] };
        shader.uniforms.planetTex3 = { value: planetTextures[3] };
        shader.uniforms.planetTex4 = { value: planetTextures[4] };
        shader.uniforms.planetTex5 = { value: planetTextures[5] };
        shader.uniforms.planetTex6 = { value: planetTextures[6] };
        shader.uniforms.planetTex7 = { value: planetTextures[7] };

        // Add varying and attribute declarations to vertex shader
        shader.vertexShader = shader.vertexShader.replace(
          '#include <common>',
          `#include <common>
          attribute float texIndex;
          attribute float instanceOpacity;
          attribute float hoverIntensity;
          varying float vTexIndex;
          varying float vInstanceOpacity;
          varying float vHoverIntensity;
          varying vec2 vPlanetUv;`
        );

        // Pass texture index, opacity, hover intensity, and compute spherical UV in vertex shader
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vTexIndex = texIndex;
          vInstanceOpacity = instanceOpacity;
          vHoverIntensity = hoverIntensity;
          // Compute spherical UV from position for sphere mapping
          vec3 normalizedPos = normalize(position);
          vPlanetUv = vec2(
            atan(normalizedPos.z, normalizedPos.x) / (2.0 * 3.14159265) + 0.5,
            asin(normalizedPos.y) / 3.14159265 + 0.5
          );`
        );

        // Add texture uniforms and varying to fragment shader
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <common>',
          `#include <common>
          uniform sampler2D planetTex0;
          uniform sampler2D planetTex1;
          uniform sampler2D planetTex2;
          uniform sampler2D planetTex3;
          uniform sampler2D planetTex4;
          uniform sampler2D planetTex5;
          uniform sampler2D planetTex6;
          uniform sampler2D planetTex7;
          varying float vTexIndex;
          varying float vInstanceOpacity;
          varying float vHoverIntensity;
          varying vec2 vPlanetUv;

          vec4 samplePlanetTexture(vec2 uv, float idx) {
            int texIdx = int(idx);
            if (texIdx == 0) return texture2D(planetTex0, uv);
            else if (texIdx == 1) return texture2D(planetTex1, uv);
            else if (texIdx == 2) return texture2D(planetTex2, uv);
            else if (texIdx == 3) return texture2D(planetTex3, uv);
            else if (texIdx == 4) return texture2D(planetTex4, uv);
            else if (texIdx == 5) return texture2D(planetTex5, uv);
            else if (texIdx == 6) return texture2D(planetTex6, uv);
            else return texture2D(planetTex7, uv);
          }`
        );

        // Blend planet texture with vertex color and apply per-instance opacity
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          // Sample planet texture
          vec4 planetColor = samplePlanetTexture(vPlanetUv, vTexIndex);
          // Extract luminance for detail
          float luminance = dot(planetColor.rgb, vec3(0.299, 0.587, 0.114));
          // Create texture-influenced version for blending
          vec3 textureInfluence = mix(vec3(luminance), planetColor.rgb, 0.5);
          vec3 texturedColor = diffuseColor.rgb * (0.3 + textureInfluence * 0.7);

          // Hover intensity controls category color prominence
          // Default (0): 10% category, 90% textured (muted, texture-dominant)
          // Hover (1): 60% category, 40% textured (category color prominent)
          float colorMix = mix(0.1, 0.6, vHoverIntensity);
          diffuseColor.rgb = mix(texturedColor, diffuseColor.rgb, colorMix);

          // Apply per-instance opacity for filter fading
          diffuseColor.a *= vInstanceOpacity;`
        );
      };

      materialRef.current = material;
      return material;
    }, [planetTextures]);

    if (resourceCount === 0) return null;

    return (
      <group ref={groupRef}>
        <instancedMesh
          ref={meshRef}
          args={[undefined, undefined, resourceCount]}
          frustumCulled={false}
          material={customMaterial}
        >
          <sphereGeometry args={[nodeRadius, 32, 32]} />
        </instancedMesh>
      </group>
    );
  }
);

export default ResourceNodes;
