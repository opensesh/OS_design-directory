import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';
import { CATEGORY_COLORS } from '@/types/resource';

export const UniverseLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(true);
  const [touchOpen, setTouchOpen] = useState(true);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="absolute top-4 right-4 z-20">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open legend"
        className="p-2.5 bg-os-surface-dark/80 backdrop-blur-xl rounded-lg border border-os-border-dark hover:border-os-border-dark/60 text-os-text-secondary-dark hover:text-brand-aperol transition-all"
      >
        <Info className="w-5 h-5" />
      </button>

      {/* Dropdown Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            role="region"
            className="absolute top-16 right-0 w-80 max-w-[calc(100vw-2rem)] bg-os-surface-dark/95 backdrop-blur-xl rounded-lg border border-os-border-dark shadow-xl overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto"
          >
            {/* Keyboard Controls - Desktop Only */}
            <div className="hidden md:block">
              <Collapsible open={keyboardOpen} onOpenChange={setKeyboardOpen}>
                <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-os-text-primary-dark hover:bg-os-surface-dark/60 transition-colors border-b border-os-border-dark">
                  <span>Keyboard Controls</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${keyboardOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 py-3 border-b border-os-border-dark">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-os-text-primary-dark mb-2 uppercase tracking-wide">
                        Navigation
                      </h4>
                      <ul className="space-y-1.5 text-sm text-os-text-secondary-dark">
                        <li className="flex items-start gap-2">
                          <kbd className="px-1.5 py-0.5 bg-os-bg-dark rounded text-xs font-mono border border-os-border-dark">
                            WASD
                          </kbd>
                          <span className="leading-relaxed">or Arrow Keys - Pan camera</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <kbd className="px-1.5 py-0.5 bg-os-bg-dark rounded text-xs font-mono border border-os-border-dark">
                            Q
                          </kbd>
                          <span className="leading-relaxed">or + - Zoom in</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <kbd className="px-1.5 py-0.5 bg-os-bg-dark rounded text-xs font-mono border border-os-border-dark">
                            E
                          </kbd>
                          <span className="leading-relaxed">or - - Zoom out</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-os-text-primary-dark mb-2 uppercase tracking-wide">
                        Interaction
                      </h4>
                      <ul className="space-y-1.5 text-sm text-os-text-secondary-dark leading-relaxed">
                        <li>• Click - Select resource</li>
                        <li>• Hover - View details</li>
                        <li>• Drag - Rotate view</li>
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Touch Controls - Mobile Only */}
            <div className="md:hidden">
              <Collapsible open={touchOpen} onOpenChange={setTouchOpen}>
                <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-os-text-primary-dark hover:bg-os-surface-dark/60 transition-colors border-b border-os-border-dark">
                  <span>Touch Controls</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${touchOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 py-3 border-b border-os-border-dark">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-os-text-primary-dark mb-2 uppercase tracking-wide">
                        Navigation
                      </h4>
                      <ul className="space-y-1.5 text-sm text-os-text-secondary-dark leading-relaxed">
                        <li>• Drag - Pan camera</li>
                        <li>• Pinch - Zoom in/out</li>
                        <li>• Two-finger drag - Rotate view</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-os-text-primary-dark mb-2 uppercase tracking-wide">
                        Interaction
                      </h4>
                      <ul className="space-y-1.5 text-sm text-os-text-secondary-dark leading-relaxed">
                        <li>• Tap - Select resource</li>
                        <li>• Touch & hold - View details</li>
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Appearance Info */}
            <Collapsible open={appearanceOpen} onOpenChange={setAppearanceOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-os-text-primary-dark hover:bg-os-surface-dark/60 transition-colors border-b border-os-border-dark">
                <span>Appearance</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${appearanceOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-3 border-b border-os-border-dark">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-os-text-primary-dark mb-2 uppercase tracking-wide">
                      Planet Appearance
                    </h4>
                    <ul className="space-y-1.5 text-sm text-os-text-secondary-dark leading-relaxed">
                      <li>• Size reflects gravity score (1.0-10.0)</li>
                      <li>• Color indicates category</li>
                      <li>• Glow intensity shows rating strength</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-os-text-primary-dark mb-2 uppercase tracking-wide">
                      Saturn Rings
                    </h4>
                    <ul className="space-y-1.5 text-sm text-os-text-secondary-dark leading-relaxed">
                      <li>• Appear on resources rated 9.5 or higher</li>
                      <li>• Indicate top-tier, highly recommended tools</li>
                      <li>• Tilt varies for visual variety</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Category Legend */}
            <Collapsible open={categoryOpen} onOpenChange={setCategoryOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-os-text-primary-dark hover:bg-os-surface-dark/60 transition-colors">
                <span>Categories</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-3">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
                    <div key={category} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-os-text-secondary-dark truncate">
                        {category}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};