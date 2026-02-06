import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink, Search, X } from 'lucide-react';
import type { NormalizedResource } from '../../types/resource';
import { MobileResourceCard } from './MobileResourceCard';
import { GravityScoreBadge } from './GravityScoreBadge';

// Animation variants for staggered row entrance
const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.02,
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  })
};

// Shared easing for consistent feel
const smoothEase = [0.4, 0, 0.2, 1];

// Rating range filter options
const RATING_RANGES = [
  { value: 'all', label: 'All', min: 0, max: 10 },
  { value: '9-10', label: '9-10', min: 9.0, max: 10.0 },
  { value: '8-9', label: '8-9', min: 8.0, max: 8.99 },
  { value: '7-8', label: '7-8', min: 7.0, max: 7.99 },
  { value: '6-7', label: '6-7', min: 6.0, max: 6.99 },
  { value: 'below-6', label: 'Below 6', min: 0, max: 5.99 },
] as const;

// Get favicon URL from domain using Google's service
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return '';
  }
}

// Thumbnail component with fallback to favicon
function ResourceThumbnail({ resource }: { resource: NormalizedResource }) {
  const [imgError, setImgError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  const faviconUrl = getFaviconUrl(resource.url);
  const hasThumbnail = resource.thumbnail && !imgError;
  const hasFavicon = faviconUrl && !faviconError;

  // Fallback: colored initial
  if (!hasThumbnail && !hasFavicon) {
    const initial = resource.name.charAt(0).toUpperCase();
    return (
      <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-secondary)] flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-[var(--fg-secondary)]">{initial}</span>
      </div>
    );
  }

  // Show thumbnail if available
  if (hasThumbnail) {
    return (
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-secondary)] flex-shrink-0 relative">
        <img
          src={resource.thumbnail!}
          alt={resource.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback to favicon
  return (
    <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-secondary)] flex items-center justify-center flex-shrink-0">
      <img
        src={faviconUrl}
        alt={resource.name}
        className="w-6 h-6 object-contain"
        onError={() => setFaviconError(true)}
      />
    </div>
  );
}

interface InspoTableProps {
  resources: NormalizedResource[];
  initialCategory?: string;
  initialSubCategory?: string;
  initialPricing?: string;
  initialTier?: string;
  initialFeatured?: string;
  initialOpensource?: string;
  isFromUrl?: boolean;
}

type SortField = 'name' | 'category' | 'subCategory' | 'pricing' | 'gravityScore';
type SortDirection = 'asc' | 'desc' | null;

export function InspoTable({
  resources,
  initialCategory,
  initialSubCategory,
  initialPricing,
  initialTier,
  initialFeatured,
  initialOpensource,
  isFromUrl,
}: InspoTableProps) {
  const navigate = useNavigate();

  // Filter state - initialize from props
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory || 'all');
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>(initialSubCategory || 'all');
  const [pricingFilter, setPricingFilter] = useState<string>(initialPricing || 'all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [tierFilter, _setTierFilter] = useState<string>(initialTier || 'all');
  const [featuredFilter, _setFeaturedFilter] = useState<string>(initialFeatured || 'all');
  const [opensourceFilter, _setOpensourceFilter] = useState<string>(initialOpensource || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Track if user has modified filters (hides the URL filter banner)
  const [userHasModifiedFilters, setUserHasModifiedFilters] = useState(false);

  // Determine active filter label for the banner
  const activeFilterLabel = useMemo(() => {
    const labels: string[] = [];
    if (categoryFilter !== 'all') labels.push(categoryFilter);
    if (subCategoryFilter !== 'all') labels.push(subCategoryFilter);
    if (pricingFilter !== 'all') labels.push(pricingFilter);
    if (ratingFilter !== 'all') labels.push(`Rating ${ratingFilter}`);
    if (tierFilter !== 'all') labels.push(`Tier ${tierFilter}`);
    if (featuredFilter === 'true') labels.push('Featured');
    if (opensourceFilter === 'true') labels.push('Open Source');
    return labels.join(', ');
  }, [categoryFilter, subCategoryFilter, pricingFilter, ratingFilter, tierFilter, featuredFilter, opensourceFilter]);

  const hasActiveFilters = activeFilterLabel.length > 0;
  const showFilterBanner = isFromUrl && hasActiveFilters && !userHasModifiedFilters;

  // Clear all filters
  const clearFilters = () => {
    setCategoryFilter('all');
    setSubCategoryFilter('all');
    setPricingFilter('all');
    setRatingFilter('all');
    setUserHasModifiedFilters(true);
  };

  // Wrap filter setters to track user modifications
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setUserHasModifiedFilters(true);
  };

  const handleSubCategoryChange = (value: string) => {
    setSubCategoryFilter(value);
    setUserHasModifiedFilters(true);
  };

  const handlePricingChange = (value: string) => {
    setPricingFilter(value);
    setUserHasModifiedFilters(true);
  };

  const handleRatingChange = (value: string) => {
    setRatingFilter(value);
    setUserHasModifiedFilters(true);
  };

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const categories = new Set<string>();
    const subCategories = new Set<string>();
    const pricings = new Set<string>();

    resources.forEach((resource) => {
      if (resource.category) categories.add(resource.category);
      if (resource.subCategory) subCategories.add(resource.subCategory);
      if (resource.pricing) pricings.add(resource.pricing);
    });

    return {
      categories: Array.from(categories).sort(),
      subCategories: Array.from(subCategories).sort(),
      pricings: Array.from(pricings).sort(),
    };
  }, [resources]);

  // Apply filters and sorting
  const filteredAndSortedResources = useMemo(() => {
    let filtered = resources.filter((resource) => {
      const categoryMatch = categoryFilter === 'all' || resource.category === categoryFilter;
      const subCategoryMatch = subCategoryFilter === 'all' || resource.subCategory === subCategoryFilter;
      const pricingMatch = pricingFilter === 'all' || resource.pricing === pricingFilter;
      const tierMatch = tierFilter === 'all' || String(resource.tier) === tierFilter;
      const featuredMatch = featuredFilter === 'all' || (featuredFilter === 'true' && resource.featured);
      const opensourceMatch = opensourceFilter === 'all' || (opensourceFilter === 'true' && resource.opensource);

      // Rating filter
      const ratingRange = RATING_RANGES.find(r => r.value === ratingFilter);
      const ratingMatch = !ratingRange || ratingFilter === 'all' || 
        (resource.gravityScore >= ratingRange.min && resource.gravityScore <= ratingRange.max);

      // Search filter
      const searchMatch = !searchQuery ||
        resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return categoryMatch && subCategoryMatch && pricingMatch && tierMatch && featuredMatch && opensourceMatch && searchMatch && ratingMatch;
    });

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        // Handle numeric sorting for gravityScore
        if (sortField === 'gravityScore') {
          const aNum = typeof aValue === 'number' ? aValue : 0;
          const bNum = typeof bValue === 'number' ? bValue : 0;
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison for other fields
        const aStr = aValue?.toString() || '';
        const bStr = bValue?.toString() || '';
        const comparison = aStr.localeCompare(bStr);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [resources, categoryFilter, subCategoryFilter, pricingFilter, ratingFilter, tierFilter, featuredFilter, opensourceFilter, searchQuery, sortField, sortDirection]);

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon for header
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4 opacity-40" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className="w-4 h-4 text-brand-aperol" />;
    }
    return <ChevronDown className="w-4 h-4 text-brand-aperol" />;
  };

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: smoothEase }}
    >
      {/* Filter Active Banner - shows when navigating from ResourceDetail */}
      {showFilterBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: smoothEase }}
          className="flex items-center justify-between px-4 py-2 bg-[#FE5102]/10 border-b border-[var(--border-secondary)]"
        >
          <span className="text-sm text-[#FE5102] font-medium">
            Showing results for: {activeFilterLabel}
          </span>
          <button
            onClick={clearFilters}
            className="text-xs text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] transition-colors"
          >
            Clear filter
          </button>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05, ease: smoothEase }}
        className="bg-[var(--bg-primary)] border-b border-[var(--border-secondary)]"
      >
        <div className="p-4 md:p-6 space-y-4">
          {/* Desktop: Flex row with filters right-aligned */}
          {/* Mobile: Stack vertically with labels visible */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            {/* Search Filter */}
            <div className="w-full md:w-auto">
              <label htmlFor="search-filter" className="block text-xs font-accent uppercase tracking-wider text-[var(--fg-secondary)] mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-secondary)]" />
                <input
                  id="search-filter"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter resources..."
                  className="w-full md:w-48 pl-9 pr-8 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-xs sm:text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 focus:border-brand-aperol transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Dropdowns - 4 columns on mobile, flex row on desktop */}
            <div className="grid grid-cols-4 md:flex gap-3 md:gap-4">
              {/* Category Filter */}
              <div className="flex flex-col">
                <label htmlFor="category-filter" className="block text-xs font-accent uppercase tracking-wider text-[var(--fg-secondary)] mb-2">
                  Category
                </label>
                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="px-2 sm:px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-xs sm:text-sm text-[var(--fg-primary)] focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 focus:border-brand-aperol transition-colors cursor-pointer hover:border-brand-aperol/30 truncate"
                >
                  <option value="all">All</option>
                  {filterOptions.categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-category Filter */}
              <div className="flex flex-col">
                <label htmlFor="subcategory-filter" className="block text-xs font-accent uppercase tracking-wider text-[var(--fg-secondary)] mb-2">
                  Sub-cat
                </label>
                <select
                  id="subcategory-filter"
                  value={subCategoryFilter}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  className="px-2 sm:px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-xs sm:text-sm text-[var(--fg-primary)] focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 focus:border-brand-aperol transition-colors cursor-pointer hover:border-brand-aperol/30 truncate"
                >
                  <option value="all">All</option>
                  {filterOptions.subCategories.map((subCategory) => (
                    <option key={subCategory} value={subCategory}>
                      {subCategory}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pricing Filter */}
              <div className="flex flex-col">
                <label htmlFor="pricing-filter" className="block text-xs font-accent uppercase tracking-wider text-[var(--fg-secondary)] mb-2">
                  Pricing
                </label>
                <select
                  id="pricing-filter"
                  value={pricingFilter}
                  onChange={(e) => handlePricingChange(e.target.value)}
                  className="px-2 sm:px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-xs sm:text-sm text-[var(--fg-primary)] focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 focus:border-brand-aperol transition-colors cursor-pointer hover:border-brand-aperol/30 truncate"
                >
                  <option value="all">All</option>
                  {filterOptions.pricings.map((pricing) => (
                    <option key={pricing} value={pricing}>
                      {pricing}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div className="flex flex-col">
                <label htmlFor="rating-filter" className="block text-xs font-accent uppercase tracking-wider text-[var(--fg-secondary)] mb-2">
                  Rating
                </label>
                <select
                  id="rating-filter"
                  value={ratingFilter}
                  onChange={(e) => handleRatingChange(e.target.value)}
                  className="px-2 sm:px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-xs sm:text-sm text-[var(--fg-primary)] focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 focus:border-brand-aperol transition-colors cursor-pointer hover:border-brand-aperol/30 truncate"
                >
                  {RATING_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results Count - with breathing room */}
          <div className="text-sm text-[var(--fg-secondary)] pt-2">
            <span className="font-accent text-brand-aperol">{filteredAndSortedResources.length}</span>
            {' '}of{' '}
            <span className="font-medium">{resources.length}</span>
            {' '}resources
          </div>
        </div>
      </motion.div>

      {/* Mobile Card View */}
      <div className="sm:hidden">
        {filteredAndSortedResources.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: smoothEase }}
            className="p-8 text-center text-[var(--fg-secondary)] text-sm"
          >
            No resources match the selected filters.
          </motion.div>
        ) : (
          filteredAndSortedResources.map((resource, index) => (
            <motion.div
              key={resource.id}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={rowVariants}
            >
              <MobileResourceCard
                resource={resource}
                onClick={() => navigate(`/resource/${resource.id}`)}
              />
            </motion.div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse">
          <motion.thead
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1, ease: smoothEase }}
            className="sticky top-0 z-10 bg-[var(--bg-primary)] shadow-[0_1px_0_0_var(--border-secondary)]"
          >
            <tr className="border-b border-[var(--border-secondary)]">
              {/* Thumbnail Header */}
              <th className="w-16 p-4 bg-[var(--bg-primary)]">
                <span className="sr-only">Thumbnail</span>
              </th>

              {/* Name Header */}
              <th className="text-left p-4 bg-[var(--bg-primary)]">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 text-xs font-accent uppercase tracking-wider text-[var(--fg-secondary)] hover:text-brand-aperol transition-colors group"
                >
                  Name
                  {getSortIcon('name')}
                </button>
              </th>

              {/* Category Header */}
              <th className="text-left p-4 bg-[var(--bg-primary)]">
                <button
                  onClick={() => handleSort('category')}
                  className="flex items-center gap-2 text-xs font-accent uppercase tracking-wider text-[var(--fg-secondary)] hover:text-brand-aperol transition-colors group"
                >
                  Category
                  {getSortIcon('category')}
                </button>
              </th>

              {/* Sub-category Header */}
              <th className="text-left p-4 bg-[var(--bg-primary)] hidden lg:table-cell">
                <button
                  onClick={() => handleSort('subCategory')}
                  className="flex items-center gap-2 text-xs font-accent uppercase tracking-wider text-[var(--fg-secondary)] hover:text-brand-aperol transition-colors group"
                >
                  Sub-category
                  {getSortIcon('subCategory')}
                </button>
              </th>

              {/* Pricing Header */}
              <th className="text-left p-4 bg-[var(--bg-primary)]">
                <button
                  onClick={() => handleSort('pricing')}
                  className="flex items-center gap-2 text-xs font-accent uppercase tracking-wider text-[var(--fg-secondary)] hover:text-brand-aperol transition-colors group"
                >
                  Pricing
                  {getSortIcon('pricing')}
                </button>
              </th>

              {/* Rating Header */}
              <th className="text-left p-4 bg-[var(--bg-primary)]">
                <button
                  onClick={() => handleSort('gravityScore')}
                  className="flex items-center gap-2 text-xs font-accent uppercase tracking-wider text-[var(--fg-secondary)] hover:text-brand-aperol transition-colors group"
                >
                  Rating
                  {getSortIcon('gravityScore')}
                </button>
              </th>

              {/* Actions Header */}
              <th className="w-20 p-4 bg-[var(--bg-primary)]">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </motion.thead>
          <tbody>
            {filteredAndSortedResources.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-[var(--fg-secondary)]">
                  No resources match the selected filters.
                </td>
              </tr>
            ) : (
              filteredAndSortedResources.map((resource, index) => (
                <motion.tr
                  key={resource.id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={rowVariants}
                  onClick={() => navigate(`/resource/${resource.id}`)}
                  className="border-b border-[var(--border-secondary)]/50 hover:bg-[var(--bg-secondary)]/30 transition-colors group cursor-pointer"
                >
                  {/* Thumbnail Column */}
                  <td className="p-4">
                    <ResourceThumbnail resource={resource} />
                  </td>

                  {/* Name Column - Links to detail page */}
                  <td className="p-4">
                    <span className="font-medium text-[var(--fg-primary)] group-hover:text-brand-aperol transition-colors">
                      {resource.name}
                    </span>
                  </td>

                  {/* Category Column */}
                  <td className="p-4 text-[var(--fg-secondary)]">
                    {resource.category || '-'}
                  </td>

                  {/* Sub-category Column */}
                  <td className="p-4 text-[var(--fg-secondary)] hidden lg:table-cell">
                    {resource.subCategory || '-'}
                  </td>

                  {/* Pricing Column */}
                  <td className="p-4">
                    {resource.pricing ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[var(--bg-secondary)] text-xs font-accent font-bold uppercase text-[var(--fg-primary)] border border-[var(--border-secondary)]">
                        {resource.pricing}
                      </span>
                    ) : (
                      <span className="text-[var(--fg-secondary)]">-</span>
                    )}
                  </td>

                  {/* Rating Column */}
                  <td className="p-4">
                    {resource.gravityScore ? (
                      <GravityScoreBadge
                        score={resource.gravityScore}
                        size="sm"
                        showTooltip={false}
                      />
                    ) : (
                      <span className="text-[var(--fg-secondary)]">-</span>
                    )}
                  </td>

                  {/* Actions Column - External Link */}
                  <td className="p-4">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-[var(--fg-secondary)] hover:text-brand-aperol hover:border-brand-aperol/30 transition-all"
                      title={`Visit ${resource.name}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
