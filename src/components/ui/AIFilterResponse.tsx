import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AIFilterResponseProps {
  message: string | null;
  isTyping: boolean;
  onDismiss: () => void;
  matchCount?: number;
}

/**
 * AIFilterResponse
 *
 * Displays AI-generated responses with a delightful typewriter effect.
 * Shows when the user asks a natural language question to filter resources.
 */
export function AIFilterResponse({
  message,
  isTyping: _isTyping,
  onDismiss,
  matchCount,
}: AIFilterResponseProps) {
  // Note: _isTyping is available for future loading state UI
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const charIndexRef = useRef(0);

  // Typewriter effect
  useEffect(() => {
    if (!message) {
      setDisplayedText('');
      setIsComplete(false);
      charIndexRef.current = 0;
      return;
    }

    // Reset when message changes
    setDisplayedText('');
    setIsComplete(false);
    charIndexRef.current = 0;

    const typeNextChar = () => {
      if (charIndexRef.current < message.length) {
        setDisplayedText(message.slice(0, charIndexRef.current + 1));
        charIndexRef.current++;

        // Variable typing speed for natural feel
        const char = message[charIndexRef.current - 1];
        let delay = 25; // Base speed

        if (char === '.' || char === '!' || char === '?') {
          delay = 150; // Pause at sentence end
        } else if (char === ',') {
          delay = 80; // Brief pause at comma
        } else if (char === ' ') {
          delay = 15; // Quick for spaces
        }

        setTimeout(typeNextChar, delay);
      } else {
        setIsComplete(true);
      }
    };

    // Start typing after a brief delay
    const startTimeout = setTimeout(typeNextChar, 300);

    return () => clearTimeout(startTimeout);
  }, [message]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className="bg-zinc-900/80 backdrop-blur-sm rounded-lg border border-zinc-800 p-3 relative">
            {/* Dismiss button */}
            <button
              onClick={onDismiss}
              className="absolute top-2 right-2 p-1 rounded-full text-zinc-500 hover:text-[#FFFAEE] hover:bg-zinc-800/50 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Typing text */}
            <p className="text-sm text-[#FFFAEE] leading-relaxed pr-6">
              {displayedText}
              {/* Blinking cursor while typing */}
              {!isComplete && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-0.5 h-4 bg-[#FE5102] ml-0.5 align-middle"
                />
              )}
            </p>

            {/* Match count badge - appears after typing completes */}
            <AnimatePresence>
              {isComplete && matchCount !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2"
                >
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-800/60 rounded-full text-xs text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FE5102] animate-pulse" />
                    {matchCount} resource{matchCount !== 1 ? 's' : ''} found
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
