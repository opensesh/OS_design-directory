import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CategoryCluster } from '../../utils/orbital-layout';

/**
 * Animation configuration for cluster halos
 */
const ANIMATION = {
  OPACITY_LERP_SPEED: 0.08,
  DEFAULT_OPACITY: 0.65,    // Visible glow when not filtered (compensates for shader math)
  ACTIVE_OPACITY: 0.90,     // Brighter when active/filtered
  MATCHED_OPACITY: 0.75,    // Multi-category search match
  INACTIVE_OPACITY: 0.30,   // Still visible when other category is active
};

/**
 * Simplex 3D noise GLSL code for organic nebula shapes
 */
const NOISE_GLSL = `
  vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

interface ClusterHaloProps {
  cluster: CategoryCluster;
  isActive: boolean;
  isMatched: boolean;
  hasAnyFilter: boolean;
}

/**
 * ClusterHalo - Organic nebula cloud around a category cluster
 *
 * Uses noise-based shader for wispy, organic edges instead of perfect circles.
 * Opacity changes based on filter state for visual hierarchy.
 */
function ClusterHalo({ cluster, isActive, isMatched, hasAnyFilter }: ClusterHaloProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentOpacityRef = useRef(ANIMATION.DEFAULT_OPACITY);
  const pulsePhaseRef = useRef(Math.random() * Math.PI * 2);

  // Create shader material with noise for organic nebula effect
  const material = useMemo(() => {
    const color = new THREE.Color(cluster.color);

    return new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: color },
        uOpacity: { value: ANIMATION.DEFAULT_OPACITY },
        uNoiseScale: { value: 1.2 },
        uSeed: { value: Math.random() * 100 },
        uRadius: { value: cluster.radius * 1.4 },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDir;

        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);

          // Calculate view direction for fresnel
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vViewDir = normalize(cameraPosition - worldPos.xyz);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uNoiseScale;
        uniform float uSeed;
        uniform float uRadius;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDir;

        ${NOISE_GLSL}

        void main() {
          // Fresnel effect - glow strongest at edges (perpendicular to view)
          float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
          fresnel = pow(fresnel, 1.2);

          // Also add center glow based on view alignment
          float centerGlow = pow(abs(dot(vNormal, vViewDir)), 2.0) * 0.4;

          // Multi-octave noise for organic, cloudy shape
          vec3 noiseCoord = vPosition * uNoiseScale * 0.08 + uSeed;
          float slowTime = uTime * 0.03;

          // Layered noise at different scales
          float n = 0.0;
          n += snoise(noiseCoord + slowTime) * 0.5;
          n += snoise(noiseCoord * 2.0 + slowTime * 0.7) * 0.25;
          n += snoise(noiseCoord * 4.0 + slowTime * 0.5) * 0.125;
          n = n * 0.5 + 0.5; // Normalize to 0-1

          // Edge turbulence for wispy boundaries
          float edgeNoise = snoise(vPosition * 0.15 + uSeed + slowTime * 0.5);
          float wispyEdge = max(0.0, edgeNoise * 0.5 + 0.6);

          // Volumetric density variation
          float density = snoise(vPosition * 0.1 + uSeed * 2.0 + slowTime * 0.2);
          density = density * 0.3 + 0.7;

          // Combine fresnel edge glow with center glow and noise
          float glow = (fresnel * 0.7 + centerGlow) * n * wispyEdge * density;

          // Apply opacity
          float alpha = glow * uOpacity;
          alpha = clamp(alpha, 0.0, 0.85);

          // Add subtle color variation based on noise
          vec3 colorVariation = uColor * (0.9 + density * 0.2);

          gl_FragColor = vec4(colorVariation, alpha);
        }
      `,
    });
  }, [cluster.color]);

  // Animate opacity and time uniform
  useFrame((_, delta) => {
    if (!meshRef.current || !material.uniforms) return;

    // Update time for noise animation
    material.uniforms.uTime.value += delta;

    // Update pulse phase for active/matched clusters
    if (isActive || isMatched) {
      pulsePhaseRef.current += delta * 1.5;
    }

    // Determine target opacity
    let targetOpacity = ANIMATION.DEFAULT_OPACITY;

    if (hasAnyFilter) {
      if (isActive) {
        // Pulse when active
        const pulse = Math.sin(pulsePhaseRef.current) * 0.03 + 0.12;
        targetOpacity = Math.max(ANIMATION.ACTIVE_OPACITY, pulse);
      } else if (isMatched) {
        // Subtle pulse for matched categories (add pulse to base opacity)
        const pulse = Math.sin(pulsePhaseRef.current) * 0.05;
        targetOpacity = ANIMATION.MATCHED_OPACITY + pulse;
      } else {
        targetOpacity = ANIMATION.INACTIVE_OPACITY;
      }
    }

    // Lerp opacity
    const currentOpacity = currentOpacityRef.current;
    const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * ANIMATION.OPACITY_LERP_SPEED;

    if (Math.abs(newOpacity - currentOpacity) > 0.0005) {
      currentOpacityRef.current = newOpacity;
      material.uniforms.uOpacity.value = newOpacity;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[cluster.center.x, cluster.center.y, cluster.center.z]}
      material={material}
    >
      <sphereGeometry args={[cluster.radius * 1.4, 48, 48]} />
    </mesh>
  );
}

interface NebulaClustersCoreProps {
  cluster: CategoryCluster;
  isActive: boolean;
  isMatched: boolean;
  hasAnyFilter: boolean;
}

/**
 * NebulaClustersCore - Inner bright core for active clusters
 *
 * Denser, brighter nebula at cluster center for emphasis when active.
 * Uses same noise-based shader as outer halo for visual consistency.
 */
function NebulaClustersCore({ cluster, isActive, isMatched, hasAnyFilter }: NebulaClustersCoreProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentOpacityRef = useRef(0);

  const material = useMemo(() => {
    const color = new THREE.Color(cluster.color);

    return new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: Math.random() * 100 },
        uColor: { value: color },
        uOpacity: { value: 0 },
        uSeed: { value: Math.random() * 100 + 50 },
        uRadius: { value: cluster.radius * 0.4 },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDir;

        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);

          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vViewDir = normalize(cameraPosition - worldPos.xyz);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uSeed;
        uniform float uRadius;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDir;

        ${NOISE_GLSL}

        void main() {
          // Center glow - brightest when looking directly at surface
          float centerGlow = pow(abs(dot(vNormal, vViewDir)), 1.5);

          // Subtle noise for organic feel
          vec3 noiseCoord = vPosition * 0.15 + uSeed;
          float n = snoise(noiseCoord + uTime * 0.05) * 0.3 + 0.7;

          float alpha = centerGlow * n * uOpacity;
          alpha = clamp(alpha, 0.0, 0.8);

          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });
  }, [cluster.color]);

  useFrame((_, delta) => {
    if (!meshRef.current || !material.uniforms) return;

    // Update time for subtle animation
    material.uniforms.uTime.value += delta;

    // Only show core when active or matched
    const shouldShow = hasAnyFilter && (isActive || isMatched);
    const targetOpacity = shouldShow ? 0.2 : 0;

    const currentOpacity = currentOpacityRef.current;
    const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * 0.1;

    if (Math.abs(newOpacity - currentOpacity) > 0.001) {
      currentOpacityRef.current = newOpacity;
      material.uniforms.uOpacity.value = newOpacity;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[cluster.center.x, cluster.center.y, cluster.center.z]}
      material={material}
    >
      <sphereGeometry args={[cluster.radius * 0.4, 32, 32]} />
    </mesh>
  );
}

interface NebulaClustersProps {
  clusters: CategoryCluster[];
  activeCategory?: string | null;
  matchedCategories?: string[];
}

/**
 * NebulaClusters Component
 *
 * Renders soft glowing halos around each category cluster.
 * Provides visual grouping and hierarchy for the galaxy view.
 *
 * Features:
 * - Subtle additive-blended spherical glows
 * - Smooth opacity transitions on filter
 * - Pulse animation for active/matched clusters
 * - Bright inner core for emphasized clusters
 */
export default function NebulaClusters({
  clusters,
  activeCategory,
  matchedCategories,
}: NebulaClustersProps) {
  const hasAnyFilter = activeCategory !== null || (matchedCategories !== undefined && matchedCategories.length > 0);

  if (clusters.length === 0) return null;

  return (
    <group>
      {clusters.map((cluster) => {
        const isActive = activeCategory === cluster.category;
        const isMatched = matchedCategories?.includes(cluster.category) ?? false;

        return (
          <group key={cluster.category}>
            {/* Outer halo glow */}
            <ClusterHalo
              cluster={cluster}
              isActive={isActive}
              isMatched={isMatched}
              hasAnyFilter={hasAnyFilter}
            />

            {/* Inner core (only visible when active/matched) */}
            <NebulaClustersCore
              cluster={cluster}
              isActive={isActive}
              isMatched={isMatched}
              hasAnyFilter={hasAnyFilter}
            />
          </group>
        );
      })}
    </group>
  );
}
