import { useState, useEffect } from 'react';

/**
 * Hook for smooth interpolation between layouts
 * Uses easeInOutCubic for natural motion
 */
export function useParticleTransition(
  fromPositions: Float32Array,
  toPositions: Float32Array,
  duration: number = 1500
) {
  const [currentPositions, setCurrentPositions] = useState(fromPositions);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!toPositions || fromPositions === toPositions) return;

    setIsAnimating(true);
    const startTime = Date.now();
    const tempPositions = new Float32Array(fromPositions.length);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);

      // Ease-in-out-cubic
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // Lerp positions
      for (let i = 0; i < fromPositions.length; i++) {
        tempPositions[i] = fromPositions[i] + (toPositions[i] - fromPositions[i]) * eased;
      }

      setCurrentPositions(new Float32Array(tempPositions));

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [fromPositions, toPositions, duration]);

  return { currentPositions, isAnimating };
}
