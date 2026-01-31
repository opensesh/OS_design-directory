/**
 * AILoader
 *
 * Animated loader component for universe initialization.
 * Uses DotLoader with ripple animation and "Generating World" text.
 */

import { DotLoader } from './dot-loader';
import { thinkingFrames } from '@/lib/animation-frames';

export function AILoader() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-os-bg-dark gap-4">
      <DotLoader
        frames={thinkingFrames}
        duration={120}
        repeatCount={-1}
        dotClassName="bg-brand-aperol/20 [&.active]:bg-brand-aperol"
      />
      <span className="text-sm text-os-text-secondary-dark">
        Generating World
      </span>
    </div>
  );
}

export default AILoader;
