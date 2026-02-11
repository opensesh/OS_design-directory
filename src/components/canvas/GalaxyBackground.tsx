import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { generateStarfieldLayout } from '../../utils/particle-layouts';

/**
 * GalaxyBackground Component
 *
 * Creates an immersive space environment with:
 * - Equirectangular skybox texture for 360° galaxy/nebula backdrop
 * - 3D particle starfield for depth and parallax
 *
 * Entrance opacity is driven by the parent's layer timeline (entranceProgress prop).
 * Supports theme-aware crossfading between dark and light skybox textures.
 */

interface StarfieldProps {
  count?: number;
  radius?: number;
  opacity?: number;
}

/**
 * Starfield - 3D particle stars for depth
 * Creates parallax effect on camera movement
 */
function Starfield({ count = 4000, radius = 200, opacity = 1 }: StarfieldProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate star positions using existing starfield layout
  const { positions, sizes, opacities } = useMemo(() => {
    const posArray = generateStarfieldLayout(count, radius);
    const sizeArray = new Float32Array(count);
    const opacityArray = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Varying sizes for visual interest (0.1 to 0.5)
      sizeArray[i] = 0.1 + Math.random() * 0.4;
      // Varying brightness (0.2 to 0.5) - reduced by 50%
      opacityArray[i] = 0.2 + Math.random() * 0.3;
    }

    return {
      positions: posArray,
      sizes: sizeArray,
      opacities: opacityArray,
    };
  }, [count, radius]);

  // Slow rotation for subtle movement
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.01;
      pointsRef.current.rotation.x += delta * 0.005;
    }
  });

  // Custom shader material for per-particle size and opacity
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color('#ffffff') },
        globalOpacity: { value: opacity },
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        varying float vOpacity;

        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float globalOpacity;
        varying float vOpacity;

        void main() {
          // Circular soft particle
          float r = distance(gl_PointCoord, vec2(0.5));
          if (r > 0.5) discard;

          // Soft glow falloff
          float alpha = vOpacity * globalOpacity * (1.0 - smoothstep(0.0, 0.5, r));
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [opacity]);

  // Update global opacity uniform
  useFrame(() => {
    if (shaderMaterial.uniforms.globalOpacity) {
      shaderMaterial.uniforms.globalOpacity.value = opacity;
    }
  });

  return (
    <points ref={pointsRef} material={shaderMaterial}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-opacity"
          count={count}
          array={opacities}
          itemSize={1}
        />
      </bufferGeometry>
    </points>
  );
}

interface SkyboxProps {
  texturePath?: string;
  opacity?: number;
}

/**
 * Skybox - Equirectangular JPEG texture mapped to inside of sphere (dark mode)
 */
function Skybox({ texturePath = '/textures/galaxy/skybox.jpg', opacity = 1 }: SkyboxProps) {
  const texture = useTexture(texturePath);

  useMemo(() => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);

  return (
    <mesh scale={[-500, 500, 500]}>
      <sphereGeometry args={[1, 128, 64]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        depthWrite={false}
        transparent={true}
        opacity={opacity}
      />
    </mesh>
  );
}

interface LightSkyboxProps {
  texturePath?: string;
  opacity?: number;
}

/**
 * LightSkybox - Standard texture mapped to inside of sphere for light mode
 */
function LightSkybox({ texturePath = '/textures/galaxy/skybox-light.jpg', opacity = 1 }: LightSkyboxProps) {
  const texture = useTexture(texturePath);

  useMemo(() => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);

  return (
    <mesh scale={[-500, 500, 500]}>
      <sphereGeometry args={[1, 128, 64]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        depthWrite={false}
        transparent={true}
        opacity={opacity}
      />
    </mesh>
  );
}

interface GalaxyBackgroundProps {
  starCount?: number;
  starRadius?: number;
  showSkybox?: boolean;
  showStarfield?: boolean;
  entranceProgress: number;
  resolvedTheme?: 'light' | 'dark';
}

/**
 * GalaxyBackground
 *
 * Combines skybox and starfield for immersive space environment.
 * The skybox provides the distant galaxy/nebula backdrop,
 * while the starfield adds depth with parallax on camera movement.
 *
 * Entrance opacity is driven by the parent layer timeline via entranceProgress.
 * Supports theme-aware crossfading between dark and light skybox textures.
 */
export default function GalaxyBackground({
  starCount = 4000,
  starRadius = 200,
  showSkybox = true,
  showStarfield = true,
  entranceProgress,
  resolvedTheme = 'dark',
}: GalaxyBackgroundProps) {
  const isLightMode = resolvedTheme === 'light';

  // Theme crossfade (0 = dark, 1 = light) — smooth ref-based lerp
  const themeFadeRef = useRef(isLightMode ? 1 : 0);
  const [themeFade, setThemeFade] = useState(isLightMode ? 1 : 0);

  useFrame(() => {
    const target = isLightMode ? 1 : 0;
    const current = themeFadeRef.current;
    if (Math.abs(target - current) > 0.005) {
      const next = current + (target - current) * 0.08;
      themeFadeRef.current = next;
      setThemeFade(next);
    }
  });

  // Calculate crossfaded opacities from parent's entrance progress
  const darkOpacity = entranceProgress * (1 - themeFade);
  const lightOpacity = entranceProgress * themeFade;

  return (
    <group>
      {/* Dark mode skybox — always rendered so useTexture triggers Suspense */}
      {showSkybox && (
        <Skybox opacity={darkOpacity} />
      )}

      {/* Light mode skybox — always rendered so useTexture triggers Suspense */}
      {showSkybox && (
        <LightSkybox opacity={lightOpacity} />
      )}

      {/* 3D starfield — hidden in light mode */}
      {showStarfield && (
        <Starfield count={starCount} radius={starRadius} opacity={darkOpacity} />
      )}
    </group>
  );
}
