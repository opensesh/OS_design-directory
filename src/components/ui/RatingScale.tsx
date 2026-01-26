import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { getScoreTier, TIER_LABELS, type ScoreTier } from '../../utils/orbital-layout';

interface RatingScaleProps {
  /** Rating score from 1.0 to 10.0 */
  score: number;
  /** Brief rationale for the score (optional) */
  rationale?: string;
  /** Show info icon with tooltip */
  showTooltip?: boolean;
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

      <div className="text-xs text-zinc-400">
        {TIER_LABELS[tier]}
      </div>

      {rationale && (
        <p className="text-xs text-zinc-500 leading-relaxed">
          {rationale}
        </p>
      )}

      <div className="pt-2 border-t border-zinc-700">
        <p className="text-xs text-zinc-600 leading-relaxed">
          Resources are rated based on their overall value to the design community.
        </p>
        <p className="mt-1.5 text-xs text-zinc-600">
          Scores consider: sentiment (30%), utility (30%), accessibility (20%),
          and innovation (20%).
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
}: RatingScaleProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const tier = getScoreTier(score);
  const tierColor = getTierColor(tier);
  const percentage = (score / 10) * 100;

  return (
    <div className="flex items-center gap-4">
      {/* Scale track */}
      <div className="flex-1 relative">
        {/* Number labels */}
        <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
          <span>0</span>
          <span>10</span>
        </div>

        {/* Track container */}
        <div className="h-1.5 bg-zinc-800 rounded-full relative">
          {/* Filled portion */}
          <div
            className="absolute h-full rounded-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
              backgroundColor: tierColor,
            }}
          />

          {/* Indicator dot */}
          <div
            className="absolute w-3 h-3 rounded-full -top-[3px] border-2 border-[#141414] transition-all duration-300"
            style={{
              left: `calc(${percentage}% - 6px)`,
              backgroundColor: tierColor,
            }}
          />
        </div>
      </div>

      {/* Score + Info */}
      <div className="flex items-center gap-2 relative">
        <span className="text-lg font-bold text-[#FFFAEE] tabular-nums">
          {score.toFixed(1)}
        </span>

        {showTooltip && (
          <button
            type="button"
            className="text-zinc-500 hover:text-zinc-400 transition-colors"
            onMouseEnter={() => setIsTooltipOpen(true)}
            onMouseLeave={() => setIsTooltipOpen(false)}
            onClick={() => setIsTooltipOpen(!isTooltipOpen)}
            aria-label={`Rating: ${score.toFixed(1)} - ${TIER_LABELS[tier]}`}
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
            >
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl">
                <TooltipContent score={score} tier={tier} rationale={rationale} />
              </div>
              {/* Arrow */}
              <div className="absolute top-full right-4 -mt-px">
                <div className="w-3 h-3 bg-zinc-900 border-r border-b border-zinc-700 rotate-45 transform -translate-y-1.5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default RatingScale;
