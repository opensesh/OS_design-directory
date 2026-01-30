import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DotLoader } from './dot-loader';
import { animationPresets } from '@/lib/animation-frames';

interface LoadingStateProps {
  loadingText?: string;
  className?: string;
}

export function LoadingState({
  loadingText = "Loading universe",
  className = "",
}: LoadingStateProps) {
  const [currentAnimIndex, setCurrentAnimIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const charIndexRef = useRef(0);

  // Typewriter effect for loading text
  useEffect(() => {
    const fullText = `${loadingText}...`;
    charIndexRef.current = 0;
    setDisplayedText('');

    const typeNextChar = () => {
      if (charIndexRef.current < fullText.length) {
        setDisplayedText(fullText.slice(0, charIndexRef.current + 1));
        charIndexRef.current++;
        
        // Pause longer at periods for effect
        const delay = fullText[charIndexRef.current - 1] === '.' ? 150 : 50;
        setTimeout(typeNextChar, delay);
      }
    };

    // Start typing after a brief delay
    const startTimeout = setTimeout(typeNextChar, 200);
    return () => clearTimeout(startTimeout);
  }, [loadingText]);

  // Cycle through animations when one completes
  const handleAnimationComplete = () => {
    setCurrentAnimIndex((prev) => (prev + 1) % animationPresets.length);
  };

  const textComplete = displayedText.length >= loadingText.length + 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, filter: "blur(8px)" }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={`flex flex-col items-center gap-4 ${className}`}
    >
      <DotLoader
        frames={animationPresets[currentAnimIndex].frames}
        duration={animationPresets[currentAnimIndex].duration}
        repeatCount={animationPresets[currentAnimIndex].repeatCount}
        onComplete={handleAnimationComplete}
        dotClassName="bg-[#6B7280] [&.active]:bg-[#FE5102]"
      />
      
      <p className="text-sm text-os-text-secondary-dark font-mono lowercase">
        {displayedText}
        {!textComplete && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-0.5 h-4 bg-[#FE5102] ml-0.5 align-middle"
          />
        )}
      </p>
    </motion.div>
  );
}
