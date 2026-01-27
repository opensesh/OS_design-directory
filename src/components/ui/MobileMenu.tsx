import { motion, AnimatePresence } from 'framer-motion';
import { Search, Box, LayoutGrid, Table2, X } from 'lucide-react';

type DisplayMode = '3d' | 'table' | 'card';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
}

export function MobileMenu({
  isOpen,
  onClose,
  onOpenSearch,
  displayMode,
  onDisplayModeChange,
}: MobileMenuProps) {
  const handleSearchClick = () => {
    onOpenSearch();
    onClose();
  };

  const handleModeChange = (mode: DisplayMode) => {
    onDisplayModeChange(mode);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-16 left-0 right-0 bg-os-bg-dark border-b border-os-border-dark z-50 md:hidden"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Search Button - Full Width */}
              <button
                onClick={handleSearchClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-os-surface-dark/50 border border-os-border-dark rounded-lg text-os-text-secondary-dark hover:text-os-text-primary-dark hover:border-brand-aperol/30 transition-all"
              >
                <Search className="w-4 h-4" />
                <span className="text-sm">Search resources...</span>
                <kbd className="text-[10px] px-1.5 py-0.5 bg-os-bg-dark rounded border border-os-border-dark ml-auto">
                  ⌘K
                </kbd>
              </button>

              {/* View Mode Section */}
              <div className="space-y-2">
                <span className="text-xs font-accent uppercase tracking-wider text-os-text-secondary-dark px-1">
                  View Mode
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleModeChange('3d')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                      displayMode === '3d'
                        ? 'bg-brand-aperol text-white border-brand-aperol'
                        : 'bg-os-surface-dark/50 border-os-border-dark text-os-text-secondary-dark hover:text-brand-vanilla'
                    }`}
                  >
                    <Box className="w-5 h-5" />
                    <span className="text-xs font-medium">3D</span>
                  </button>
                  <button
                    onClick={() => handleModeChange('card')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                      displayMode === 'card'
                        ? 'bg-brand-aperol text-white border-brand-aperol'
                        : 'bg-os-surface-dark/50 border-os-border-dark text-os-text-secondary-dark hover:text-brand-vanilla'
                    }`}
                  >
                    <LayoutGrid className="w-5 h-5" />
                    <span className="text-xs font-medium">Cards</span>
                  </button>
                  <button
                    onClick={() => handleModeChange('table')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                      displayMode === 'table'
                        ? 'bg-brand-aperol text-white border-brand-aperol'
                        : 'bg-os-surface-dark/50 border-os-border-dark text-os-text-secondary-dark hover:text-brand-vanilla'
                    }`}
                  >
                    <Table2 className="w-5 h-5" />
                    <span className="text-xs font-medium">Table</span>
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-os-text-secondary-dark hover:text-os-text-primary-dark transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="text-sm">Close</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
