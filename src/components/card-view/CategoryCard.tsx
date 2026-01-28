import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCategoryColor } from '../../types/resource';

interface CategoryCardProps {
  category: string;
  count: number;
  isExpanded: boolean;
  isOtherExpanded: boolean;
  onClick: () => void;
}

const CATEGORY_VIDEOS: Record<string, string> = {
  'Community': '/videos/categories/community.mp4',
  'Inspiration': '/videos/categories/inspiration.mp4',
  'Learning': '/videos/categories/learning.mp4',
  'Templates': '/videos/categories/templates.mp4',
  'Tools': '/videos/categories/tools.mp4',
  'AI': '/videos/categories/ai.mp4',
};

export function CategoryCard({
  category,
  count,
  isExpanded,
  isOtherExpanded,
  onClick
}: CategoryCardProps) {
  const categoryColor = getCategoryColor(category);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Control video playback on hover
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isHovered) {
      video.play().catch(() => {
        // Silently handle autoplay restrictions
      });
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isHovered]);

  const videoSrc = CATEGORY_VIDEOS[category];

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative w-full aspect-square rounded-xl text-left overflow-hidden
        bg-os-surface-dark border border-os-border-dark
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 
        focus:ring-offset-2 focus:ring-offset-os-bg-dark
        ${isExpanded ? 'ring-2' : ''}
      `}
      style={{
        borderColor: isExpanded ? categoryColor : undefined,
        boxShadow: isExpanded ? `0 0 30px ${categoryColor}20` : undefined,
      }}
      animate={{
        opacity: isOtherExpanded && !isExpanded ? 0.5 : 1,
        scale: isExpanded ? 1.02 : 1,
      }}
      whileHover={{
        scale: isOtherExpanded ? 1 : 1.02,
        boxShadow: `0 8px 30px ${categoryColor}15`,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Video container - upper portion with padding */}
      <div className="absolute top-3 left-3 right-3 h-[68%] rounded-lg overflow-hidden">
        {videoSrc && (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src={videoSrc}
            muted
            loop
            playsInline
            preload="metadata"
          />
        )}
        
        {/* Vignette overlay - edge gradients to blend into card */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(to right, rgba(28, 28, 28, 0.8) 0%, transparent 15%),
              linear-gradient(to left, rgba(28, 28, 28, 0.8) 0%, transparent 15%),
              linear-gradient(to bottom, rgba(28, 28, 28, 0.8) 0%, transparent 20%),
              linear-gradient(to top, rgba(28, 28, 28, 0.8) 0%, transparent 25%)
            `
          }}
        />
      </div>

      {/* Text section - solid background at bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-2">
        {/* Header row with title and chevron */}
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="text-lg font-display font-semibold text-brand-vanilla">
            {category}
          </h3>
          
          {/* Expand indicator */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              className="text-os-text-secondary-dark"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </div>

        {/* Resource count with Offbit number */}
        <p className="text-sm text-os-text-secondary-dark">
          <span
            className="font-accent font-bold"
            style={{ color: categoryColor }}
          >
            {count}
          </span>
          {' '}Resource{count !== 1 ? 's' : ''}
        </p>
      </div>
    </motion.button>
  );
}
