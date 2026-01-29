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
          {/* Top gradient - aggressive fade from dark for seamless blend */}
          <div
            className="absolute top-0 inset-x-0 h-32 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to bottom, rgba(20,20,20,1) 0%, rgba(20,20,20,0.8) 40%, transparent 100%)' }}
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
        <div className="max-w-5xl mx-auto px-6 h-full">
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
            className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
          >
            {/* Open Session Brand Mark in styled container matching toggle/search */}
            <div className="flex items-center justify-center w-10 h-[39px] bg-os-surface-dark/50 rounded-md border border-os-border-dark">
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
            {/* Open Session Wordmark - SVG with cropped viewBox */}
            <svg
              className="h-6 w-auto shrink min-w-0"
              viewBox="61 260 480 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="open session"
              role="img"
            >
              <path d="M67.6994 315.998C72.1641 320.262 77.9842 322.39 85.1548 322.39C92.3255 322.39 98.131 320.257 102.567 315.998C106.288 312.427 108.44 308.072 109.042 302.942V338H123.408L123.418 316.742H123.593C126.59 320.559 130.851 322.47 136.379 322.47C142.316 322.47 147.077 320.423 150.662 316.325C153.835 312.699 155.603 307.991 155.968 302.198C156.444 307.715 158.596 312.326 162.434 316.033C166.811 320.267 172.646 322.385 179.938 322.385C185.403 322.385 190.125 321.142 194.221 318.482C198.433 315.746 201.173 311.874 202.246 308.006V321.142H216.617V297.646C216.617 294.991 217.35 292.834 218.823 291.169C220.29 289.509 222.204 288.68 224.555 288.68C226.907 288.68 228.597 289.358 229.802 290.711C231.007 292.069 231.609 293.91 231.609 296.233V321.137H245.98V293.492C245.98 288.68 244.581 284.792 241.792 281.83C238.999 278.868 235.165 277.389 230.288 277.389C224.468 277.389 219.823 279.743 216.355 284.445H216.092V282.66C216.092 280.437 214.353 278.636 212.206 278.636H202.251V299.085C201.595 292.059 199.011 286.592 194.488 282.705C190.373 279.164 185.228 277.389 179.058 277.389C172.238 277.389 166.67 279.522 162.351 283.781C158.552 287.533 156.424 292.114 155.968 297.536C155.589 292.054 153.869 287.452 150.803 283.741C147.305 279.506 142.617 277.389 136.739 277.389C130.86 277.389 126.542 279.522 123.073 283.781H122.811V281.654C122.811 279.989 121.504 278.636 119.896 278.636H109.057V296.852C108.455 291.717 106.298 287.362 102.576 283.786C98.1359 279.527 92.3352 277.394 85.1645 277.394C77.9939 277.394 72.1738 279.527 67.7091 283.786C63.2348 288.051 61 293.417 61 299.894C61 306.372 63.2348 311.738 67.6994 316.003V315.998ZM179.326 287.025C181.677 287.025 183.63 287.774 185.189 289.268C186.744 290.762 187.643 292.783 187.881 295.328H170.071C171.13 289.796 174.215 287.025 179.33 287.025H179.326ZM202.256 303.38V307.322H190.13C189.139 307.322 188.211 307.84 187.682 308.71C186.331 310.913 184.189 312.648 180.122 312.678C177.241 312.699 174.948 311.864 173.243 310.229C171.538 308.595 170.45 306.312 169.978 303.38H202.256ZM125.453 291.632C127.1 289.389 129.422 288.267 132.42 288.267C135.417 288.267 137.681 289.348 139.207 291.506C140.737 293.663 141.5 296.626 141.5 300.387C141.5 304.149 140.723 306.82 139.163 308.897C137.604 310.974 135.447 312.01 132.682 312.01C129.627 312.01 127.246 310.943 125.541 308.811C123.836 306.679 122.985 303.872 122.985 300.387C122.985 296.902 123.806 293.87 125.453 291.627V291.632ZM78.0182 290.43C79.6651 288.106 82.0164 286.944 85.0722 286.944C88.128 286.944 90.494 288.121 92.17 290.475C93.8461 292.829 94.6817 295.967 94.6817 299.899C94.6817 303.832 93.8461 306.955 92.17 309.279C90.494 311.602 88.128 312.764 85.0722 312.764C82.0164 312.764 79.6651 311.602 78.0182 309.279C76.3713 306.955 75.5502 303.827 75.5502 299.899C75.5502 295.972 76.3713 292.758 78.0182 290.435V290.43Z" fill="#FFFAEE"/>
              <path d="M449.564 262H435.194V272.958H449.564V262Z" fill="#FFFAEE"/>
              <path d="M536.812 282.051C534.019 279.089 530.186 277.61 525.308 277.61C519.488 277.61 514.844 279.964 511.375 284.666H511.113V281.875C511.113 280.211 509.806 278.858 508.198 278.858H497.272V295.147C496.567 290.309 494.439 286.175 490.878 282.76C486.438 278.501 480.637 276.368 473.467 276.368C466.296 276.368 460.476 278.501 456.011 282.76C452.426 286.18 450.283 290.314 449.574 295.157V281.875C449.574 280.211 448.267 278.858 446.659 278.858H435.204V304.355C435.019 303.41 434.742 302.535 434.368 301.73C433.634 300.151 432.765 298.909 431.769 297.993C430.768 297.078 429.403 296.279 427.669 295.584C425.934 294.896 424.418 294.408 423.126 294.131C421.834 293.854 420.187 293.548 418.19 293.216C417.719 293.16 417.102 293.065 416.339 292.924C415.577 292.788 414.974 292.673 414.532 292.592C414.09 292.512 413.531 292.411 412.856 292.3C412.181 292.19 411.651 292.079 411.267 291.969C410.884 291.858 410.456 291.717 409.99 291.551C409.518 291.385 409.154 291.219 408.887 291.053C408.625 290.887 408.357 290.696 408.095 290.47C407.833 290.249 407.638 290.002 407.522 289.721C407.405 289.444 407.347 289.137 407.347 288.805C407.347 287.533 407.92 286.562 409.067 285.898C410.213 285.235 411.724 284.903 413.609 284.903C417.088 284.903 419.327 285.964 420.323 288.091C420.823 289.157 421.819 289.887 422.966 289.887H434.067C433.712 285.627 431.803 282.293 428.334 279.884C424.865 277.475 419.988 276.273 413.697 276.273C408.11 276.273 403.47 277.465 399.763 279.843C396.061 282.222 394.21 285.572 394.21 289.887C394.21 291.823 394.531 293.528 395.182 294.991C395.828 296.46 396.639 297.621 397.606 298.476C398.578 299.336 399.841 300.096 401.396 300.759C402.955 301.423 404.379 301.911 405.671 302.213C406.963 302.52 408.552 302.806 410.432 303.083C410.845 303.138 411.491 303.234 412.37 303.375C413.25 303.515 413.896 303.626 414.309 303.707C414.717 303.792 415.29 303.903 416.028 304.038C416.762 304.179 417.321 304.3 417.704 304.411C418.088 304.521 418.54 304.672 419.07 304.868C419.599 305.064 419.998 305.271 420.26 305.492C420.522 305.713 420.804 305.965 421.096 306.241C421.387 306.518 421.596 306.825 421.712 307.156C421.829 307.488 421.887 307.876 421.887 308.318C421.887 309.646 421.256 310.682 419.993 311.431C418.73 312.181 417.01 312.553 414.833 312.553C409.834 312.553 407.075 310.451 406.545 306.241H393.686C393.584 304.551 393.229 303.038 392.617 301.715C391.883 300.136 391.014 298.894 390.018 297.978C389.017 297.063 387.652 296.263 385.917 295.569C384.183 294.88 382.667 294.393 381.375 294.116C380.083 293.839 378.436 293.533 376.439 293.201C375.968 293.145 375.351 293.05 374.588 292.909C373.825 292.773 373.223 292.658 372.781 292.577C372.339 292.492 371.78 292.396 371.105 292.285C370.43 292.175 369.9 292.064 369.516 291.953C369.133 291.843 368.71 291.702 368.239 291.536C367.767 291.37 367.403 291.204 367.136 291.038C366.873 290.872 366.606 290.681 366.344 290.455C366.082 290.234 365.887 289.987 365.771 289.705C365.654 289.429 365.596 289.122 365.596 288.79C365.596 287.518 366.169 286.547 367.316 285.883C368.462 285.22 369.973 284.888 371.858 284.888C375.336 284.888 377.576 285.949 378.572 288.076C379.072 289.142 380.068 289.871 381.215 289.871H392.316C391.961 285.612 390.052 282.277 386.583 279.869C383.114 277.46 378.237 276.258 371.945 276.258C366.358 276.258 361.719 277.45 358.017 279.828C354.315 282.207 352.464 285.556 352.464 289.871C352.464 291.808 352.785 293.513 353.436 294.976C354.082 296.444 354.888 297.606 355.86 298.461C356.832 299.321 358.095 300.081 359.649 300.744C361.204 301.408 362.632 301.896 363.925 302.198C365.217 302.505 366.805 302.791 368.686 303.068C369.094 303.123 369.745 303.219 370.624 303.359C371.508 303.5 372.154 303.611 372.562 303.691C372.97 303.777 373.544 303.888 374.282 304.023C375.016 304.164 375.574 304.285 375.958 304.395C376.342 304.506 376.794 304.657 377.323 304.853C377.853 305.049 378.251 305.255 378.514 305.477C378.776 305.698 379.058 305.949 379.349 306.226C379.641 306.503 379.85 306.809 379.966 307.141C380.083 307.473 380.141 307.861 380.141 308.303C380.141 309.631 379.51 310.667 378.246 311.416C376.983 312.165 375.264 312.538 373.087 312.538C368.924 312.538 366.31 311.079 365.251 308.157C364.823 306.975 363.687 306.231 362.462 306.231H351.22C351.22 306.231 351.22 306.256 351.22 306.271H339.668C338.677 306.271 337.749 306.789 337.219 307.659C335.869 309.862 333.726 311.592 329.66 311.627C326.779 311.647 324.486 310.813 322.781 309.178C321.075 307.544 319.987 305.26 319.516 302.329H351.964C352.08 293.196 349.437 286.306 344.03 281.659C339.915 278.118 334.771 276.343 328.601 276.343C321.78 276.343 316.212 278.475 311.894 282.735C307.575 287 305.413 292.336 305.413 298.758C305.413 299.799 305.476 300.805 305.583 301.79C305.568 301.765 305.558 301.735 305.549 301.705C304.815 300.126 303.946 298.884 302.95 297.968C301.949 297.053 300.584 296.253 298.849 295.559C297.115 294.87 295.599 294.383 294.307 294.106C293.015 293.829 291.368 293.523 289.371 293.191C288.9 293.135 288.283 293.04 287.52 292.899C286.757 292.763 286.155 292.647 285.713 292.567C285.271 292.487 284.712 292.386 284.037 292.275C283.362 292.165 282.832 292.054 282.448 291.943C282.064 291.833 281.637 291.692 281.17 291.526C280.699 291.36 280.335 291.194 280.068 291.028C279.805 290.862 279.538 290.671 279.276 290.445C279.013 290.223 278.819 289.977 278.703 289.695C278.586 289.419 278.528 289.112 278.528 288.78C278.528 287.508 279.101 286.537 280.247 285.873C281.394 285.209 282.905 284.878 284.79 284.878C288.268 284.878 290.508 285.939 291.504 288.066C292.004 289.132 293 289.861 294.147 289.861H305.248C304.893 285.602 302.984 282.267 299.515 279.858C296.046 277.45 291.169 276.248 284.877 276.248C279.29 276.248 274.651 277.439 270.944 279.818C267.242 282.197 265.391 285.546 265.391 289.861C265.391 291.798 265.712 293.502 266.363 294.966C267.009 296.434 267.82 297.596 268.787 298.451C269.759 299.311 271.022 300.07 272.576 300.734C274.136 301.398 275.559 301.886 276.852 302.188C278.144 302.494 279.732 302.781 281.613 303.058C282.026 303.113 282.672 303.209 283.551 303.349C284.43 303.49 285.076 303.601 285.489 303.681C285.897 303.767 286.471 303.877 287.209 304.013C287.943 304.154 288.501 304.275 288.885 304.385C289.269 304.496 289.721 304.647 290.25 304.843C290.78 305.039 291.178 305.245 291.441 305.467C291.703 305.688 291.985 305.939 292.276 306.216C292.568 306.493 292.777 306.799 292.893 307.131C293.01 307.463 293.068 307.85 293.068 308.293C293.068 309.621 292.437 310.657 291.173 311.406C289.91 312.155 288.191 312.528 286.014 312.528C281.851 312.528 279.237 311.069 278.178 308.147C277.75 306.975 276.614 306.221 275.389 306.221H264.147C264.381 310.923 266.455 314.62 270.361 317.305C274.267 319.991 279.514 321.334 286.102 321.334C292.213 321.334 297.168 320.116 300.958 317.682C304.747 315.248 306.647 311.763 306.647 307.222C306.647 307.016 306.642 306.814 306.632 306.613C307.706 309.782 309.489 312.573 311.976 314.982C316.353 319.216 322.188 321.334 329.48 321.334C334.946 321.334 339.668 320.091 343.763 317.431C347.557 314.967 350.156 311.582 351.42 308.102C352.056 311.919 354.058 314.992 357.434 317.305C361.34 319.991 366.587 321.334 373.175 321.334C379.286 321.334 384.241 320.116 388.031 317.682C391.111 315.706 392.942 313.03 393.516 309.666C394.395 312.769 396.28 315.319 399.18 317.31C403.086 319.996 408.333 321.339 414.921 321.339C421.032 321.339 425.988 320.122 429.777 317.687C432.76 315.771 434.562 313.206 435.199 309.988V321.339H449.569V302.545C450.279 307.388 452.421 311.522 456.006 314.942C460.471 319.206 466.291 321.334 473.462 321.334C480.632 321.334 486.438 319.201 490.873 314.942C494.43 311.527 496.562 307.393 497.267 302.555V321.339H511.637V297.843C511.637 295.187 512.371 293.03 513.843 291.365C515.31 289.705 517.224 288.876 519.576 288.876C521.927 288.876 523.617 289.555 524.822 290.907C526.027 292.265 526.63 294.106 526.63 296.429V321.334H541V293.689C541 288.876 539.601 284.988 536.812 282.026V282.051ZM328.863 285.994C331.214 285.994 333.167 286.743 334.727 288.237C336.282 289.731 337.18 291.752 337.418 294.297H319.608C320.667 288.765 323.752 285.994 328.868 285.994H328.863ZM480.472 308.243C478.796 310.566 476.43 311.728 473.374 311.728C470.318 311.728 467.967 310.566 466.32 308.243C464.673 305.919 463.852 302.791 463.852 298.863C463.852 294.936 464.673 291.722 466.32 289.399C467.967 287.075 470.318 285.914 473.374 285.914C476.43 285.914 478.796 287.09 480.472 289.444C482.148 291.798 482.984 294.936 482.984 298.869C482.984 302.801 482.148 305.924 480.472 308.248V308.243Z" fill="#FFFAEE"/>
            </svg>
          </button>
          <div className="flex items-center gap-3">
            {/* Search Button - hidden on mobile, visible on desktop */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="hidden md:flex items-center justify-between h-10 min-w-[200px] lg:min-w-[240px] px-3 bg-os-surface-dark/50 border border-os-border-dark rounded-lg text-os-text-secondary-dark hover:text-os-text-primary-dark hover:border-brand-aperol/30 transition-all"
              title="Search resources (⌘K)"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span className="text-sm">Search...</span>
              </div>
              <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.5 bg-os-bg-dark rounded border border-os-border-dark">⌘K</kbd>
            </button>

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
        <div className={`max-w-5xl mx-auto px-6 ${displayMode === '3d' ? 'py-4' : 'py-3'} md:py-4`}>
          <div className="flex items-center justify-between">
            {/* Left: Label + View Name + Description */}
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
                  className="text-h3 md:text-h3-tablet font-accent font-bold text-brand-aperol"
                  aria-live="polite"
                >
                  {displayMode === '3d' && 'Universe View'}
                  {displayMode === 'card' && 'Card View'}
                  {displayMode === 'table' && 'Table View'}
                </motion.h2>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`desc-${displayMode}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="text-sm text-os-text-secondary-dark"
                >
                  {displayMode === '3d' && 'Navigate galaxy of resources'}
                  {displayMode === 'card' && 'Filter by category levels'}
                  {displayMode === 'table' && 'Browse each resource'}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Right: View toggle (all screen sizes) */}
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
              <div className="max-w-5xl mx-auto">
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
            className="flex-shrink-0 relative z-20 bg-os-bg-dark"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Bottom gradient - aggressive fade to dark for seamless blend */}
            <div
              className="absolute -top-32 left-0 right-0 h-32 pointer-events-none z-10"
              style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(20,20,20,0.8) 60%, rgba(20,20,20,1) 100%)' }}
            />

            <div className="relative z-20 w-full max-w-5xl mx-auto px-6 pt-2 pb-6 space-y-3 pointer-events-auto">
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
