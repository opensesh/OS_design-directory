import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Send } from 'lucide-react';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';

interface InspoChatProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function InspoChat({
  onSubmit,
  isLoading = false,
  placeholder = "Search inspiration resources..."
}: InspoChatProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

// Base text ref to store input before voice starts (prevents word repetition)
  const baseTextRef = useRef('');

const {
  isListening,
  transcript,
  error: voiceError,
  startListening,
  stopListening,
  resetTranscript,
} = useVoiceRecognition((finalTranscript) => {
  const newInput = baseTextRef.current + (baseTextRef.current ? ' ' : '') + finalTranscript;
  setInput(newInput);
  baseTextRef.current = newInput;
  resetTranscript();
});

// Compute display value: show interim transcript during listening
const displayValue = isListening && transcript
  ? baseTextRef.current + (baseTextRef.current ? ' ' : '') + transcript
  : input;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSubmit(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

const handleMicClick = () => {
  if (isListening) {
    stopListening();
  } else {
    baseTextRef.current = input; // Save current input
    startListening();
  }
};

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div
        className={`
          relative bg-os-surface-dark/80 backdrop-blur-xl rounded-xl
          border transition-all duration-200
          ${isFocused
            ? 'border-brand-aperol shadow-lg shadow-brand-aperol/20'
            : 'border-os-border-dark hover:border-os-border-dark/60'
          }
        `}
      >
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={displayValue}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="w-full px-4 py-4 bg-transparent text-os-text-primary-dark placeholder:text-os-text-secondary-dark resize-none focus:outline-none min-h-[76px] max-h-[300px]"
            rows={1}
            aria-label="Search inspiration"
            disabled={isLoading}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-end px-4 py-3 border-t border-os-border-dark gap-2 sm:gap-4">
          {/* Voice Input */}
          <div className="relative">
            {isListening && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-lg bg-brand-aperol/30"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: [1, 1.8, 2.2], opacity: [0.6, 0.3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-lg bg-brand-aperol/20"
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: [1, 1.5, 1.8], opacity: [0.4, 0.2, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                />
              </>
            )}
            <motion.button
              type="button"
              onClick={handleMicClick}
              className={`relative p-2 rounded-lg transition-colors ${
                isListening
                  ? 'bg-brand-aperol text-white'
                  : 'text-os-text-secondary-dark hover:text-os-text-primary-dark hover:bg-os-bg-dark'
              }`}
              aria-label="Voice input"
              title={isListening ? 'Stop recording' : 'Start voice input'}
              whileTap={{ scale: 0.92 }}
            >
              <Mic className="w-5 h-5" />
            </motion.button>
            {voiceError && (
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-red-400 whitespace-nowrap bg-os-surface-dark px-2 py-1 rounded">
                {voiceError}
              </span>
            )}
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-lg transition-all ${
              input.trim() && !isLoading
                ? 'bg-brand-aperol text-white hover:bg-brand-aperol/90'
                : 'text-os-text-secondary-dark/50 cursor-not-allowed'
            }`}
            aria-label="Send"
            title="Send"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
