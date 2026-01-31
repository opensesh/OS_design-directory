import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Command } from 'lucide-react';
import { useResourceSearch, type SearchResult } from '../../hooks/useResourceSearch';
import type { NormalizedResource } from '../../types/resource';
import { getCategoryColor } from '../../types/resource';

// Get favicon URL from domain using Google's service
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return '';
  }
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResource: (resource: NormalizedResource) => void;
}

export function SearchModal({ isOpen, onClose, onSelectResource }: SearchModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const { query, setQuery, groupedResults, defaultResults, isSearching, clearSearch } = useResourceSearch({
    debounceMs: 100,
    maxResults: 30,
  });

  // Group default results by category for empty state display
  const defaultGroupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const result of defaultResults) {
      const category = result.resource.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(result);
    }
    return groups;
  }, [defaultResults]);

  // Use search results when query exists, otherwise show default results
  const displayGroupedResults = query.trim() ? groupedResults : defaultGroupedResults;

  // Get ordered categories for consistent navigation
  const orderedCategories = useMemo(() => {
    return Object.keys(displayGroupedResults).sort();
  }, [displayGroupedResults]);

  // Flatten results for keyboard navigation while maintaining category order
  const flatResults = useMemo(() => {
    const flat: SearchResult[] = [];
    for (const category of orderedCategories) {
      flat.push(...displayGroupedResults[category]);
    }
    return flat;
  }, [displayGroupedResults, orderedCategories]);

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus input when modal opens, restore focus on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => inputRef.current?.focus(), 50);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearSearch();
      setSelectedIndex(0);
    }
  }, [isOpen, clearSearch]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Handle selection
  const handleSelect = useCallback((result: SearchResult) => {
    onSelectResource(result.resource);
  }, [onSelectResource]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab') {
        // Focus trap: cycle between input and close button
        if (e.shiftKey && document.activeElement === inputRef.current) {
          e.preventDefault();
          closeButtonRef.current?.focus();
        } else if (!e.shiftKey && document.activeElement === closeButtonRef.current) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < flatResults.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : flatResults.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          handleSelect(flatResults[selectedIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, flatResults, selectedIndex, handleSelect]);

  // Get global index for a result
  const getGlobalIndex = useCallback((result: SearchResult): number => {
    return flatResults.findIndex(r => r.resource.id === result.resource.id);
  }, [flatResults]);

  // Track favicon errors for fallback to letter initial
  const [faviconErrors, setFaviconErrors] = useState<Set<string>>(new Set());

  const handleFaviconError = useCallback((resourceId: string) => {
    setFaviconErrors(prev => new Set(prev).add(resourceId));
  }, []);

  // Render result item
  const renderResultItem = (result: SearchResult, isSelected: boolean, globalIndex: number) => {
    const categoryColor = getCategoryColor(result.resource.category);
    const faviconUrl = getFaviconUrl(result.resource.url);
    const hasFaviconError = faviconErrors.has(String(result.resource.id));
    const showFavicon = faviconUrl && !hasFaviconError;

    return (
      <button
        key={result.resource.id}
        data-index={globalIndex}
        onClick={() => handleSelect(result)}
        onMouseEnter={() => setSelectedIndex(globalIndex)}
        className={`
          w-full flex items-center gap-3
          px-5 py-3
          text-left
          transition-colors
          border-l-4
          ${isSelected ? 'bg-os-surface-dark' : 'hover:bg-os-surface-dark/50'}
        `}
        style={{ borderLeftColor: categoryColor }}
      >
        {/* Favicon or fallback initial */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-os-surface-dark border border-os-border-dark overflow-hidden"
        >
          {showFavicon ? (
            <img
              src={faviconUrl}
              alt=""
              className="w-5 h-5 object-contain"
              onError={() => handleFaviconError(String(result.resource.id))}
            />
          ) : (
            <span className="text-sm font-medium text-os-text-secondary-dark">
              {result.resource.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-os-text-primary-dark truncate">
            {result.resource.name}
          </div>
          {result.resource.description && (
            <div className="text-xs text-os-text-secondary-dark truncate">
              {result.resource.description}
            </div>
          )}
        </div>
        {isSelected && (
          <ArrowRight className="w-4 h-4 text-os-text-secondary-dark flex-shrink-0" />
        )}
      </button>
    );
  };

  // Section header component
  const SectionHeader = ({ title, count }: { title: string; count?: number }) => (
    <div className="px-5 py-2 flex items-center justify-between">
      <span className="text-xs font-accent uppercase tracking-wider text-os-text-primary-dark">
        {title}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-os-text-secondary-dark">
          {count}
        </span>
      )}
    </div>
  );

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal - centered using flex */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-modal-title"
            className="fixed inset-0 z-[201] flex items-start justify-center pt-[12vh] px-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="
                w-full max-w-2xl
                bg-os-bg-dark
                rounded-xl
                border border-os-border-dark
                shadow-2xl
                overflow-hidden
              "
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <h2 id="search-modal-title" className="sr-only">Search resources</h2>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-os-border-dark">
                <Search className="w-5 h-5 text-os-text-secondary-dark flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search resources..."
                  className="
                    flex-1
                    bg-transparent
                    text-os-text-primary-dark
                    placeholder:text-os-text-secondary-dark
                    focus:outline-none
                    text-base
                  "
                />
                <div className="flex items-center gap-1">
                  <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-os-text-secondary-dark bg-os-surface-dark rounded border border-os-border-dark">
                    <Command className="w-2.5 h-2.5" />K
                  </kbd>
                  <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    aria-label="Close search"
                    className="
                      p-1 rounded-md
                      text-os-text-secondary-dark hover:text-os-text-primary-dark
                      hover:bg-os-surface-dark
                      transition-colors
                    "
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Results List */}
              <div ref={resultsRef} className="max-h-[60vh] min-h-[400px] overflow-y-auto">
                {isSearching ? (
                  // Loading skeleton
                  <div className="py-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3 px-5 py-3">
                        <div className="w-9 h-9 rounded-lg bg-os-surface-dark animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-os-surface-dark rounded w-3/4 animate-pulse" />
                          <div className="h-3 bg-os-surface-dark rounded w-1/2 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : flatResults.length > 0 ? (
                  <div className="py-2">
                    {/* Show section label based on whether user is searching or viewing defaults */}
                    {!query.trim() && (
                      <div className="px-5 pt-2 pb-1">
                        <span className="text-xs text-os-text-secondary-dark">Popular Resources</span>
                      </div>
                    )}
                    {orderedCategories.map((category) => (
                      <div key={category} className="mt-2 first:mt-0">
                        <SectionHeader
                          title={category}
                          count={displayGroupedResults[category].length}
                        />
                        {displayGroupedResults[category].map((result) => {
                          const globalIndex = getGlobalIndex(result);
                          return renderResultItem(result, selectedIndex === globalIndex, globalIndex);
                        })}
                      </div>
                    ))}
                  </div>
                ) : query.trim() ? (
                  // No results
                  <div className="py-12 text-center">
                    <Search className="w-8 h-8 text-os-text-secondary-dark mx-auto mb-3" />
                    <p className="text-sm text-os-text-secondary-dark">No results found</p>
                    <p className="text-xs text-os-text-secondary-dark/70 mt-1">Try a different search term</p>
                  </div>
                ) : null}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-os-border-dark text-[10px] text-os-text-secondary-dark">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-os-surface-dark rounded border border-os-border-dark">
                      Enter
                    </kbd>
                    to select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-os-surface-dark rounded border border-os-border-dark">
                      ↑↓
                    </kbd>
                    to navigate
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-os-surface-dark rounded border border-os-border-dark">
                    Esc
                  </kbd>
                  to close
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document body level
  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}
