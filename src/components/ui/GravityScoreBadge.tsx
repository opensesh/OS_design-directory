import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { getScoreTier, TIER_LABELS, type ScoreTier } from '../../utils/orbital-layout';

interface GravityScoreBadgeProps {
  /** Gravity score from 1.0 to 10.0 */
  score: number;
  /** Brief rationale for the score (optional) */
  rationale?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show info icon with tooltip */
  showTooltip?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get badge colors based on score tier
 */
function getBadgeColors(tier: ScoreTier): {
  bg: string;
  text: string;
  border: string;
} {
  switch (tier) {
    case 'industry-leader':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-500',
        border: 'border-emerald-500/20',
      };
    case 'excellent':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-500',
        border: 'border-amber-500/20',
      };
    case 'good':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-500',
        border: 'border-blue-500/20',
      };
    case 'niche':
      return {
        bg: 'bg-zinc-500/10',
        text: 'text-zinc-400',
        border: 'border-zinc-500/20',
      };
    case 'limited':
    default:
      return {
        bg: 'bg-zinc-500/5',
        text: 'text-zinc-500',
        border: 'border-zinc-500/10',
      };
  }
}

/**
 * Size classes for different variants
 */
const sizeClasses = {
  sm: {
    badge: 'px-1.5 py-0.5 text-xs gap-1',
    icon: 'w-3 h-3',
    score: 'text-xs font-medium',
  },
  md: {
    badge: 'px-2 py-1 text-sm gap-1.5',
    icon: 'w-3.5 h-3.5',
    score: 'text-sm font-semibold',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base gap-2',
    icon: 'w-4 h-4',
    score: 'text-base font-semibold',
  },
};

/**
 * Tooltip content explaining the gravity score
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
          Gravity Score
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
          Resources closer to the center have higher gravity scores, reflecting
          their overall value to the design community.
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
 * GravityScoreBadge Component
 *
 * Displays a gravity score as a colored badge with optional tooltip
 * explaining the score rationale and methodology.
 */
export function GravityScoreBadge({
  score,
  rationale,
  size = 'md',
  showTooltip = true,
  className = '',
}: GravityScoreBadgeProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const tier = getScoreTier(score);
  const colors = getBadgeColors(tier);
  const sizes = sizeClasses[size];

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        className={`
          inline-flex items-center rounded-full border transition-all duration-200
          ${colors.bg} ${colors.text} ${colors.border} ${sizes.badge}
          ${showTooltip ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
        `}
        onMouseEnter={() => showTooltip && setIsTooltipOpen(true)}
        onMouseLeave={() => showTooltip && setIsTooltipOpen(false)}
        onClick={() => showTooltip && setIsTooltipOpen(!isTooltipOpen)}
        aria-label={`Gravity score: ${score.toFixed(1)} - ${TIER_LABELS[tier]}`}
      >
        <span className={sizes.score}>{score.toFixed(1)}</span>
        {showTooltip && <Info className={`${sizes.icon} opacity-60`} />}
      </button>

      {/* Tooltip */}
      <AnimatePresence>
        {isTooltipOpen && showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2"
          >
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl">
              <TooltipContent score={score} tier={tier} rationale={rationale} />
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="w-3 h-3 bg-zinc-900 border-r border-b border-zinc-700 rotate-45 transform -translate-y-1.5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GravityScoreBadge;
