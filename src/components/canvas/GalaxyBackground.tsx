import { useMemo, useRef, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { generateStarfieldLayout } from '../../utils/particle-layouts';

/**
 * Layer timing configuration (must match InspoCanvas)
 */
const LAYER_TIMING = {
  skybox: {
    startDelay: 0,
    duration: 800,    // Faster fade-in
  },
} as const;

/**
 * Theme-specific opacity targets for light mode adaptation
 */
const THEME_OPACITY = {
  dark: { skybox: 1.0, starfield: 1.0, vignette: 0 },
  light: { skybox: 0.35, starfield: 0.25, vignette: 0.7 },
} as const;

/**
 * Easing function for smooth deceleration
 */
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/**
 * GalaxyBackground Component
 *
 * Creates an immersive space environment with:
 * - Equirectangular skybox texture for 360° galaxy/nebula backdrop
 * - 3D particle starfield for depth and parallax
 * - Theme-aware vignette overlay for light mode blending
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
 * Skybox - Equirectangular HDR texture mapped to inside of sphere
 * Uses RGBELoader for proper HDR tone mapping
 */
function Skybox({ texturePath = '/textures/galaxy/skybox.hdr', opacity = 1 }: SkyboxProps) {
  const texture = useLoader(RGBELoader, texturePath);

  // Configure texture for equirectangular mapping
  useMemo(() => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
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
        toneMapped={false}
      />
    </mesh>
  );
}

interface VignetteOverlayProps {
  color: THREE.Color;
  opacity: number;
}

/**
 * VignetteOverlay - Radial gradient sphere for soft edge blending
 * Creates a smooth transition from the 3D scene to the background color.
 * Used in light mode to soften the dark space visualization.
 */
function VignetteOverlay({ color, opacity }: VignetteOverlayProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    uniforms: {
      uColor: { value: color },
      uOpacity: { value: opacity },
    },
    vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec3 vPosition;

      void main() {
        // Calculate angle from forward direction (camera looks at center)
        float angle = acos(abs(vPosition.z));
        float normalizedAngle = angle / 1.5708; // PI/2

        // Smooth gradient from center (transparent) to edges (opaque)
        float gradient = smoothstep(0.25, 0.9, normalizedAngle);

        gl_FragColor = vec4(uColor, gradient * uOpacity);
      }
    `,
  }), []);

  // Update uniforms when props change
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uColor.value = color;
      materialRef.current.uniforms.uOpacity.value = opacity;
    }
  });

  return (
    <mesh scale={[480, 480, 480]}>
      <sphereGeometry args={[1, 64, 32]} />
      <primitive ref={materialRef} object={material} attach="material" />
    </mesh>
  );
}

interface GalaxyBackgroundProps {
  starCount?: number;
  starRadius?: number;
  showSkybox?: boolean;
  showStarfield?: boolean;
  masterStartTime: number;
  resolvedTheme?: 'light' | 'dark';
}

/**
 * GalaxyBackground
 *
 * Combines skybox and starfield for immersive space environment.
 * The skybox provides the distant galaxy/nebula backdrop,
 * while the starfield adds depth with parallax on camera movement.
 *
 * Uses master timeline for synchronized fade-in with other layers.
 * In light mode, reduces opacity and adds a vignette overlay for
 * smoother integration with the warm cream background.
 */
export default function GalaxyBackground({
  starCount = 4000,
  starRadius = 200,
  showSkybox = true,
  showStarfield = true,
  masterStartTime,
  resolvedTheme = 'dark',
}: GalaxyBackgroundProps) {
  const [skyboxOpacity, setSkyboxOpacity] = useState(0.15);
  const [starfieldOpacity, setStarfieldOpacity] = useState(0.15);
  const [vignetteOpacity, setVignetteOpacity] = useState(0);

  // Track theme for smooth transitions
  const prevThemeRef = useRef(resolvedTheme);
  const themeTransitionRef = useRef(1);

  // Determine current theme targets
  const isLightMode = resolvedTheme === 'light';
  const themeTargets = isLightMode ? THEME_OPACITY.light : THEME_OPACITY.dark;

  // Background color for vignette (warm cream for light, charcoal for dark)
  const bgColor = useMemo(
    () => new THREE.Color(isLightMode ? '#faf8f5' : '#141414'),
    [isLightMode]
  );

  // Calculate opacity based on master timeline and theme
  useFrame((_, delta) => {
    // Detect theme change and restart transition
    if (prevThemeRef.current !== resolvedTheme) {
      prevThemeRef.current = resolvedTheme;
      themeTransitionRef.current = 0;
    }

    // Animate theme transition (~300ms)
    if (themeTransitionRef.current < 1) {
      themeTransitionRef.current = Math.min(1, themeTransitionRef.current + delta * 3.3);
    }

    // Calculate entrance animation progress
    const elapsed = Date.now() - masterStartTime;
    const progress = Math.max(0, elapsed - LAYER_TIMING.skybox.startDelay) / LAYER_TIMING.skybox.duration;
    const entranceProgress = easeOutCubic(progress);

    // Combine entrance animation with theme-specific targets
    const targetSkybox = entranceProgress * themeTargets.skybox;
    const targetStarfield = entranceProgress * themeTargets.starfield;
    const targetVignette = entranceProgress * themeTargets.vignette;

    // Smooth lerp for all opacities
    const lerpFactor = 0.08;
    const newSkybox = skyboxOpacity + (targetSkybox - skyboxOpacity) * lerpFactor;
    const newStarfield = starfieldOpacity + (targetStarfield - starfieldOpacity) * lerpFactor;
    const newVignette = vignetteOpacity + (targetVignette - vignetteOpacity) * lerpFactor;

    // Only update state when values change significantly
    if (Math.abs(newSkybox - skyboxOpacity) > 0.005) setSkyboxOpacity(newSkybox);
    if (Math.abs(newStarfield - starfieldOpacity) > 0.005) setStarfieldOpacity(newStarfield);
    if (Math.abs(newVignette - vignetteOpacity) > 0.005) setVignetteOpacity(newVignette);
  });

  return (
    <group>
      {/* Galaxy/nebula skybox - fades in on load */}
      {showSkybox && <Skybox opacity={skyboxOpacity} />}

      {/* 3D starfield for depth - also fades in with skybox */}
      {showStarfield && (
        <Starfield count={starCount} radius={starRadius} opacity={starfieldOpacity} />
      )}

      {/* Vignette overlay - softens edges in light mode */}
      {vignetteOpacity > 0.01 && (
        <VignetteOverlay color={bgColor} opacity={vignetteOpacity} />
      )}
    </group>
  );
}
