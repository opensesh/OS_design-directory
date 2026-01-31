import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { CATEGORY_COLORS } from '@/types/resource';

interface UniverseLegendProps {
  isOpen: boolean;
  onClose: () => void;
}

type OpenSection = 'keyboard' | 'touch' | 'appearance' | 'categories';

// Animation variants for staggered list items
const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.05 * i,
      type: 'spring',
      stiffness: 400,
      damping: 25
    }
  })
};

export const UniverseLegend: React.FC<UniverseLegendProps> = ({ isOpen, onClose }) => {
  // Accordion state - only one section open at a time
  const [openSection, setOpenSection] = useState<OpenSection | null>('keyboard');
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle function for accordion behavior
  const toggleSection = (section: OpenSection) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Navigation items for keyboard controls
  const keyboardNavItems = [
    { key: 'WASD', desc: 'or Arrow Keys - Pan camera' },
    { key: 'Q', desc: 'or + - Zoom in' },
    { key: 'E', desc: 'or - - Zoom out' }
  ];

  // Interaction items for keyboard controls
  const keyboardInteractionItems = [
    '• Click - Select resource',
    '• Hover - View details',
    '• Drag - Rotate view'
  ];

  // Touch navigation items
  const touchNavItems = [
    '• Drag - Pan camera',
    '• Pinch - Zoom in/out',
    '• Two-finger drag - Rotate view'
  ];

  // Touch interaction items
  const touchInteractionItems = [
    '• Tap - Select resource',
    '• Touch & hold - View details'
  ];

  // Planet appearance items
  const planetAppearanceItems = [
    '• Size reflects gravity score (1.0-10.0)',
    '• Color indicates category'
  ];

  // Saturn rings items
  const saturnRingsItems = [
    '• Appear on resources rated 9.5 or higher',
    '• Indicate top-tier, highly recommended tools',
    '• Tilt varies for visual variety'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            opacity: { duration: 0.2 }
          }}
          role="region"
          className="w-80 max-w-[calc(100vw-2rem)] bg-os-surface-dark/95 backdrop-blur-xl rounded-lg border border-os-border-dark shadow-xl overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto"
        >
          {/* Title Header */}
          <div className="px-4 py-3 border-b border-os-border-dark">
            <h3 className="text-h5 font-accent font-bold text-brand-aperol">
              Legend
            </h3>
          </div>

          {/* Keyboard Controls - Desktop Only */}
          <motion.div
            className="hidden md:block"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.1,
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <Collapsible open={openSection === 'keyboard'} onOpenChange={() => toggleSection('keyboard')}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-os-text-primary-dark hover:bg-os-surface-dark/60 transition-colors border-b border-os-border-dark">
                <span>Keyboard Controls</span>
                <motion.div
                  animate={{ rotate: openSection === 'keyboard' ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-3 border-b border-os-border-dark overflow-hidden">
                <AnimatePresence>
                  {openSection === 'keyboard' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div>
                        <h4 className="text-xs font-semibold text-os-text-primary-dark mb-2 uppercase tracking-wide">
                          Navigation
                        </h4>
                        <ul className="space-y-1.5 text-sm text-os-text-secondary-dark">
                          {keyboardNavItems.map((item, index) => (
                            <motion.li
                              key={item.key}
                              custom={index}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                              className="flex items-start gap-2"
                            >
                              <kbd className="px-1.5 py-0.5 bg-os-bg-dark rounded text-xs font-mono border border-os-border-dark">
                                {item.key}
                              </kbd>
                              <span className="leading-relaxed">{item.desc}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-os-text-primary-dark mb-2 uppercase tracking-wide">
                          Interaction
                        </h4>
                        <ul className="space-y-1.5 text-sm text-os-text-secondary-dark leading-relaxed">
                          {keyboardInteractionItems.map((item, index) => (
                            <motion.li
                              key={item}
                              custom={index + keyboardNavItems.length}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>

          {/* Touch Controls - Mobile Only */}
          <motion.div
            className="md:hidden"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.1,
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <Collapsible open={openSection === 'touch'} onOpenChange={() => toggleSection('touch')}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-os-text-primary-dark hover:bg-os-surface-dark/60 transition-colors border-b border-os-border-dark">
                <span>Touch Controls</span>
                <motion.div
                  animate={{ rotate: openSection === 'touch' ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-3 border-b border-os-border-dark overflow-hidden">
                <AnimatePresence>
                  {openSection === 'touch' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div>
                        <h4 className="text-xs font-semibold text-os-text-primary-dark mb-2 uppercase tracking-wide">
                          Navigation
                        </h4>
                        <ul className="space-y-1.5 text-sm text-os-text-secondary-dark leading-relaxed">
                          {touchNavItems.map((item, index) => (
                            <motion.li
                              key={item}
                              custom={index}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-os-text-primary-dark mb-2 uppercase tracking-wide">
                          Interaction
                        </h4>
                        <ul className="space-y-1.5 text-sm text-os-text-secondary-dark leading-relaxed">
                          {touchInteractionItems.map((item, index) => (
                            <motion.li
                              key={item}
                              custom={index + touchNavItems.length}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>

          {/* Appearance Info */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.15,
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <Collapsible open={openSection === 'appearance'} onOpenChange={() => toggleSection('appearance')}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-os-text-primary-dark hover:bg-os-surface-dark/60 transition-colors border-b border-os-border-dark">
                <span>Appearance</span>
                <motion.div
                  animate={{ rotate: openSection === 'appearance' ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-3 border-b border-os-border-dark overflow-hidden">
                <AnimatePresence>
                  {openSection === 'appearance' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div>
                        <h4 className="text-xs font-semibold text-os-text-primary-dark mb-2 uppercase tracking-wide">
                          Planet Appearance
                        </h4>
                        <ul className="space-y-1.5 text-sm text-os-text-secondary-dark leading-relaxed">
                          {planetAppearanceItems.map((item, index) => (
                            <motion.li
                              key={item}
                              custom={index}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-os-text-primary-dark mb-2 uppercase tracking-wide">
                          Saturn Rings
                        </h4>
                        <ul className="space-y-1.5 text-sm text-os-text-secondary-dark leading-relaxed">
                          {saturnRingsItems.map((item, index) => (
                            <motion.li
                              key={item}
                              custom={index + planetAppearanceItems.length}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>

          {/* Category Legend */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.2,
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <Collapsible open={openSection === 'categories'} onOpenChange={() => toggleSection('categories')}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-os-text-primary-dark hover:bg-os-surface-dark/60 transition-colors">
                <span>Categories</span>
                <motion.div
                  animate={{ rotate: openSection === 'categories' ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-3 overflow-hidden">
                <AnimatePresence>
                  {openSection === 'categories' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-2 gap-2"
                    >
                      {Object.entries(CATEGORY_COLORS).map(([category, color], index) => (
                        <motion.div
                          key={category}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: 0.05 * index,
                            type: 'spring',
                            stiffness: 400,
                            damping: 25
                          }}
                          className="flex items-center gap-2"
                        >
                          <div 
                            className="w-3 h-3 rounded-full shrink-0" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm text-os-text-secondary-dark truncate">
                            {category}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
