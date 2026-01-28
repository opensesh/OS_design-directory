import { useState, useMemo, lazy, Suspense, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Table2, Search, LayoutGrid } from 'lucide-react';
import { SearchModal } from '../components/search/SearchModal';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { motion, AnimatePresence } from 'framer-motion';
import { resources } from '../data';
import type { NormalizedResource } from '../types/resource';
import { InspoChat } from '../components/ui/InspoChat';
import { CategoryButtons } from '../components/ui/CategoryButtons';
import { AIFilterResponse } from '../components/ui/AIFilterResponse';
import InspoResourceTooltip from '../components/ui/InspoResourceTooltip';
import { InspoTable } from '../components/ui/InspoTable';
import { CardView } from '../components/card-view';
import {
  semanticSearch,
  generateAIResponse,
  generateCategoryResponse,
} from '../lib/search';

// Lazy load the 3D canvas for better initial load
const InspoCanvas = lazy(() => import('../components/canvas/InspoCanvas'));

/**
 * Home Page
 *
 * Main view for the design resource universe.
 * Features 3D orbital visualization or table view,
 * with search, filtering, and category navigation.
 */
export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Display mode from URL params
  type DisplayMode = '3d' | 'table' | 'card';
  const displayMode: DisplayMode = (() => {
    const display = searchParams.get('display');
    if (display === 'table') return 'table';
    if (display === 'card') return 'card';
    return '3d';
  })();

  // Read filter params from URL for table view
  const categoryParam = searchParams.get('category');
  const subCategoryParam = searchParams.get('subCategory');
  const pricingParam = searchParams.get('pricing');
  const tierParam = searchParams.get('tier');
  const featuredParam = searchParams.get('featured');
  const opensourceParam = searchParams.get('opensource');

  // Filter state
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResourceIds, setFilteredResourceIds] = useState<number[] | null>(null);
  const [matchedCategories, setMatchedCategories] = useState<string[]>([]);

  // AI response state
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Tooltip state
  const [hoveredResource, setHoveredResource] = useState<NormalizedResource | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Search modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'cmd+k': useCallback(() => setIsSearchModalOpen(true), []),
  });

  // Filter resources based on category, subcategory, and semantic search
  const filteredResources = useMemo(() => {
    // Start with all resources or filter by category/subcategory
    let baseResources = resources;

    if (activeCategory) {
      baseResources = baseResources.filter(r => r.category === activeCategory);
    }

    if (activeSubCategory) {
      baseResources = baseResources.filter(r => r.subCategory === activeSubCategory);
    }

    // Apply semantic search if there's a query
    if (searchQuery) {
      const { results } = semanticSearch(baseResources, searchQuery, {
        minResults: 3,
        maxResults: 50,
        includeFallback: true,
      });

      return results.map(r => r.resource);
    }

    return baseResources;
  }, [activeCategory, activeSubCategory, searchQuery]);

  // Handle search submission with semantic search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsAiTyping(true);

    // Perform semantic search on ALL resources (not pre-filtered)
    const { results, metadata } = semanticSearch(resources, query, {
      minResults: 3,
      maxResults: 50,
      includeFallback: true,
    });

    // Extract matched resource IDs for filtering
    const ids = results.map(r => r.resource.id);
    setFilteredResourceIds(ids);

    // Extract matched categories for multi-ring highlighting
    const categories = [...new Set(results.map(r => r.resource.category).filter(Boolean))] as string[];
    setMatchedCategories(categories);

    // Generate contextual AI response based on search results and metadata
    const aiResponse = generateAIResponse(results, metadata);

    setAiMessage(aiResponse.message);
    setIsAiTyping(false);
  };

  // Handle resource click
  const handleResourceClick = (resource: NormalizedResource) => {
    navigate(`/resource/${resource.id}`);
  };

  // Handle resource hover
  const handleResourceHover = (resource: NormalizedResource | null, position?: { x: number; y: number }) => {
    setHoveredResource(resource);
    if (position) {
      setMousePosition(position);
    }
  };

  // Dismiss AI response
  const dismissAiResponse = () => {
    setAiMessage(null);
    setSearchQuery('');
    setFilteredResourceIds(null);
    setMatchedCategories([]);
  };

  // Handle category change with AI response
  const handleCategoryChange = (category: string | null) => {
    setActiveCategory(category);
    setActiveSubCategory(null);
    setSearchQuery('');
    setFilteredResourceIds(null);  // Clear search filter
    setMatchedCategories([]);       // Clear matched categories

    if (category) {
      const categoryResources = resources.filter(r => r.category === category);
      const response = generateCategoryResponse(category, categoryResources.length);
      setAiMessage(response.message);
    } else {
      setAiMessage(null);
    }
  };

  // Handle subcategory change
  const handleSubCategoryChange = (subCategory: string | null) => {
    setActiveSubCategory(subCategory);
    setSearchQuery('');

    if (subCategory && activeCategory) {
      const filtered = resources.filter(
        r => r.category === activeCategory && r.subCategory === subCategory
      );
      setAiMessage(`Showing ${filtered.length} ${subCategory.toLowerCase()} resources.`);
    } else if (activeCategory) {
      // Reset to just category message
      const categoryResources = resources.filter(r => r.category === activeCategory);
      const response = generateCategoryResponse(activeCategory, categoryResources.length);
      setAiMessage(response.message);
    } else {
      setAiMessage(null);
    }
  };

  return (
    <div className={`h-screen text-os-text-primary-dark font-sans overflow-hidden ${displayMode === '3d' ? '' : 'bg-os-bg-dark'}`}>
      {/* 3D Canvas - FIXED BELOW HEADERS (only in 3D mode) */}
      {displayMode === '3d' && (
        <div className="fixed inset-x-0 top-[124px] bottom-[220px] z-0">
          {/* Top gradient fade for visual separation from headers */}
          <div
            className="absolute top-0 inset-x-0 h-24 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to bottom, rgba(20,20,20,0.95) 0%, transparent 100%)' }}
          />
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-os-bg-dark">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-brand-aperol border-t-transparent rounded-full animate-spin" />
                  <span className="text-os-text-secondary-dark text-sm">Loading universe...</span>
                </div>
              </div>
            }
          >
            <InspoCanvas
              resources={resources}
              activeCategory={activeCategory}
              activeSubFilter={activeSubCategory}
              filteredResourceIds={filteredResourceIds}
              matchedCategories={matchedCategories}
              onResourceClick={handleResourceClick}
              onResourceHover={handleResourceHover}
            />
          </Suspense>
        </div>
      )}

      {/* UI Overlay Container */}
      <div className={`relative z-10 h-screen flex flex-col overflow-hidden ${displayMode === '3d' ? 'pointer-events-none' : ''}`}>
        {/* Header - Semi-transparent with backdrop blur */}
        <header className={`pointer-events-auto flex-shrink-0 sticky top-0 z-30 backdrop-blur-xl border-b border-os-border-dark/50 h-16 ${displayMode === '3d' ? 'bg-os-bg-dark/60' : 'bg-os-bg-dark/80'}`}>
        <div className="max-w-7xl mx-auto px-6 h-full">
          <div className="flex items-center justify-between h-full">
          <button
            onClick={() => {
              setSearchParams({});
              setActiveCategory(null);
              setActiveSubCategory(null);
              setSearchQuery('');
              setAiMessage(null);
              setFilteredResourceIds(null);
              setMatchedCategories([]);
            }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {/* Open Session Brand Mark in styled container matching toggle/search */}
            <div className="flex items-center justify-center w-10 h-10 bg-os-surface-dark/50 rounded-lg border border-os-border-dark">
              <svg
                width="24"
                height="24"
                viewBox="0 0 301 300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M89.6779 45.0952C125.924 24.2532 166.282 15.3228 203.299 19.9365C241.122 24.6493 271.008 42.8823 287.467 71.2574C303.925 99.6323 304.82 134.526 290.014 169.493C275.518 203.732 247.568 234.061 211.322 254.903C181.312 272.158 148.494 281.25 117.08 281.25C110.546 281.25 104.074 280.853 97.7016 280.062C59.8782 275.349 29.9921 257.118 13.5335 228.743C-2.92498 200.368 -3.81968 165.474 10.9865 130.507C25.4825 96.2685 53.4317 65.9375 89.6779 45.0952ZM113.022 54.5178C112.504 54.7618 111.987 55.0117 111.469 55.2613C101.203 62.9218 91.5207 73.7058 82.0022 88.5736C48.4267 141.019 56.7609 225.538 100.36 250.871C110.136 256.551 120.348 259.779 130.236 260.951C103.812 243.253 81.3686 200.716 81.3686 149.839H81.3814C81.3843 110.563 94.7644 76.2604 113.022 54.5178ZM70.212 82.4671C25.3833 121.776 7.89883 177.685 31.52 218.427C42.411 237.218 60.7648 250.604 84.1555 257.139C63.8213 242.961 46.464 218.673 42.4386 191.585C37.7557 160.093 45.5451 126.103 62.1279 95.8722C64.7191 91.1514 67.4163 86.6839 70.212 82.4671ZM101.43 158.683C102.448 184.25 107.876 207.925 116.981 226.095C124.198 240.505 133.228 250.093 142.544 253.532C141.526 227.964 134.855 205.526 125.75 187.355C118.533 172.945 110.746 162.122 101.43 158.683ZM198.902 158.683C189.586 162.122 181.81 172.933 174.58 187.355C165.475 205.526 158.804 227.952 157.786 253.532C167.102 250.093 176.12 240.518 183.349 226.095C192.454 207.925 197.884 184.262 198.902 158.683ZM171.24 38.6389C170.853 38.6705 170.466 38.7014 170.078 38.736C196.501 56.4308 218.947 98.9645 218.95 149.839L218.943 151.412C218.593 189.915 205.405 223.508 187.475 244.971C199.645 236.756 210.382 224.016 225.907 196.15C246.775 158.696 243.01 83.837 205.062 49.9329C194.228 40.2432 179.285 38.8914 171.24 38.6389ZM150.216 72.1839C145.989 120.911 130.382 149.39 100.738 149.844C131.856 150.346 146.546 182.705 149.561 236.239C152.8 182.701 168.449 150.341 199.587 149.844C170.18 149.375 154.588 120.49 150.216 72.1839ZM216.685 42.4878C257.555 69.7162 275.921 142.282 238.687 203.683C235.58 209.348 232.086 214.758 228.274 219.886C247.606 203.71 262.569 184.151 271.555 162.938C283.976 133.586 283.404 104.618 269.927 81.3758C258.633 61.8976 239.629 48.7885 216.685 42.4878ZM142.533 46.1719C133.217 49.6105 124.199 59.1844 116.97 73.6066C107.865 91.777 102.435 115.441 101.417 141.021C110.733 137.582 118.509 126.77 125.739 112.348C134.844 94.1776 141.515 71.7515 142.533 46.1719ZM157.786 46.1719C158.804 71.7392 165.475 94.1776 174.58 112.348C181.797 126.758 189.586 137.582 198.902 141.021C197.884 115.453 192.454 91.7788 183.349 73.6084C176.132 59.1982 167.102 49.6106 157.786 46.1719Z"
                  fill="#FFFAEE"
                />
              </svg>
            </div>
            {/* Open Session Wordmark */}
            <img 
              src="/assets/logo-wordmark-vanilla.png" 
              alt="open session" 
              className="h-5 w-auto"
            />
          </button>
          <div className="flex items-center gap-3">
            {/* Search Button - hidden on mobile, visible on desktop */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="hidden md:flex items-center justify-center gap-2 h-10 px-3 bg-os-surface-dark/50 border border-os-border-dark rounded-lg text-os-text-secondary-dark hover:text-os-text-primary-dark hover:border-brand-aperol/30 transition-all"
              title="Search resources (⌘K)"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Search...</span>
              <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.5 bg-os-bg-dark rounded border border-os-border-dark">⌘K</kbd>
            </button>

          {/* View mode toggles - hidden on mobile, visible on desktop */}
          <div className="hidden md:flex items-center bg-os-surface-dark/50 rounded-lg p-1 border border-os-border-dark">
            <button
              onClick={() => setSearchParams({})}
              className={`p-2 rounded-md transition-all ${
                displayMode === '3d'
                  ? 'bg-brand-aperol text-white'
                  : 'text-os-text-secondary-dark hover:text-brand-vanilla'
              }`}
              aria-label="3D View"
            >
              <Box className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSearchParams({ display: 'card' })}
              className={`p-2 rounded-md transition-all ${
                displayMode === 'card'
                  ? 'bg-brand-aperol text-white'
                  : 'text-os-text-secondary-dark hover:text-brand-vanilla'
              }`}
              aria-label="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSearchParams({ display: 'table' })}
              className={`p-2 rounded-md transition-all ${
                displayMode === 'table'
                  ? 'bg-brand-aperol text-white'
                  : 'text-os-text-secondary-dark hover:text-brand-vanilla'
              }`}
              aria-label="Table View"
            >
              <Table2 className="w-4 h-4" />
            </button>
          </div>

          {/* Search button - visible on mobile only */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="flex md:hidden items-center justify-center w-10 h-10 bg-os-surface-dark/50 border border-os-border-dark rounded-lg text-os-text-secondary-dark hover:text-os-text-primary-dark hover:border-brand-aperol/30 transition-all"
            aria-label="Search resources"
          >
            <Search className="w-5 h-5" />
          </button>
          </div>
        </div>
        </div>
      </header>

      {/* Subheader - View Mode Indicator */}
      <section
        className={`pointer-events-auto flex-shrink-0 border-b border-os-border-dark/50 ${displayMode === '3d' ? 'bg-os-bg-dark/60 backdrop-blur-xl' : 'bg-os-bg-dark'}`}
        role="region"
        aria-label="Current view"
      >
        <div className={`max-w-7xl mx-auto px-6 ${displayMode === '3d' ? 'py-4' : 'py-3'} md:py-4`}>
          <div className="flex items-center justify-between">
            {/* Left: Label + View Name */}
            <div className="flex flex-col gap-0.5">
              <span className="text-caption font-text uppercase tracking-wider text-os-text-secondary-dark">
                Design Directory
              </span>
              <AnimatePresence mode="wait">
                <motion.h2
                  key={displayMode}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="text-h4 md:text-h3 font-accent font-bold text-brand-aperol"
                  aria-live="polite"
                >
                  {displayMode === '3d' && 'Universe View'}
                  {displayMode === 'card' && 'Card View'}
                  {displayMode === 'table' && 'Table View'}
                </motion.h2>
              </AnimatePresence>
            </div>

            {/* Right: Description text (desktop only) */}
            <div className="hidden md:block max-w-md text-right">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`desc-${displayMode}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="text-sm text-os-text-secondary-dark leading-relaxed"
                >
                  {displayMode === '3d' && 'Easily browse design resources by navigating from main categories to subcategories.'}
                  {displayMode === 'card' && 'Easily browse design resources by navigating from main categories to subcategories.'}
                  {displayMode === 'table' && 'Easily browse design resources by navigating from main categories to subcategories.'}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Right: View toggle (mobile only) */}
            <div className="flex md:hidden items-center bg-os-surface-dark/50 rounded-lg p-1 border border-os-border-dark">
              <button
                onClick={() => setSearchParams({})}
                className={`p-2 rounded-md transition-all ${
                  displayMode === '3d'
                    ? 'bg-brand-aperol text-white'
                    : 'text-os-text-secondary-dark hover:text-brand-vanilla'
                }`}
                aria-label="3D View"
              >
                <Box className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSearchParams({ display: 'card' })}
                className={`p-2 rounded-md transition-all ${
                  displayMode === 'card'
                    ? 'bg-brand-aperol text-white'
                    : 'text-os-text-secondary-dark hover:text-brand-vanilla'
                }`}
                aria-label="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSearchParams({ display: 'table' })}
                className={`p-2 rounded-md transition-all ${
                  displayMode === 'table'
                    ? 'bg-brand-aperol text-white'
                    : 'text-os-text-secondary-dark hover:text-brand-vanilla'
                }`}
                aria-label="Table View"
              >
                <Table2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile description row */}
          <div className="md:hidden mt-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={`mobile-desc-${displayMode}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="inline-block bg-os-surface-dark/50 rounded-lg px-3 py-2 border border-os-border-dark"
              >
                <p className="text-xs text-os-text-secondary-dark leading-relaxed text-left">
                  {displayMode === '3d' && 'Easily browse design resources by navigating from main categories to subcategories.'}
                  {displayMode === 'card' && 'Easily browse design resources by navigating from main categories to subcategories.'}
                  {displayMode === 'table' && 'Easily browse design resources by navigating from main categories to subcategories.'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Content Area - FLEX-1 fills remaining space */}
      <div className={`flex-1 relative min-h-0 ${displayMode === '3d' ? '' : 'pointer-events-auto'}`}>
        {/* Card View or Table View (3D mode uses empty spacer since canvas is fixed) */}
        <AnimatePresence mode="wait">
          {displayMode === '3d' && (
            <div className="w-full h-full" />
          )}

          {displayMode === 'card' && (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="w-full h-full"
            >
              <CardView resources={resources} />
            </motion.div>
          )}

          {displayMode === 'table' && (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="w-full h-full overflow-auto"
            >
              <div className="max-w-7xl mx-auto">
                <InspoTable
                  resources={resources}
                  initialCategory={categoryParam || undefined}
                  initialSubCategory={subCategoryParam || undefined}
                  initialPricing={pricingParam || undefined}
                  initialTier={tierParam || undefined}
                  initialFeatured={featuredParam || undefined}
                  initialOpensource={opensourceParam || undefined}
                  isFromUrl={!!(categoryParam || subCategoryParam || pricingParam || tierParam || featuredParam || opensourceParam)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls - Only show in 3D mode */}
      <AnimatePresence>
        {displayMode === '3d' && (
          <motion.div
            className="flex-shrink-0 relative z-20 bg-os-bg-dark/90 backdrop-blur-xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >

            <div className="w-full max-w-7xl mx-auto px-6 pt-2 pb-6 space-y-3 pointer-events-auto">
              {/* AI Response - absolutely positioned to overlay without pushing layout */}
              <div className="relative">
                <AnimatePresence>
                  {aiMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute bottom-full left-0 right-0 mb-3 pointer-events-auto"
                    >
                      <AIFilterResponse
                        message={aiMessage}
                        isTyping={isAiTyping}
                        onDismiss={dismissAiResponse}
                        matchCount={filteredResourceIds ? filteredResourceIds.length : filteredResources.length}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Search Input */}
              <InspoChat
                onSubmit={handleSearch}
                isLoading={isAiTyping}
                placeholder="Describe what you're looking for... (e.g., 'tools for YouTube creators')"
              />

              {/* Category Buttons */}
              <CategoryButtons
                resources={resources}
                activeCategory={activeCategory}
                activeSubCategory={activeSubCategory}
                onCategoryChange={handleCategoryChange}
                onSubCategoryChange={handleSubCategoryChange}
              />

              {/* Resource count - more prominent */}
              <p className="text-center text-sm text-os-text-secondary-dark">
                <span className="font-semibold text-brand-aperol">
                  {filteredResourceIds ? filteredResourceIds.length : filteredResources.length}
                </span> inspiration resources
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
      {/* End of UI Overlay Container */}

      {/* Tooltip - needs to be outside overlay for proper z-index */}
      <InspoResourceTooltip
        resource={hoveredResource}
        mousePosition={mousePosition}
      />

      {/* Search Modal - needs to be outside overlay for proper z-index */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectResource={(resource) => {
          setIsSearchModalOpen(false);
          navigate(`/resource/${resource.id}`);
        }}
      />

    </div>
  );
}
