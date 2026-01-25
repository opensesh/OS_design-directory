import { useState, useMemo, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LayoutGrid, Globe } from 'lucide-react';
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
    <div className="min-h-screen bg-[#141414] text-[#FFFAEE] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">
            Design Universe
          </h1>
          <span className="text-sm text-zinc-500">
            {filteredResources.length} resources
          </span>
        </div>

        {/* Display Toggle */}
        <div className="flex items-center gap-2 bg-zinc-800/60 rounded-lg p-1">
          <button
            onClick={() => setSearchParams({})}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              displayMode === '3d'
                ? 'bg-[#FE5102] text-white'
                : 'text-zinc-400 hover:text-[#FFFAEE]'
            }`}
          >
            <Globe className="w-4 h-4" />
            3D
          </button>
          <button
            onClick={() => setSearchParams({ display: 'table' })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              displayMode === 'table'
                ? 'bg-[#FE5102] text-white'
                : 'text-zinc-400 hover:text-[#FFFAEE]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Table
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* 3D Canvas or Table View */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            {displayMode === '3d' ? (
              <motion.div
                key="3d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-2 border-[#FE5102] border-t-transparent rounded-full animate-spin" />
                        <span className="text-zinc-500 text-sm">Loading universe...</span>
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
                className="absolute inset-0 overflow-auto"
              >
                <InspoTable resources={filteredResources} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
          <div className="max-w-2xl mx-auto space-y-3">
            {/* AI Response */}
            <div className="pointer-events-auto">
              <AIFilterResponse
                message={aiMessage}
                isTyping={isAiTyping}
                onDismiss={dismissAiResponse}
                matchCount={filteredResources.length}
              />
            </div>

            {/* Search Input */}
            <div className="pointer-events-auto">
              <InspoChat
                onSubmit={handleSearch}
                isLoading={isAiTyping}
                placeholder="Search for design tools, resources, or ask a question..."
              />
            </div>

            {/* Category Buttons */}
            <div className="pointer-events-auto">
              <CategoryButtons
                resources={resources}
                activeCategory={activeCategory}
                activeSubCategory={activeSubCategory}
                onCategoryChange={setActiveCategory}
                onSubCategoryChange={setActiveSubCategory}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Tooltip */}
      <InspoResourceTooltip
        resource={hoveredResource}
        mousePosition={mousePosition}
      />
    </div>
  );
}
