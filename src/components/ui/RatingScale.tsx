import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Info } from 'lucide-react';
import { getScoreTier, TIER_LABELS, type ScoreTier } from '../../utils/orbital-layout';

interface RatingScaleProps {
  /** Rating score from 1.0 to 10.0 */
  score: number;
  /** Brief rationale for the score (optional) */
  rationale?: string;
  /** Show info icon with tooltip */
  showTooltip?: boolean;
  /** Animate the score and track on mount */
  animateOnMount?: boolean;
}

/**
 * Animated score counter that counts up from 0
 */
function AnimatedScore({
  value,
  delay = 0,
  animate = true,
}: {
  value: number;
  delay?: number;
  animate?: boolean;
}) {
  const spring = useSpring(animate ? 0 : value, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => v.toFixed(1));

  useEffect(() => {
    if (animate) {
      const timeout = setTimeout(() => spring.set(value), delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [value, spring, delay, animate]);

  return <motion.span>{display}</motion.span>;
}

/**
 * Get tier color for the scale fill and indicator
 */
function getTierColor(tier: ScoreTier): string {
  switch (tier) {
    case 'industry-leader':
      return '#10b981'; // emerald-500
    case 'excellent':
      return '#f59e0b'; // amber-500
    case 'good':
      return '#3b82f6'; // blue-500
    case 'niche':
      return '#71717a'; // zinc-500
    case 'limited':
    default:
      return '#52525b'; // zinc-600
  }
}

/**
 * Tooltip content explaining the rating
 */
function TooltipContent({
  score,
  tier,
  rationale,
}: {
  score: number;
  tier: ScoreTier;
  rationale?: string;
}) {
  return (
    <div className="w-64 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">
          Rating
        </span>
        <span className="text-sm font-bold text-white">
          {score.toFixed(1)}
        </span>
      </div>

      <div className="text-xs text-[var(--fg-tertiary)]">
        {TIER_LABELS[tier]}
      </div>

      {rationale && (
        <p className="text-xs text-[var(--fg-tertiary)] leading-relaxed">
          {rationale}
        </p>
      )}

      <div className="pt-2 border-t border-[var(--border-secondary)]">
        <p className="text-xs text-[var(--fg-tertiary)] leading-relaxed">
          Resources are rated based on their overall value to the design community.
        </p>
      </div>
    </div>
  );
}

/**
 * RatingScale Component
 *
 * Displays a rating score as a horizontal visual scale (0-10)
 * with a filled track, indicator dot, and optional tooltip.
 */
export function RatingScale({
  score,
  rationale,
  showTooltip = true,
  animateOnMount = false,
}: RatingScaleProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const tier = getScoreTier(score);
  const tierColor = getTierColor(tier);
  const percentage = (score / 10) * 100;

  return (
    <div
      className="flex items-center gap-4"
      role="region"
      aria-label={`Rating: ${score.toFixed(1)} out of 10, ${TIER_LABELS[tier]}`}
    >
      {/* Scale track */}
      <div className="flex-1 relative">
        {/* Number labels */}
        <div className="flex justify-between text-xs text-[var(--fg-tertiary)] mb-1.5">
          <span>0</span>
          <span>10</span>
        </div>

        {/* Track container */}
        <div
          className="h-1.5 bg-[var(--bg-tertiary)] rounded-full relative"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={10}
          aria-label={`Score: ${score.toFixed(1)}`}
        >
          {/* Filled portion */}
          {animateOnMount ? (
            <motion.div
              className="absolute h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ backgroundColor: tierColor }}
            />
          ) : (
            <div
              className="absolute h-full rounded-full transition-all duration-300"
              style={{
                width: `${percentage}%`,
                backgroundColor: tierColor,
              }}
            />
          )}

          {/* Indicator dot */}
          {animateOnMount ? (
            <motion.div
              className="absolute w-3 h-3 rounded-full -top-[3px] border-2 border-[var(--border-secondary)]"
              initial={{ left: '-6px', scale: 0 }}
              animate={{ left: `calc(${percentage}% - 6px)`, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ backgroundColor: tierColor }}
            />
          ) : (
            <div
              className="absolute w-3 h-3 rounded-full -top-[3px] border-2 border-[var(--border-secondary)] transition-all duration-300"
              style={{
                left: `calc(${percentage}% - 6px)`,
                backgroundColor: tierColor,
              }}
            />
          )}
        </div>
      </div>

      {/* Score + Info */}
      <div className="flex items-center gap-2 relative">
        <span className="text-lg font-bold text-[var(--fg-primary)] tabular-nums">
          {animateOnMount ? (
            <AnimatedScore value={score} delay={0.2} animate={true} />
          ) : (
            score.toFixed(1)
          )}
        </span>

        {showTooltip && (
          <button
            type="button"
            className="text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FE5102]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] rounded"
            onMouseEnter={() => setIsTooltipOpen(true)}
            onMouseLeave={() => setIsTooltipOpen(false)}
            onClick={() => setIsTooltipOpen(!isTooltipOpen)}
            aria-label={`Rating info: ${score.toFixed(1)} - ${TIER_LABELS[tier]}`}
            aria-expanded={isTooltipOpen}
            aria-haspopup="true"
          >
            <Info className="w-4 h-4" />
          </button>
        )}

        {/* Tooltip */}
        <AnimatePresence>
          {isTooltipOpen && showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 bottom-full right-0 mb-2"
              role="tooltip"
            >
              <div className="bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-xl shadow-xl">
                <TooltipContent score={score} tier={tier} rationale={rationale} />
              </div>
              {/* Arrow */}
              <div className="absolute top-full right-4 -mt-px">
                <div className="w-3 h-3 bg-[var(--bg-primary)] border-r border-b border-[var(--border-secondary)] rotate-45 transform -translate-y-1.5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default RatingScale;
