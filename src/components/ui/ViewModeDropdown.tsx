import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Table2, LayoutGrid } from 'lucide-react';

interface ViewModeDropdownProps {
  displayMode: '3d' | 'table' | 'card';
  onModeChange: (mode: '3d' | 'table' | 'card') => void;
}

const viewModes = [
  { value: '3d', label: 'Universe View', icon: Box },
  { value: 'card', label: 'Card View', icon: LayoutGrid },
  { value: 'table', label: 'Table View', icon: Table2 },
] as const;

export function ViewModeDropdown({ displayMode, onModeChange }: ViewModeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const currentMode = viewModes.find(m => m.value === displayMode);
  const CurrentIcon = currentMode?.icon || Box;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);
  
  const getButtonClasses = (isActive: boolean) => {
    const base = 'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors';
    if (isActive) {
      return base + ' bg-brand-aperol text-white';
    }
    return base + ' text-os-text-secondary-dark hover:bg-os-bg-dark hover:text-os-text-primary-dark';
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 bg-os-surface-dark/50 border border-os-border-dark rounded-lg text-os-text-secondary-dark hover:text-os-text-primary-dark hover:border-brand-aperol/30 transition-all"
        aria-label="Change view mode"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <CurrentIcon className="w-5 h-5" />
      </button>
      
      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 bg-os-surface-dark border border-os-border-dark rounded-lg shadow-xl overflow-hidden z-50"
            role="listbox"
            aria-label="View mode options"
          >
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = displayMode === mode.value;
              
              return (
                <button
                  key={mode.value}
                  onClick={() => {
                    onModeChange(mode.value);
                    setIsOpen(false);
                  }}
                  className={getButtonClasses(isActive)}
                  role="option"
                  aria-selected={isActive}
                >
                  <Icon className="w-4 h-4" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
