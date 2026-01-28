import { useRef, useMemo, useEffect, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { calculateCategoryClusters, calculateBoundingSphere, type CategoryCluster } from '../../utils/orbital-layout';
import ResourceNodes, { type ResourceNodesHandle } from './ResourceNodes';
import GalaxyBackground from './GalaxyBackground';
import NebulaClusters from './NebulaClusters';
import type { NormalizedResource } from '../../types/resource';
import { CATEGORY_ORDER, CATEGORY_COLORS } from '../../types/resource';

/**
 * Camera animation configuration
 */
const CAMERA_ANIMATION = {
  DEFAULT_POSITION: new THREE.Vector3(0, 0, 80),
  DEFAULT_TARGET: new THREE.Vector3(0, 0, 0),
  LERP_SPEED: 0.05,
  MIN_DISTANCE: 40,
  MAX_DISTANCE: 150,
  FOV: 60,
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

        // Only trigger click if node is visible enough
        if (opacity >= 0.1) {
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

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
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

    // First check: direct raycaster hit
    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      const index = intersects[0].instanceId;
      const opacity = resourceNodesRef.current.getOpacityAtIndex(index);

      // Only hover if node is visible enough
      if (opacity >= 0.1) {
        newHovered = index;
      }
    }

    // Second check: screen-space proximity for 2x hover radius
    // This makes hovering feel more forgiving and delightful
    if (newHovered === null) {
      const HOVER_RADIUS_PX = 40; // Approximate 2x visual radius in pixels
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
        if (opacity < 0.1) continue; // Skip filtered nodes

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
  clusters: CategoryCluster[];
  activeCategory?: string | null;
  filteredResourceIds?: number[] | null;
  matchedCategories?: string[];
  resources: NormalizedResource[];
}

function CameraController({
  clusters,
  activeCategory,
  filteredResourceIds,
  matchedCategories,
  resources,
}: CameraControllerProps) {
  const { camera } = useThree();
  const targetPositionRef = useRef(CAMERA_ANIMATION.DEFAULT_POSITION.clone());
  const targetLookAtRef = useRef(CAMERA_ANIMATION.DEFAULT_TARGET.clone());
  const isAnimatingRef = useRef(false);
  const animationProgressRef = useRef(0);
  const startPositionRef = useRef(new THREE.Vector3());
  const startLookAtRef = useRef(new THREE.Vector3());

  // Calculate target camera position and trigger animation when filters change
  useEffect(() => {
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
        Math.min(CAMERA_ANIMATION.MAX_DISTANCE, bounds.radius * 2.5)
      );

      // Look at center of visible content
      targetLookAtRef.current.set(bounds.center.x, bounds.center.y, bounds.center.z);

      // Position camera at offset from center
      targetPositionRef.current.set(
        bounds.center.x,
        bounds.center.y + distance * 0.2,
        bounds.center.z + distance
      );

      // Start animation from current position
      startPositionRef.current.copy(camera.position);
      startLookAtRef.current.set(0, 0, 0); // Will be computed from camera direction
      camera.getWorldDirection(startLookAtRef.current);
      startLookAtRef.current.multiplyScalar(50).add(camera.position);

      isAnimatingRef.current = true;
      animationProgressRef.current = 0;
    }
    // Note: We no longer force camera back to default when filter is cleared
    // This allows users to keep their current view
  }, [clusters, activeCategory, filteredResourceIds, matchedCategories, resources, camera]);

  // Animate camera towards target (only when animating)
  useFrame((_, delta) => {
    if (!isAnimatingRef.current) return;

    // Increment animation progress
    animationProgressRef.current += delta * 2; // ~0.5 second animation

    if (animationProgressRef.current >= 1) {
      // Animation complete - stop animating
      isAnimatingRef.current = false;
      animationProgressRef.current = 1;
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
  });

  return null;
}

/**
 * Galaxy system - clusters and nodes
 */
interface GalaxySystemProps {
  resources: NormalizedResource[];
  clusters: CategoryCluster[];
  activeCategory?: string | null;
  activeFilter?: string | null;
  activeSubFilter?: string | null;
  filteredResourceIds?: number[] | null;
  matchedCategories?: string[];
  hoveredIndex: number | null;
  clickedIndex: number | null;
  resourceNodesRef: React.RefObject<ResourceNodesHandle>;
}

function GalaxySystem({
  resources,
  clusters,
  activeCategory,
  activeFilter,
  activeSubFilter,
  filteredResourceIds,
  matchedCategories,
  hoveredIndex,
  clickedIndex,
  resourceNodesRef,
}: GalaxySystemProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Slow rotation - pause when hovering for easier interaction
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (hoveredIndex === null) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Category cluster halos */}
      {clusters.length > 0 && (
        <NebulaClusters
          clusters={clusters}
          activeCategory={activeCategory || null}
          matchedCategories={matchedCategories}
        />
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
          hoveredIndex={hoveredIndex}
          clickedIndex={clickedIndex}
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
}: InspoCanvasProps) {
  const resourceNodesRef = useRef<ResourceNodesHandle>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
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
        position: [0, 0, 80],
        fov: CAMERA_ANIMATION.FOV
      }}
      gl={{ alpha: false }}
      style={{ background: '#0a0a0f' }}
    >
      {/* Immersive galaxy background */}
      <Suspense fallback={null}>
        <GalaxyBackground />
      </Suspense>

      {/* Lighting setup for physical materials */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1.0} />
      <directionalLight position={[-10, -5, -10]} intensity={0.4} color="#8090ff" />
      <pointLight position={[0, 20, 0]} intensity={0.6} />
      <pointLight position={[-15, -10, 15]} intensity={0.3} color="#ff9060" />

      {/* Cursor-following light for dynamic clearcoat reflections */}
      <CursorLight />

      {/* Environment map for clearcoat reflections */}
      <Environment preset="night" background={false} />

      {/* Camera animation controller */}
      <CameraController
        clusters={clusters}
        activeCategory={activeCategory}
        filteredResourceIds={filteredResourceIds}
        matchedCategories={matchedCategories}
        resources={resources}
      />

      {/* Galaxy system - clusters and nodes */}
      <Suspense fallback={null}>
        <GalaxySystem
          resources={resources}
          clusters={clusters}
          activeCategory={activeCategory}
          activeFilter={activeFilter}
          activeSubFilter={activeSubFilter}
          filteredResourceIds={filteredResourceIds}
          matchedCategories={matchedCategories}
          hoveredIndex={hoveredIndex}
          clickedIndex={clickedIndex}
          resourceNodesRef={resourceNodesRef}
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
        enableDamping
        dampingFactor={0.05}
        minDistance={30}
        maxDistance={200}
        autoRotate={false}
        enablePan={false}
      />
    </Canvas>
  );
}
