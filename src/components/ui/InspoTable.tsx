import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink, Search, X } from 'lucide-react';
import type { NormalizedResource } from '../../types/resource';
import { MobileResourceCard } from './MobileResourceCard';

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
      <div className="w-10 h-10 rounded-lg bg-os-surface-dark border border-os-border-dark flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-os-text-secondary-dark">{initial}</span>
      </div>
    );
  }

  // Show thumbnail if available
  if (hasThumbnail) {
    return (
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-os-surface-dark border border-os-border-dark flex-shrink-0 relative">
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
    <div className="w-10 h-10 rounded-lg overflow-hidden bg-os-surface-dark border border-os-border-dark flex items-center justify-center flex-shrink-0">
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

type SortField = 'name' | 'category' | 'subCategory' | 'pricing';
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
    if (tierFilter !== 'all') labels.push(`Tier ${tierFilter}`);
    if (featuredFilter === 'true') labels.push('Featured');
    if (opensourceFilter === 'true') labels.push('Open Source');
    return labels.join(', ');
  }, [categoryFilter, subCategoryFilter, pricingFilter, tierFilter, featuredFilter, opensourceFilter]);

  const hasActiveFilters = activeFilterLabel.length > 0;
  const showFilterBanner = isFromUrl && hasActiveFilters && !userHasModifiedFilters;

  // Clear all filters
  const clearFilters = () => {
    setCategoryFilter('all');
    setSubCategoryFilter('all');
    setPricingFilter('all');
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

      // Search filter
      const searchMatch = !searchQuery ||
        resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return categoryMatch && subCategoryMatch && pricingMatch && tierMatch && featuredMatch && opensourceMatch && searchMatch;
    });

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortField] || '';
        const bValue = b[sortField] || '';

        const comparison = aValue.toString().localeCompare(bValue.toString());
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [resources, categoryFilter, subCategoryFilter, pricingFilter, tierFilter, featuredFilter, opensourceFilter, searchQuery, sortField, sortDirection]);

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
    <div className="w-full">
      {/* Filter Active Banner - shows when navigating from ResourceDetail */}
      {showFilterBanner && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#FE5102]/10 border-b border-[#FE5102]/20">
          <span className="text-sm text-[#FE5102] font-medium">
            Showing results for: {activeFilterLabel}
          </span>
          <button
            onClick={clearFilters}
            className="text-xs text-zinc-400 hover:text-[#FFFAEE] transition-colors"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-os-bg-dark border-b border-os-border-dark">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-0">
          {/* Search Filter - Full width on mobile */}
          <div className="w-full sm:w-auto">
            <label htmlFor="search-filter" className="sr-only sm:not-sr-only block text-xs font-accent uppercase tracking-wider text-os-text-secondary-dark mb-1.5">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-os-text-secondary-dark" />
              <input
                id="search-filter"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter resources..."
                className="w-full sm:w-48 pl-9 pr-8 py-2 bg-os-surface-dark border border-os-border-dark rounded-lg text-xs sm:text-sm text-os-text-primary-dark placeholder:text-os-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 focus:border-brand-aperol transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-os-text-secondary-dark hover:text-os-text-primary-dark"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Dropdowns - 3 columns on mobile, flex on desktop */}
          <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-4 sm:flex-wrap sm:items-end">
            {/* Category Filter */}
            <div className="flex flex-col gap-1">
              <label htmlFor="category-filter" className="hidden sm:block text-xs font-accent uppercase tracking-wider text-os-text-secondary-dark">
                Category
              </label>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-2 sm:px-3 py-2 bg-os-surface-dark border border-os-border-dark rounded-lg text-xs sm:text-sm text-os-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 focus:border-brand-aperol transition-colors cursor-pointer hover:border-brand-aperol/30"
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
            <div className="flex flex-col gap-1">
              <label htmlFor="subcategory-filter" className="hidden sm:block text-xs font-accent uppercase tracking-wider text-os-text-secondary-dark">
                Sub-category
              </label>
              <select
                id="subcategory-filter"
                value={subCategoryFilter}
                onChange={(e) => handleSubCategoryChange(e.target.value)}
                className="px-2 sm:px-3 py-2 bg-os-surface-dark border border-os-border-dark rounded-lg text-xs sm:text-sm text-os-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 focus:border-brand-aperol transition-colors cursor-pointer hover:border-brand-aperol/30"
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
            <div className="flex flex-col gap-1">
              <label htmlFor="pricing-filter" className="hidden sm:block text-xs font-accent uppercase tracking-wider text-os-text-secondary-dark">
                Pricing
              </label>
              <select
                id="pricing-filter"
                value={pricingFilter}
                onChange={(e) => handlePricingChange(e.target.value)}
                className="px-2 sm:px-3 py-2 bg-os-surface-dark border border-os-border-dark rounded-lg text-xs sm:text-sm text-os-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-aperol/50 focus:border-brand-aperol transition-colors cursor-pointer hover:border-brand-aperol/30"
              >
                <option value="all">All</option>
                {filterOptions.pricings.map((pricing) => (
                  <option key={pricing} value={pricing}>
                    {pricing}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-xs sm:text-sm text-os-text-secondary-dark pt-1 sm:pt-0">
            <span className="font-accent text-brand-aperol">{filteredAndSortedResources.length}</span>
            {' '}of{' '}
            <span className="font-medium">{resources.length}</span>
            {' '}resources
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden">
        {filteredAndSortedResources.length === 0 ? (
          <div className="p-8 text-center text-os-text-secondary-dark text-sm">
            No resources match the selected filters.
          </div>
        ) : (
          filteredAndSortedResources.map((resource) => (
            <MobileResourceCard
              key={resource.id}
              resource={resource}
              onClick={() => navigate(`/resource/${resource.id}`)}
            />
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-os-bg-dark shadow-[0_1px_0_0_rgba(255,255,255,0.1)]">
            <tr className="border-b border-os-border-dark">
              {/* Thumbnail Header */}
              <th className="w-16 p-4 bg-os-bg-dark">
                <span className="sr-only">Thumbnail</span>
              </th>

              {/* Name Header */}
              <th className="text-left p-4 bg-os-bg-dark">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 text-xs font-accent uppercase tracking-wider text-os-text-secondary-dark hover:text-brand-aperol transition-colors group"
                >
                  Name
                  {getSortIcon('name')}
                </button>
              </th>

              {/* Category Header */}
              <th className="text-left p-4 bg-os-bg-dark">
                <button
                  onClick={() => handleSort('category')}
                  className="flex items-center gap-2 text-xs font-accent uppercase tracking-wider text-os-text-secondary-dark hover:text-brand-aperol transition-colors group"
                >
                  Category
                  {getSortIcon('category')}
                </button>
              </th>

              {/* Sub-category Header */}
              <th className="text-left p-4 bg-os-bg-dark">
                <button
                  onClick={() => handleSort('subCategory')}
                  className="flex items-center gap-2 text-xs font-accent uppercase tracking-wider text-os-text-secondary-dark hover:text-brand-aperol transition-colors group"
                >
                  Sub-category
                  {getSortIcon('subCategory')}
                </button>
              </th>

              {/* Pricing Header */}
              <th className="text-left p-4 bg-os-bg-dark">
                <button
                  onClick={() => handleSort('pricing')}
                  className="flex items-center gap-2 text-xs font-accent uppercase tracking-wider text-os-text-secondary-dark hover:text-brand-aperol transition-colors group"
                >
                  Pricing
                  {getSortIcon('pricing')}
                </button>
              </th>

              {/* Actions Header */}
              <th className="w-20 p-4 bg-os-bg-dark">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedResources.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-os-text-secondary-dark">
                  No resources match the selected filters.
                </td>
              </tr>
            ) : (
              filteredAndSortedResources.map((resource) => (
                <tr
                  key={resource.id}
                  onClick={() => navigate(`/resource/${resource.id}`)}
                  className="border-b border-os-border-dark/50 hover:bg-os-surface-dark/30 transition-colors group cursor-pointer"
                >
                  {/* Thumbnail Column */}
                  <td className="p-4">
                    <ResourceThumbnail resource={resource} />
                  </td>

                  {/* Name Column - Links to detail page */}
                  <td className="p-4">
                    <span className="font-medium text-os-text-primary-dark group-hover:text-brand-aperol transition-colors">
                      {resource.name}
                    </span>
                  </td>

                  {/* Category Column */}
                  <td className="p-4 text-os-text-secondary-dark">
                    {resource.category || '-'}
                  </td>

                  {/* Sub-category Column */}
                  <td className="p-4 text-os-text-secondary-dark">
                    {resource.subCategory || '-'}
                  </td>

                  {/* Pricing Column */}
                  <td className="p-4">
                    {resource.pricing ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-os-surface-dark text-xs font-accent text-os-text-primary-dark border border-os-border-dark">
                        {resource.pricing}
                      </span>
                    ) : (
                      <span className="text-os-text-secondary-dark">-</span>
                    )}
                  </td>

                  {/* Actions Column - External Link */}
                  <td className="p-4">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-os-surface-dark border border-os-border-dark text-os-text-secondary-dark hover:text-brand-aperol hover:border-brand-aperol/30 transition-all"
                      title={`Visit ${resource.name}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
