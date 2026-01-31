import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { getCategoryColor } from "../../types/resource";
import { useTouchDevice } from "../../hooks/useTouchDevice";

interface CategoryCardProps {
  category: string;
  count: number;
  isExpanded: boolean;
  isOtherExpanded: boolean;
  onClick: () => void;
}

const CATEGORY_VIDEOS: Record<string, string> = {
  "Community": "/videos/categories/community.mp4",
  "Inspiration": "/videos/categories/inspiration.mp4",
  "Learning": "/videos/categories/learning.mp4",
  "Templates": "/videos/categories/templates.mp4",
  "Tools": "/videos/categories/tools.mp4",
  "AI": "/videos/categories/ai.mp4",
};

const CATEGORY_POSTERS: Record<string, string> = {
  "Community": "/images/posters/community.jpg",
  "Inspiration": "/images/posters/inspiration.jpg",
  "Learning": "/images/posters/learning.jpg",
  "Templates": "/images/posters/templates.jpg",
  "Tools": "/images/posters/tools.jpg",
  "AI": "/images/posters/ai.jpg",
};

const CATEGORY_VIDEO_POSITIONS: Record<string, string> = {
  "AI": "center 30%",
  "Inspiration": "center 30%",
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
  const isReversingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const isTouch = useTouchDevice();

  // On touch devices, play video when expanded; on desktop, play on hover
  const shouldPlayVideo = isTouch ? isExpanded : isHovered;

  // Reverse playback using requestAnimationFrame
  const reversePlayback = useCallback((timestamp: number) => {
    const video = videoRef.current;
    if (!video || !isReversingRef.current) return;

    // Calculate time delta for smooth reverse (~60fps)
    const delta = lastTimeRef.current
      ? (timestamp - lastTimeRef.current) / 1000
      : 0.016;
    lastTimeRef.current = timestamp;

    const newTime = video.currentTime - delta;

    if (newTime <= 0) {
      // Reached start, switch to forward playback
      video.currentTime = 0;
      isReversingRef.current = false;
      video.play().catch(() => {});
    } else {
      video.currentTime = newTime;
      animationFrameRef.current = requestAnimationFrame(reversePlayback);
    }
  }, []);

  // Handle video ending - start reverse playback
  const handleVideoEnded = useCallback(() => {
    isReversingRef.current = true;
    lastTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(reversePlayback);
  }, [reversePlayback]);

  // Control video playback with ping-pong effect
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldPlayVideo) {
      isReversingRef.current = false;
      video.play().catch(() => {
        // Silently handle autoplay restrictions
      });
    } else {
      // Cancel any reverse animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      isReversingRef.current = false;
      video.pause();
      video.currentTime = 0;
    }
  }, [shouldPlayVideo]);

  const videoSrc = CATEGORY_VIDEOS[category];
  const posterSrc = CATEGORY_POSTERS[category];

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative w-full rounded-xl text-left overflow-hidden
        bg-os-surface-dark border border-os-border-dark
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 
        focus:ring-offset-2 focus:ring-offset-os-bg-dark
        aspect-[4/3] sm:aspect-square
        transform-gpu
        ${isExpanded ? "ring-2" : ""}
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
      {/* Outer container - positioning and visual frame */}
      <div className="absolute top-3 left-3 right-3 bottom-[4.5rem] sm:bottom-auto sm:h-[68%] rounded-lg">
        {/* Inner clipping container - 2px smaller on all sides */}
        <div className="absolute inset-[2px] rounded-md overflow-hidden">
          {videoSrc && (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: CATEGORY_VIDEO_POSITIONS[category] }}
              src={videoSrc}
              poster={posterSrc}
              muted
              playsInline
              preload={isTouch ? "none" : "metadata"}
              onEnded={handleVideoEnded}
            />
          )}
        </div>
        
        {/* Vignette overlay - covers full outer container, overlaps inner edges */}
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            boxShadow: "inset 0 0 25px 15px rgba(28, 28, 28, 1)",
            background: `
              linear-gradient(to right, rgba(28, 28, 28, 1) 0%, transparent 25%),
              linear-gradient(to left, rgba(28, 28, 28, 1) 0%, transparent 25%),
              linear-gradient(to bottom, rgba(28, 28, 28, 1) 0%, transparent 30%),
              linear-gradient(to top, rgba(28, 28, 28, 1) 0%, transparent 35%)
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
          {" "}Resource{count !== 1 ? "s" : ""}
        </p>
      </div>
    </motion.button>
  );
}
