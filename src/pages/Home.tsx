import { useState, useMemo, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Table2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resources } from '../data';
import type { NormalizedResource } from '../types/resource';
import { InspoChat } from '../components/ui/InspoChat';
import { CategoryButtons } from '../components/ui/CategoryButtons';
import { AIFilterResponse } from '../components/ui/AIFilterResponse';
import InspoResourceTooltip from '../components/ui/InspoResourceTooltip';
import { InspoTable } from '../components/ui/InspoTable';

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
  const displayMode = searchParams.get('display') === 'table' ? 'table' : '3d';

  // Filter state
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // AI response state
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Tooltip state
  const [hoveredResource, setHoveredResource] = useState<NormalizedResource | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Filter resources based on category and subcategory
  const filteredResources = useMemo(() => {
    let filtered = resources;

    if (activeCategory) {
      filtered = filtered.filter(r => r.category === activeCategory);
    }

    if (activeSubCategory) {
      filtered = filtered.filter(r => r.subCategory === activeSubCategory);
    }

    // Search filter (simple text match for now)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.category?.toLowerCase().includes(query) ||
        r.subCategory?.toLowerCase().includes(query) ||
        r.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [activeCategory, activeSubCategory, searchQuery]);

  // Handle search submission
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsAiTyping(true);

    // Simulate AI response
    const matchCount = resources.filter(r => {
      const q = query.toLowerCase();
      return r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.tags?.some(tag => tag.toLowerCase().includes(q));
    }).length;

    // Generate contextual response
    let response = '';
    if (matchCount === 0) {
      response = `I couldn't find any resources matching "${query}". Try different keywords or browse by category.`;
    } else if (matchCount === 1) {
      response = `Found 1 resource for "${query}". Click to explore!`;
    } else if (query.toLowerCase().includes('free')) {
      const freeCount = resources.filter(r => r.pricing?.toLowerCase().includes('free')).length;
      response = `Found ${freeCount} free resources. Great for getting started without a budget!`;
    } else if (query.toLowerCase().includes('ai')) {
      response = `Showing ${matchCount} AI-powered tools. These are transforming how designers work.`;
    } else {
      response = `Found ${matchCount} resources matching "${query}". Explore the universe to discover more!`;
    }

    setAiMessage(response);
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
  };

  return (
    <div className="h-screen bg-os-bg-dark text-os-text-primary-dark font-sans flex flex-col overflow-hidden">
      {/* Header - Sticky with backdrop blur */}
      <header className="flex-shrink-0 sticky top-0 z-30 bg-os-bg-dark/80 backdrop-blur-xl border-b border-os-border-dark">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-display font-bold text-brand-vanilla">
            Brand Resource Universe
          </h1>
          <div className="flex items-center bg-os-surface-dark/50 rounded-lg p-1 border border-os-border-dark">
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
        </div>
      </header>

      {/* Canvas Container - FLEX-1 fills remaining space */}
      <div className="flex-1 relative min-h-0">
        {/* Top gradient overlay */}
        <div
          className="absolute top-0 inset-x-0 h-16 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to bottom, #141414 0%, transparent 100%)' }}
        />

        {/* 3D Canvas or Table View */}
        <AnimatePresence mode="wait">
          {displayMode === '3d' ? (
            <motion.div
              key="3d"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-2 border-brand-aperol border-t-transparent rounded-full animate-spin" />
                      <span className="text-os-text-secondary-dark text-sm">Loading universe...</span>
                    </div>
                  </div>
                }
              >
                <InspoCanvas
                  resources={filteredResources}
                  onResourceClick={handleResourceClick}
                  onResourceHover={handleResourceHover}
                />
              </Suspense>
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full overflow-auto"
            >
              <div className="max-w-7xl mx-auto">
                <InspoTable resources={filteredResources} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom gradient overlay */}
        <div
          className="absolute bottom-0 inset-x-0 h-32 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, #141414 0%, transparent 100%)' }}
        />
      </div>

      {/* Bottom Controls - FLEX-SHRINK-0 stays fixed */}
      <div className="flex-shrink-0 relative z-20 bg-os-bg-dark">
        {/* Top gradient overlap for seamless blend */}
        <div
          className="absolute -top-8 left-0 right-0 h-8 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, #141414 100%)' }}
        />

        <div className="w-full max-w-7xl mx-auto px-6 pt-2 pb-6 space-y-3">
          {/* AI Response */}
          <AIFilterResponse
            message={aiMessage}
            isTyping={isAiTyping}
            onDismiss={dismissAiResponse}
            matchCount={filteredResources.length}
          />

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
            onCategoryChange={setActiveCategory}
            onSubCategoryChange={setActiveSubCategory}
          />

          {/* Resource count */}
          <p className="text-center text-xs text-os-text-secondary-dark">
            {filteredResources.length} inspiration resources
          </p>
        </div>
      </div>

      {/* Tooltip */}
      <InspoResourceTooltip
        resource={hoveredResource}
        mousePosition={mousePosition}
      />
    </div>
  );
}
