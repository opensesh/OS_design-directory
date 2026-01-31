import { useState, useEffect } from 'react';

/**
 * Detects if the current device is a touch device (mobile/tablet).
 * Returns false during SSR and updates on mount.
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  }, []);

  return isTouch;
}
