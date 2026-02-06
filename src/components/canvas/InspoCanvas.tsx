import { useRef, useMemo, useEffect, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { calculateCategoryClusters, calculateBoundingSphere, type CategoryCluster } from '../../utils/orbital-layout';
import ResourceNodes, { type ResourceNodesHandle } from './ResourceNodes';
import SaturnRings from './SaturnRings';
import GalaxyBackground from './GalaxyBackground';
import NebulaClusters from './NebulaClusters';
import NebulaPlanes from './NebulaPlanes';
import ClusterLabels from './ClusterLabels';
import type { NormalizedResource } from '../../types/resource';
import { CATEGORY_ORDER, CATEGORY_COLORS } from '../../types/resource';
import { useTheme } from '../../lib/theme-provider';
import { EffectComposer, BrightnessContrast, HueSaturation } from '@react-three/postprocessing';

/**
 * Camera animation configuration
 */
const CAMERA_ANIMATION = {
  DEFAULT_POSITION: new THREE.Vector3(0, 15, 125),
  DEFAULT_TARGET: new THREE.Vector3(0, 0, 0),
  LERP_SPEED: 0.05,
  MIN_DISTANCE: 60,
  MAX_DISTANCE: 180,
  FOV: 60,
};

/**
 * Layer timing configuration for seamless overlapping transitions
 * Each layer begins fading in before the previous layer completes
 */
const LAYER_TIMING = {
  skybox: {
    startDelay: 0,
    duration: 800,    // Faster fade-in
  },
  nebula: {
    startDelay: 100,  // Much sooner (was 400)
    duration: 600,
  },
  nodes: {
    startDelay: 200,  // Much sooner (was 800)
    staggerDelay: 12, // Slightly faster stagger
    duration: 500,
  },
  saturnRings: {
    startDelay: 300,  // Much sooner (was 1000)
    staggerDelay: 12,
    duration: 500,
  },
} as const;

/**
 * Easing function for smooth deceleration
 */
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/**
 * Keyboard navigation configuration
 */
const KEYBOARD_NAV = {
  MOVE_SPEED: 0.8,
  ROTATE_SPEED: 0.02,
};

/**
 * CursorLight
 *
 * A point light that follows the cursor position in 3D space.
 * Creates dynamic clearcoat reflections as the user moves the mouse.
 */
function CursorLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  const { camera, gl } = useThree();
  const mouse = useRef(new THREE.Vector2());
  const worldPos = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    gl.domElement.addEventListener('mousemove', handleMouseMove);
    return () => gl.domElement.removeEventListener('mousemove', handleMouseMove);
  }, [gl]);

  useFrame(() => {
    if (!lightRef.current) return;

    // Project mouse to world space at a fixed depth in front of the nodes
    const tempPos = new THREE.Vector3(mouse.current.x, mouse.current.y, 0.5);
    tempPos.unproject(camera);

    // Calculate direction from camera and scale to desired depth
    const dir = tempPos.sub(camera.position).normalize();
    worldPos.current.copy(camera.position).add(dir.multiplyScalar(30));

    lightRef.current.position.copy(worldPos.current);
  });

  return (
    <pointLight
      ref={lightRef}
      intensity={1.2}
      distance={50}
      decay={2}
      color="#ffffff"
    />
  );
}

/**
 * KeyboardController
 *
 * Handles keyboard navigation for camera movement.
 * Arrow keys or WASD for panning, Q/E for zoom in/out.
 */
function KeyboardController() {
  const { camera, gl } = useThree();
  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    const canvas = gl.domElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if canvas is focused or no input is focused
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    // Make canvas focusable
    canvas.tabIndex = 0;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gl]);

  useFrame(() => {
    const keys = keysPressed.current;
    if (keys.size === 0) return;

    // Get camera right and up vectors for movement
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    camera.getWorldDirection(right);
    right.cross(up).normalize();

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    // Horizontal movement (Arrow Left/Right or A/D)
    if (keys.has('arrowleft') || keys.has('a')) {
      camera.position.add(right.clone().multiplyScalar(-KEYBOARD_NAV.MOVE_SPEED));
    }
    if (keys.has('arrowright') || keys.has('d')) {
      camera.position.add(right.clone().multiplyScalar(KEYBOARD_NAV.MOVE_SPEED));
    }

    // Vertical movement (Arrow Up/Down or W/S)
    if (keys.has('arrowup') || keys.has('w')) {
      camera.position.add(up.clone().multiplyScalar(KEYBOARD_NAV.MOVE_SPEED));
    }
    if (keys.has('arrowdown') || keys.has('s')) {
      camera.position.add(up.clone().multiplyScalar(-KEYBOARD_NAV.MOVE_SPEED));
    }

    // Zoom (Q/E or +/-)
    if (keys.has('q') || keys.has('=') || keys.has('+')) {
      camera.position.add(forward.clone().multiplyScalar(KEYBOARD_NAV.MOVE_SPEED * 2));
    }
    if (keys.has('e') || keys.has('-') || keys.has('_')) {
      camera.position.add(forward.clone().multiplyScalar(-KEYBOARD_NAV.MOVE_SPEED * 2));
    }
  });

  return null;
}

/**
 * InteractionController
 *
 * Handles raycasting for mouse hover and click interactions with resource nodes.
 * Updates cursor style and detects which node is being interacted with.
 */
interface InteractionControllerProps {
  resourceNodesRef: React.RefObject<ResourceNodesHandle | null>;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
  onClickAnimation?: (index: number) => void;
}

function InteractionController({
  resourceNodesRef,
  onHover,
  onClick,
  onClickAnimation,
}: InteractionControllerProps) {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useRef(new THREE.Vector2(-999, -999)); // Start off-screen
  const lastHoveredRef = useRef<number | null>(null);
  const isMouseInCanvasRef = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      isMouseInCanvasRef.current = true;
    };

    const handleClick = (event: MouseEvent) => {
      if (!resourceNodesRef.current) return;

      const mesh = resourceNodesRef.current.getMesh();
      if (!mesh) return;

      const rect = canvas.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse.current, camera);
      const intersects = raycaster.intersectObject(mesh);

      if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
        const index = intersects[0].instanceId;
        const opacity = resourceNodesRef.current.getOpacityAtIndex(index);

        // Only trigger click if node is fully visible (not filtered/dimmed)
        // Must match MIN_HOVER_OPACITY in useFrame
        if (opacity >= 0.5) {
          // Trigger click animation first
          if (onClickAnimation) {
            onClickAnimation(index);
          }
          // Then trigger actual click handler with delay for animation
          setTimeout(() => {
            onClick(index);
          }, 150);
        }
      }
    };

    const handleMouseEnter = () => {
      isMouseInCanvasRef.current = true;
    };

    const handleMouseLeave = () => {
      isMouseInCanvasRef.current = false;
      mouse.current.set(-999, -999); // Move off-screen
      if (lastHoveredRef.current !== null) {
        lastHoveredRef.current = null;
        onHover(null);
        canvas.style.cursor = 'default';
      }
    };

    const handleTouchCancel = () => {
      isMouseInCanvasRef.current = false;
      mouse.current.set(-999, -999);
      if (lastHoveredRef.current !== null) {
        lastHoveredRef.current = null;
        onHover(null);
        canvas.style.cursor = 'default';
      }
    };

    // Handle touch tap for mobile/tablet devices
    const handleTouchEnd = (event: TouchEvent) => {
      if (!resourceNodesRef.current) return;
      
      const mesh = resourceNodesRef.current.getMesh();
      if (!mesh) return;

      // Use the last touch point
      const touch = event.changedTouches[0];
      if (!touch) return;

      const rect = canvas.getBoundingClientRect();
      mouse.current.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse.current, camera);
      const intersects = raycaster.intersectObject(mesh);

      if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
        const index = intersects[0].instanceId;
        const opacity = resourceNodesRef.current.getOpacityAtIndex(index);

        // Only trigger tap if node is fully visible (not filtered/dimmed)
        if (opacity >= 0.5) {
          // Trigger click animation first
          if (onClickAnimation) {
            onClickAnimation(index);
          }
          // Then trigger actual click handler with delay for animation
          setTimeout(() => {
            onClick(index);
          }, 150);
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchcancel', handleTouchCancel);
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchcancel', handleTouchCancel);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [camera, gl, raycaster, resourceNodesRef, onHover, onClick, onClickAnimation]);

  // Perform raycasting on each frame for smooth hover detection
  // With 2x radius screen-space proximity check for delightful gliding experience
  useFrame(() => {
    if (!resourceNodesRef.current || !isMouseInCanvasRef.current) return;

    const mesh = resourceNodesRef.current.getMesh();
    if (!mesh) return;

    raycaster.setFromCamera(mouse.current, camera);
    const intersects = raycaster.intersectObject(mesh);

    let newHovered: number | null = null;

    // Opacity threshold for interaction - excludes DIMMED (0.25) and FILTERED (0.15)
    // Higher threshold prevents hover on nodes during opacity transition
    const MIN_HOVER_OPACITY = 0.5;

    // First check: direct raycaster hit
    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      const index = intersects[0].instanceId;
      const opacity = resourceNodesRef.current.getOpacityAtIndex(index);

      // Only hover if node is fully visible (not filtered/dimmed)
      if (opacity >= MIN_HOVER_OPACITY) {
        newHovered = index;
      }
    }

    // Second check: screen-space proximity for hover radius
    // Reduced from 40px to 25px for less sensitive detection
    if (newHovered === null) {
      const HOVER_RADIUS_PX = 25;
      const canvas = gl.domElement;
      const canvasRect = canvas.getBoundingClientRect();

      // Convert normalized mouse to pixel coordinates
      const mousePixelX = (mouse.current.x * 0.5 + 0.5) * canvasRect.width;
      const mousePixelY = (-mouse.current.y * 0.5 + 0.5) * canvasRect.height;

      let closestIndex = -1;
      let closestDistance = Infinity;

      // Get instance count from mesh
      const instanceCount = mesh.count;
      const tempMatrix = new THREE.Matrix4();
      const tempPosition = new THREE.Vector3();

      for (let i = 0; i < instanceCount; i++) {
        const opacity = resourceNodesRef.current.getOpacityAtIndex(i) ?? 0;
        if (opacity < MIN_HOVER_OPACITY) continue; // Skip filtered/dimmed nodes

        // Get world position from instance matrix
        mesh.getMatrixAt(i, tempMatrix);
        tempPosition.setFromMatrixPosition(tempMatrix);

        // Apply parent group rotation to get actual world position
        const groupRotation = resourceNodesRef.current.getGroupRotation();
        if (groupRotation) {
          // Create rotation matrix from euler
          const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(groupRotation);
          tempPosition.applyMatrix4(rotationMatrix);
        }

        // Project to screen space
        tempPosition.project(camera);
        const screenX = (tempPosition.x * 0.5 + 0.5) * canvasRect.width;
        const screenY = (-tempPosition.y * 0.5 + 0.5) * canvasRect.height;

        // Skip if behind camera
        if (tempPosition.z > 1) continue;

        const dx = mousePixelX - screenX;
        const dy = mousePixelY - screenY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < HOVER_RADIUS_PX && distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }

      if (closestIndex !== -1) {
        newHovered = closestIndex;
      }
    }

    // Update hover state only if changed
    if (newHovered !== lastHoveredRef.current) {
      lastHoveredRef.current = newHovered;
      onHover(newHovered);

      // Update cursor
      gl.domElement.style.cursor = newHovered !== null ? 'pointer' : 'default';
    }
  });

  return null;
}

/**
 * CameraController
 *
 * Handles smooth camera animation when filters change.
 * Only animates once per filter change, then allows free user navigation.
 */
interface CameraControllerProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  isCameraAnimatingRef: React.MutableRefObject<boolean>;
  clusters: CategoryCluster[];
  activeCategory?: string | null;
  filteredResourceIds?: number[] | null;
  matchedCategories?: string[];
  resources: NormalizedResource[];
}

function CameraController({
  controlsRef,
  isCameraAnimatingRef,
  clusters,
  activeCategory,
  filteredResourceIds,
  matchedCategories,
  resources,
}: CameraControllerProps) {
  const { camera } = useThree();
  const targetPositionRef = useRef(CAMERA_ANIMATION.DEFAULT_POSITION.clone());
  const targetLookAtRef = useRef(CAMERA_ANIMATION.DEFAULT_TARGET.clone());
  // Using isCameraAnimatingRef from props instead of local ref
  const animationProgressRef = useRef(0);
  const startPositionRef = useRef(new THREE.Vector3());
  const startLookAtRef = useRef(new THREE.Vector3());

  // Calculate target camera position and trigger animation when filters change
  useEffect(() => {
    // Skip entirely if animation in progress - prevents mid-animation restarts
    if (isCameraAnimatingRef.current) {
      return;
    }

    // Collect visible positions based on filters
    const visiblePositions: Array<{ x: number; y: number; z: number }> = [];

    // If AI filter is active, show matched resources
    if (filteredResourceIds && filteredResourceIds.length > 0) {
      const clusterByCategory = new Map<string, CategoryCluster>();
      for (const cluster of clusters) {
        clusterByCategory.set(cluster.category, cluster);
      }

      for (const resource of resources) {
        if (filteredResourceIds.includes(resource.id)) {
          const cluster = clusterByCategory.get(resource.category || 'Other');
          if (cluster) {
            visiblePositions.push(cluster.center);
          }
        }
      }
    }
    // If category filter is active, show that category's cluster
    else if (activeCategory) {
      const activeCluster = clusters.find(c => c.category === activeCategory);
      if (activeCluster) {
        visiblePositions.push(activeCluster.center);
      }
    }
    // If matched categories from search, show those clusters
    else if (matchedCategories && matchedCategories.length > 0) {
      for (const category of matchedCategories) {
        const cluster = clusters.find(c => c.category === category);
        if (cluster) {
          visiblePositions.push(cluster.center);
        }
      }
    }

    // Calculate bounding sphere and camera position
    if (visiblePositions.length > 0) {
      const bounds = calculateBoundingSphere(visiblePositions);

      // Position camera to see all visible content
      const distance = Math.max(
        CAMERA_ANIMATION.MIN_DISTANCE,
        Math.min(CAMERA_ANIMATION.MAX_DISTANCE, bounds.radius * 3.5)
      );

      // Look at center of visible content
      targetLookAtRef.current.set(bounds.center.x, bounds.center.y, bounds.center.z);

      // Position camera at offset from center
      targetPositionRef.current.set(
        bounds.center.x,
        bounds.center.y + distance * 0.1,
        bounds.center.z + distance
      );

      // Start animation from current position
      startPositionRef.current.copy(camera.position);
      startLookAtRef.current.set(0, 0, 0); // Will be computed from camera direction
      camera.getWorldDirection(startLookAtRef.current);
      startLookAtRef.current.multiplyScalar(50).add(camera.position);

      // Disable OrbitControls during animation to prevent interference
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
      isCameraAnimatingRef.current = true;
      animationProgressRef.current = 0;
    }
    // Note: We no longer force camera back to default when filter is cleared
    // This allows users to keep their current view
  }, [clusters, activeCategory, filteredResourceIds, matchedCategories, resources]);

  // Animate camera towards target (only when animating)
  useFrame((_, delta) => {
    if (!isCameraAnimatingRef.current) return;

    // Increment animation progress
    animationProgressRef.current += delta * 2; // ~0.5 second animation

    if (animationProgressRef.current >= 1) {
      // Animation complete
      isCameraAnimatingRef.current = false;
      animationProgressRef.current = 1;
      
      // Final position/lookAt sync (eliminate floating-point drift)
      camera.position.copy(targetPositionRef.current);
      camera.lookAt(targetLookAtRef.current);
      
      // Sync OrbitControls target to final lookAt position
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetLookAtRef.current);
        controlsRef.current.update(); // Force recalculate controls state
        controlsRef.current.enabled = true; // Re-enable after sync
      }
      
      return; // Exit early, don't run interpolation
    }
    // Ease out cubic for smooth deceleration
    const t = animationProgressRef.current;
    const eased = 1 - Math.pow(1 - t, 3);

    // Interpolate position
    camera.position.lerpVectors(startPositionRef.current, targetPositionRef.current, eased);

    // Interpolate lookAt
    const currentLookAt = new THREE.Vector3().lerpVectors(
      startLookAtRef.current,
      targetLookAtRef.current,
      eased
    );
    camera.lookAt(currentLookAt);
    
    // Sync OrbitControls target to prevent "pull back" effect
    if (controlsRef.current) {
      controlsRef.current.target.copy(currentLookAt);
    }
  });

  return null;
}

/**
 * ResponsiveCamera
 *
 * Adjusts camera distance based on viewport aspect ratio.
 * On ultra-wide displays, moves camera closer to fill the viewport.
 * On narrow/portrait displays, moves camera further back.
 * 
 * IMPORTANT: Only applies responsive adjustment when user hasn't manually zoomed.
 * This allows free zoom/pan after user interaction while preserving initial framing.
 */
interface ResponsiveCameraProps {
  isCameraAnimatingRef: React.MutableRefObject<boolean>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  activeCategory?: string | null;
}

function ResponsiveCamera({ 
  isCameraAnimatingRef, 
  controlsRef,
  activeCategory 
}: ResponsiveCameraProps) {
  const { camera, size } = useThree();
  const targetZRef = useRef(CAMERA_ANIMATION.DEFAULT_POSITION.z);
  const userHasInteractedRef = useRef(false);
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const initialLoadRef = useRef(true);

  // Listen for user interaction via OrbitControls
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleChange = () => {
      // Only mark as interacted if not during programmatic animation
      if (!isCameraAnimatingRef.current) {
        userHasInteractedRef.current = true;
      }
    };

    controls.addEventListener('change', handleChange);
    return () => controls.removeEventListener('change', handleChange);
  }, [controlsRef, isCameraAnimatingRef]);

  // Reset interaction state when category changes (allows camera to frame filtered content)
  useEffect(() => {
    userHasInteractedRef.current = false;
  }, [activeCategory]);

  // Calculate target Z based on aspect ratio - only on actual resize
  useEffect(() => {
    // Skip if size hasn't actually changed
    if (
      size.width === lastSizeRef.current.width && 
      size.height === lastSizeRef.current.height
    ) {
      return;
    }
    lastSizeRef.current = { width: size.width, height: size.height };

    const aspectRatio = size.width / size.height;
    const baseZ = CAMERA_ANIMATION.DEFAULT_POSITION.z; // 125

    // Target aspect ratio (16:9 = 1.78)
    const targetAspect = 1.78;

    let newZ = baseZ;

    if (aspectRatio > targetAspect) {
      // Ultra-wide: move closer (min 80)
      const widthFactor = aspectRatio / targetAspect;
      newZ = Math.max(80, baseZ / Math.sqrt(widthFactor));
    } else if (aspectRatio < targetAspect) {
      // Narrow/portrait: move further back (max 180)
      const heightFactor = targetAspect / aspectRatio;
      newZ = Math.min(180, baseZ * Math.sqrt(heightFactor));
    }

    targetZRef.current = newZ;

    // Snap to position on initial load only
    if (initialLoadRef.current) {
      camera.position.z = newZ;
      initialLoadRef.current = false;
    }
  }, [size.width, size.height, camera]);

  // Only lerp if user hasn't interacted - allows free zoom after user input
  useFrame(() => {
    if (isCameraAnimatingRef.current) return;
    if (userHasInteractedRef.current) return;  // Don't fight user zoom

    const currentZ = camera.position.z;
    const targetZ = targetZRef.current;

    if (Math.abs(currentZ - targetZ) > 0.1) {
      camera.position.z += (targetZ - currentZ) * 0.05;
    }
  });

  return null;
}

/**
 * Galaxy system - clusters and nodes
 */
interface GalaxySystemProps {
  isCameraAnimatingRef: React.MutableRefObject<boolean>;
  resources: NormalizedResource[];
  clusters: CategoryCluster[];
  activeCategory?: string | null;
  activeFilter?: string | null;
  activeSubFilter?: string | null;
  filteredResourceIds?: number[] | null;
  matchedCategories?: string[];
  hoveredIndex: number | null;
  clickedIndex: number | null;
  masterStartTime: number;
  resourceNodesRef: React.RefObject<ResourceNodesHandle>;
  onReady?: () => void;
}

function GalaxySystem({
  isCameraAnimatingRef,
  resources,
  clusters,
  activeCategory,
  activeFilter,
  activeSubFilter,
  filteredResourceIds,
  matchedCategories,
  hoveredIndex,
  clickedIndex,
  masterStartTime,
  resourceNodesRef,
  onReady,
}: GalaxySystemProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Layer progress for smooth overlapping transitions
  const layerProgressRef = useRef({ skybox: 0, nebula: 0, nodes: 0, rings: 0 });
  const [layerProgress, setLayerProgress] = useState({ skybox: 0, nebula: 0, nodes: 0, rings: 0 });
  
  // Track whether onReady has been called
  const hasCalledOnReady = useRef(false);

  // Slow rotation - pause when hovering for easier interaction
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (hoveredIndex === null && !isCameraAnimatingRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
    
    // Calculate layer progress based on master timeline
    const elapsed = Date.now() - masterStartTime;
    
    const skyboxRaw = Math.max(0, elapsed - LAYER_TIMING.skybox.startDelay) / LAYER_TIMING.skybox.duration;
    const nebulaRaw = Math.max(0, elapsed - LAYER_TIMING.nebula.startDelay) / LAYER_TIMING.nebula.duration;
    const nodesRaw = Math.max(0, elapsed - LAYER_TIMING.nodes.startDelay) / LAYER_TIMING.nodes.duration;
    const ringsRaw = Math.max(0, elapsed - LAYER_TIMING.saturnRings.startDelay) / LAYER_TIMING.saturnRings.duration;
    
    const newProgress = {
      skybox: easeOutCubic(skyboxRaw),
      nebula: easeOutCubic(nebulaRaw),
      nodes: easeOutCubic(nodesRaw),
      rings: easeOutCubic(ringsRaw),
    };
    
    // Only update state if values changed significantly (for performance)
    if (
      Math.abs(newProgress.skybox - layerProgressRef.current.skybox) > 0.01 ||
      Math.abs(newProgress.nebula - layerProgressRef.current.nebula) > 0.01 ||
      Math.abs(newProgress.nodes - layerProgressRef.current.nodes) > 0.01 ||
      Math.abs(newProgress.rings - layerProgressRef.current.rings) > 0.01
    ) {
      layerProgressRef.current = newProgress;
      setLayerProgress(newProgress);
    }
    
    // Check if ready to fire onReady callback
    if (
      !hasCalledOnReady.current &&
      layerProgressRef.current.skybox >= 0.95 &&
      layerProgressRef.current.nebula >= 0.95 &&
      layerProgressRef.current.nodes >= 0.5
    ) {
      hasCalledOnReady.current = true;
      onReady?.();
    }
  });

  return (
    <group ref={groupRef}>
      {/* Volumetric nebula clouds (background layer) */}
      {clusters.length > 0 && (
        <NebulaPlanes
          clusters={clusters}
          activeCategory={activeCategory || null}
          matchedCategories={matchedCategories}
          globalOpacity={layerProgress.nebula}
        />
      )}

      {/* Category cluster particle halos */}
      {clusters.length > 0 && (
        <NebulaClusters
          clusters={clusters}
          activeCategory={activeCategory || null}
          matchedCategories={matchedCategories}
          globalOpacity={layerProgress.nebula}
        />
      )}

      {/* Category labels in 3D space - wrapped in own Suspense to prevent font loading from blocking other components */}
      {clusters.length > 0 && (
        <Suspense fallback={null}>
          <ClusterLabels
            clusters={clusters}
            activeCategory={activeCategory || null}
            matchedCategories={matchedCategories}
          />
        </Suspense>
      )}

      {/* Resource nodes */}
      {resources.length > 0 && (
        <ResourceNodes
          ref={resourceNodesRef}
          resources={resources}
          clusters={clusters}
          activeCategory={activeCategory}
          activeFilter={activeFilter}
          activeSubFilter={activeSubFilter}
          filteredResourceIds={filteredResourceIds}
          entranceProgress={layerProgress.nodes}
          hoveredIndex={hoveredIndex}
          clickedIndex={clickedIndex}
        />
      )}

      {/* Saturn rings for high-score resources (9+) */}
      {resources.length > 0 && (
        <SaturnRings
          resources={resources}
          clusters={clusters}
          activeCategory={activeCategory}
          activeFilter={activeFilter}
          activeSubFilter={activeSubFilter}
          filteredResourceIds={filteredResourceIds}
          hoveredIndex={hoveredIndex}
          clickedIndex={clickedIndex}
          entranceProgress={layerProgress.rings}
        />
      )}
    </group>
  );
}

/**
 * InspoCanvas Props
 */
interface InspoCanvasProps {
  resources?: NormalizedResource[];
  activeCategory?: string | null;
  activeFilter?: string | null;
  activeSubFilter?: string | null;
  filteredResourceIds?: number[] | null;
  matchedCategories?: string[];
  onResourceHover?: (resource: NormalizedResource | null, mousePosition: { x: number; y: number }) => void;
  onResourceClick?: (resource: NormalizedResource) => void;
  onReady?: () => void;
}

/**
 * InspoCanvas
 *
 * Main canvas component with immersive galaxy view:
 * - Galaxy skybox and starfield background
 * - Category clusters distributed in 3D space
 * - Resource nodes positioned within clusters
 * - Camera animation on filter changes
 */
export default function InspoCanvas({
  resources = [],
  activeCategory,
  activeFilter,
  activeSubFilter,
  filteredResourceIds,
  matchedCategories,
  onResourceHover,
  onResourceClick,
  onReady,
}: InspoCanvasProps) {
  const { resolvedTheme } = useTheme();
  const masterStartTimeRef = useRef<number>(Date.now());
  const resourceNodesRef = useRef<ResourceNodesHandle>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const isCameraAnimatingRef = useRef(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Calculate cluster configurations based on resources
  const clusters = useMemo(() => {
    if (resources.length === 0) return [];
    return calculateCategoryClusters(resources, CATEGORY_ORDER, CATEGORY_COLORS);
  }, [resources]);

  // Track mouse position for tooltip
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePosRef.current = { x: event.clientX, y: event.clientY };

      // If hovering, update parent with new mouse position
      if (hoveredIndex !== null && resourceNodesRef.current) {
        const resource = resourceNodesRef.current.getResourceAtIndex(hoveredIndex);
        if (resource && onResourceHover) {
          onResourceHover(resource, mousePosRef.current);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [hoveredIndex, onResourceHover]);

  // Handle hover changes
  const handleHover = useCallback((index: number | null) => {
    setHoveredIndex(index);

    if (index !== null && resourceNodesRef.current) {
      const resource = resourceNodesRef.current.getResourceAtIndex(index);
      if (resource && onResourceHover) {
        onResourceHover(resource, mousePosRef.current);
      }
    } else if (onResourceHover) {
      onResourceHover(null, mousePosRef.current);
    }
  }, [onResourceHover]);

  // Handle click animation
  const handleClickAnimation = useCallback((index: number) => {
    setClickedIndex(index);
    // Clear clicked state after animation
    setTimeout(() => setClickedIndex(null), 200);
  }, []);

  // Handle click navigation
  const handleClick = useCallback((index: number) => {
    if (resourceNodesRef.current && onResourceClick) {
      const resource = resourceNodesRef.current.getResourceAtIndex(index);
      if (resource) {
        onResourceClick(resource);
      }
    }
  }, [onResourceClick]);

  return (
    <Canvas
      className="w-full h-full"
      camera={{
        position: [0, 15, 125],
        fov: CAMERA_ANIMATION.FOV
      }}
      gl={{ alpha: false }}
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Immersive galaxy background */}
      <Suspense fallback={null}>
        <GalaxyBackground
          masterStartTime={masterStartTimeRef.current}
          resolvedTheme={resolvedTheme}
        />
      </Suspense>

      {/* Lighting setup for physical materials */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1.0} />
      <directionalLight position={[-10, -5, -10]} intensity={0.4} color="#8090ff" />
      <pointLight position={[0, 20, 0]} intensity={0.6} />
      <pointLight position={[-15, -10, 15]} intensity={0.3} color="#ff9060" />

      {/* Cursor-following light for dynamic clearcoat reflections */}
      <CursorLight />

      {/* Keyboard navigation */}
      <KeyboardController />

      {/* Environment map for clearcoat reflections */}
      <Environment preset="night" background={false} />

      {/* Camera animation controller */}
      <CameraController
        controlsRef={controlsRef}
        isCameraAnimatingRef={isCameraAnimatingRef}
        clusters={clusters}
        activeCategory={activeCategory}
        filteredResourceIds={filteredResourceIds}
        matchedCategories={matchedCategories}
        resources={resources}
      />

      {/* Responsive camera for ultra-wide viewports */}
      <ResponsiveCamera 
        isCameraAnimatingRef={isCameraAnimatingRef}
        controlsRef={controlsRef}
        activeCategory={activeCategory}
      />

      {/* Galaxy system - clusters and nodes */}
      <Suspense fallback={null}>
        <GalaxySystem
          isCameraAnimatingRef={isCameraAnimatingRef}
          resources={resources}
          clusters={clusters}
          activeCategory={activeCategory}
          activeFilter={activeFilter}
          activeSubFilter={activeSubFilter}
          filteredResourceIds={filteredResourceIds}
          matchedCategories={matchedCategories}
          hoveredIndex={hoveredIndex}
          clickedIndex={clickedIndex}
          masterStartTime={masterStartTimeRef.current}
          resourceNodesRef={resourceNodesRef}
          onReady={onReady}
        />
      </Suspense>

      {resources.length > 0 && (
        <InteractionController
          resourceNodesRef={resourceNodesRef}
          onHover={handleHover}
          onClick={handleClick}
          onClickAnimation={handleClickAnimation}
        />
      )}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={30}
        maxDistance={200}
        autoRotate={false}
        enablePan={true}
        panSpeed={0.8}
      />

      {/* Post-processing effects - light mode only */}
      {resolvedTheme === 'light' && (
        <EffectComposer>
          <BrightnessContrast
            brightness={0}
            contrast={0.15}
          />
          <HueSaturation
            hue={0}
            saturation={0.2}
          />
        </EffectComposer>
      )}
    </Canvas>
  );
}
