import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { generateSphereLayout } from '../../utils/particle-layouts';
import ResourceNodes, { type ResourceNodesHandle } from './ResourceNodes';
import type { NormalizedResource } from '../../types/resource';

/**
 * Animation configuration for central sphere entrance
 */
const SPHERE_ANIMATION = {
  ENTRANCE_DURATION: 800,
  LERP_SPEED: 0.08,
};

/**
 * CentralSphere - The "sun" that resource nodes orbit around
 */
function CentralSphere() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const entranceStartRef = useRef<number>(Date.now());
  const currentScaleRef = useRef<number>(0);

  const particleCount = 2000;
  const radius = 10;
  const particleSize = 0.12;
  const innerColor = '#FFFAEE';
  const outerColor = '#FE5102';

  const positions = useMemo(() => generateSphereLayout(particleCount, radius), []);
  const innerColorObj = useMemo(() => new THREE.Color(innerColor), []);
  const outerColorObj = useMemo(() => new THREE.Color(outerColor), []);

  const colors = useMemo(() => {
    const colorArray = new Float32Array(particleCount * 3);
    const tempColor = new THREE.Color();

    let maxDistance = 0;
    for (let i = 0; i < particleCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const distance = Math.sqrt(x * x + y * y + z * z);
      if (distance > maxDistance) maxDistance = distance;
    }

    if (maxDistance === 0) maxDistance = 1;

    for (let i = 0; i < particleCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const distance = Math.sqrt(x * x + y * y + z * z);
      const t = distance / maxDistance;

      tempColor.copy(innerColorObj).lerp(outerColorObj, t);

      colorArray[i * 3] = tempColor.r;
      colorArray[i * 3 + 1] = tempColor.g;
      colorArray[i * 3 + 2] = tempColor.b;
    }

    return colorArray;
  }, [positions, innerColorObj, outerColorObj]);

  useEffect(() => {
    if (!meshRef.current) return;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < particleCount; i++) {
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

    entranceStartRef.current = Date.now();
  }, [positions, colors]);

  useFrame((_, delta) => {
    if (!groupRef.current || !meshRef.current) return;

    groupRef.current.rotation.y += 0.5 * delta * 0.5;

    const now = Date.now();
    const timeSinceStart = now - entranceStartRef.current;

    let targetScale = 1;
    if (timeSinceStart < SPHERE_ANIMATION.ENTRANCE_DURATION) {
      const progress = timeSinceStart / SPHERE_ANIMATION.ENTRANCE_DURATION;
      targetScale = 1 - Math.pow(1 - progress, 3);
    } else if (!isInitialized) {
      setIsInitialized(true);
    }

    const currentScale = currentScaleRef.current;
    const newScale = currentScale + (targetScale - currentScale) * SPHERE_ANIMATION.LERP_SPEED;

    if (Math.abs(newScale - currentScale) > 0.001) {
      currentScaleRef.current = newScale;

      const dummy = new THREE.Object3D();
      for (let i = 0; i < particleCount; i++) {
        dummy.position.set(
          positions[i * 3] || 0,
          positions[i * 3 + 1] || 0,
          positions[i * 3 + 2] || 0
        );
        dummy.scale.set(newScale, newScale, newScale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
        <sphereGeometry args={[particleSize, 8, 8]} />
        <meshBasicMaterial vertexColors transparent opacity={1} />
      </instancedMesh>
    </group>
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
  useFrame(() => {
    if (!resourceNodesRef.current || !isMouseInCanvasRef.current) return;

    const mesh = resourceNodesRef.current.getMesh();
    if (!mesh) return;

    raycaster.setFromCamera(mouse.current, camera);
    const intersects = raycaster.intersectObject(mesh);

    let newHovered: number | null = null;

    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      const index = intersects[0].instanceId;
      const opacity = resourceNodesRef.current.getOpacityAtIndex(index);

      // Only hover if node is visible enough
      if (opacity >= 0.1) {
        newHovered = index;
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
 * InspoCanvas Props
 */
interface InspoCanvasProps {
  resources?: NormalizedResource[];
  activeFilter?: string | null;
  activeSubFilter?: string | null;
  filteredResourceIds?: number[] | null;
  onResourceHover?: (resource: NormalizedResource | null, mousePosition: { x: number; y: number }) => void;
  onResourceClick?: (resource: NormalizedResource) => void;
}

/**
 * InspoCanvas
 *
 * Main canvas component with:
 * - Central particle sphere (the "sun")
 * - Orbital resource nodes (the "planets")
 * - Orbital camera controls
 * - Raycasting for hover/click interactions
 */
export default function InspoCanvas({
  resources = [],
  activeFilter,
  activeSubFilter,
  filteredResourceIds,
  onResourceHover,
  onResourceClick,
}: InspoCanvasProps) {
  const resourceNodesRef = useRef<ResourceNodesHandle>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

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
        position: [0, 0, 60],
        fov: 60
      }}
      gl={{ alpha: true }}
      style={{ background: '#141414' }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <CentralSphere />

      {resources.length > 0 && (
        <>
          <ResourceNodes
            ref={resourceNodesRef}
            resources={resources}
            activeFilter={activeFilter}
            activeSubFilter={activeSubFilter}
            filteredResourceIds={filteredResourceIds}
            hoveredIndex={hoveredIndex}
            clickedIndex={clickedIndex}
          />
          <InteractionController
            resourceNodesRef={resourceNodesRef}
            onHover={handleHover}
            onClick={handleClick}
            onClickAnimation={handleClickAnimation}
          />
        </>
      )}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={150}
        autoRotate={false}
        enablePan={false}
      />
    </Canvas>
  );
}
