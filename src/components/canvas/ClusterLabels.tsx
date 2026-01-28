import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useFont } from '@react-three/drei';
import * as THREE from 'three';
import type { CategoryCluster } from '../../utils/orbital-layout';

// Preload font at module level to prevent suspension
useFont.preload('/fonts/OffBit-Bold.woff2');

/**
 * Animation configuration for cluster labels
 */
const ANIMATION = {
  OPACITY_LERP_SPEED: 0.08,
  DEFAULT_OPACITY: 0.9,
  ACTIVE_OPACITY: 1.0,
  INACTIVE_OPACITY: 0.5,
  LABEL_OFFSET_Y: 12, // Distance above cluster center
  FONT_SIZE: 6,
};

interface ClusterLabelProps {
  cluster: CategoryCluster;
  isActive: boolean;
  isMatched: boolean;
  hasAnyFilter: boolean;
}

/**
 * ClusterLabel - 3D text label for a category cluster
 *
 * Renders above the cluster center, always facing the camera.
 * Opacity changes based on filter state.
 */
function ClusterLabel({ cluster, isActive, isMatched, hasAnyFilter }: ClusterLabelProps) {
  const textRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const currentOpacityRef = useRef(ANIMATION.DEFAULT_OPACITY);

  // Material for the text
  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: cluster.color,
      transparent: true,
      opacity: ANIMATION.DEFAULT_OPACITY,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [cluster.color]);

  // Animate opacity and billboard effect
  useFrame(() => {
    if (!textRef.current) return;

    // Billboard: always face camera
    textRef.current.quaternion.copy(camera.quaternion);

    // Determine target opacity
    let targetOpacity = ANIMATION.DEFAULT_OPACITY;

    if (hasAnyFilter) {
      if (isActive || isMatched) {
        targetOpacity = ANIMATION.ACTIVE_OPACITY;
      } else {
        targetOpacity = ANIMATION.INACTIVE_OPACITY;
      }
    }

    // Lerp opacity
    const currentOpacity = currentOpacityRef.current;
    const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * ANIMATION.OPACITY_LERP_SPEED;

    if (Math.abs(newOpacity - currentOpacity) > 0.001) {
      currentOpacityRef.current = newOpacity;
      material.opacity = newOpacity;
    }
  });

  return (
    <Text
      ref={textRef}
      position={[
        cluster.center.x,
        cluster.center.y + cluster.radius + ANIMATION.LABEL_OFFSET_Y,
        cluster.center.z,
      ]}
      font="/fonts/OffBit-Bold.woff2"
      fontSize={ANIMATION.FONT_SIZE}
      material={material}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.15}
      outlineColor="#000000"
    >
      {cluster.category}
    </Text>
  );
}

interface ClusterLabelsProps {
  clusters: CategoryCluster[];
  activeCategory?: string | null;
  matchedCategories?: string[];
}

/**
 * ClusterLabels Component
 *
 * Renders 3D text labels above each category cluster.
 * Labels are billboard-style (always face camera) and
 * change opacity based on filter state.
 */
export default function ClusterLabels({
  clusters,
  activeCategory,
  matchedCategories,
}: ClusterLabelsProps) {
  const hasAnyFilter = activeCategory !== null || (matchedCategories !== undefined && matchedCategories.length > 0);

  if (clusters.length === 0) return null;

  return (
    <group>
      {clusters.map((cluster) => {
        const isActive = activeCategory === cluster.category;
        const isMatched = matchedCategories?.includes(cluster.category) ?? false;

        return (
          <ClusterLabel
            key={`label-${cluster.category}`}
            cluster={cluster}
            isActive={isActive}
            isMatched={isMatched}
            hasAnyFilter={hasAnyFilter}
          />
        );
      })}
    </group>
  );
}
