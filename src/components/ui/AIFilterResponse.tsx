import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AIFilterResponseProps {
  messageId?: number;
  message: string | null;
  isTyping: boolean;
  onDismiss: () => void;
  matchCount?: number;
  autoFadeDelay?: number;
}

/**
 * AIFilterResponse
 *
 * Displays AI-generated responses with a delightful typewriter effect.
 * Shows when the user asks a natural language question to filter resources.
 */
export function AIFilterResponse({
  messageId,
  message,
  isTyping: _isTyping,
  onDismiss,
  matchCount,
  autoFadeDelay = 4000,
}: AIFilterResponseProps) {
  // Note: _isTyping is available for future loading state UI
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const charIndexRef = useRef(0);
  const autoFadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentMessageIdRef = useRef<number | undefined>(undefined);

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
  }, [message, messageId]);

  // Auto-fade timer - dismiss message after delay when typing completes
  useEffect(() => {
    // Clear any existing timer
    if (autoFadeTimerRef.current) {
      clearTimeout(autoFadeTimerRef.current);
      autoFadeTimerRef.current = null;
    }

    // Track current message ID to prevent stale dismissals
    currentMessageIdRef.current = messageId;

    // Only start auto-fade timer when typing is complete
    if (isComplete && message) {
      autoFadeTimerRef.current = setTimeout(() => {
        // Only dismiss if this is still the current message
        if (currentMessageIdRef.current === messageId) {
          onDismiss();
        }
      }, autoFadeDelay);
    }

    return () => {
      if (autoFadeTimerRef.current) {
        clearTimeout(autoFadeTimerRef.current);
        autoFadeTimerRef.current = null;
      }
    };
  }, [isComplete, message, messageId, autoFadeDelay, onDismiss]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-3xl mx-auto"
        >
          <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-secondary)] p-3 relative">
            {/* Dismiss button */}
            <button
              onClick={onDismiss}
              className="absolute top-2 right-2 p-1 rounded-full text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Typing text */}
            <p className="text-sm text-[var(--fg-primary)] leading-relaxed pr-6">
              {displayedText}
              {/* Blinking cursor while typing */}
              {!isComplete && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-0.5 h-4 bg-brand-aperol ml-0.5 align-middle"
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
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-tertiary)] rounded-full text-xs text-[var(--fg-secondary)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-aperol animate-pulse" />
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
