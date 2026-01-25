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

  const {
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition((finalTranscript) => {
    setInput((prev) => prev + (prev ? ' ' : '') + finalTranscript);
    resetTranscript();
  });

  // Append transcript while listening
  useEffect(() => {
    if (transcript && isListening) {
      setInput((prev) => {
        const base = prev.replace(transcript, '').trim();
        return base + (base ? ' ' : '') + transcript;
      });
    }
  }, [transcript, isListening]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
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
      startListening();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`
          relative bg-zinc-900/80 backdrop-blur-xl rounded-xl
          border transition-all duration-200
          ${isFocused
            ? 'border-[#FE5102] shadow-lg shadow-[#FE5102]/20'
            : 'border-zinc-800 hover:border-zinc-700'
          }
        `}
      >
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-transparent text-[#FFFAEE] placeholder:text-zinc-500 resize-none focus:outline-none min-h-[48px] max-h-[120px] text-sm"
            rows={1}
            aria-label="Search inspiration"
            disabled={isLoading}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-end px-3 py-2 border-t border-zinc-800 gap-2">
          {/* Voice Input */}
          <div className="relative">
            {isListening && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-lg bg-[#FE5102]/30"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: [1, 1.8, 2.2], opacity: [0.6, 0.3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-lg bg-[#FE5102]/20"
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
                  ? 'bg-[#FE5102] text-white'
                  : 'text-zinc-500 hover:text-[#FFFAEE] hover:bg-zinc-800'
              }`}
              aria-label="Voice input"
              title={isListening ? 'Stop recording' : 'Start voice input'}
              whileTap={{ scale: 0.92 }}
            >
              <Mic className="w-4 h-4" />
            </motion.button>
            {voiceError && (
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-red-400 whitespace-nowrap bg-zinc-900 px-2 py-1 rounded">
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
                ? 'bg-[#FE5102] text-white hover:bg-[#FE5102]/90'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
            aria-label="Send"
            title="Send"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
