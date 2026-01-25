import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink } from 'lucide-react';
import type { NormalizedResource } from '../../types/resource';

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
      <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-zinc-400">{initial}</span>
      </div>
    );
  }

  // Show thumbnail if available
  if (hasThumbnail) {
    return (
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0 relative">
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
    <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
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
}

type SortField = 'name' | 'category' | 'subCategory' | 'pricing';
type SortDirection = 'asc' | 'desc' | null;

export function InspoTable({ resources }: InspoTableProps) {
  const navigate = useNavigate();

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>('all');
  const [pricingFilter, setPricingFilter] = useState<string>('all');

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
      return categoryMatch && subCategoryMatch && pricingMatch;
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
  }, [resources, categoryFilter, subCategoryFilter, pricingFilter, sortField, sortDirection]);

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
      return <ChevronUp className="w-4 h-4 text-[#FE5102]" />;
    }
    return <ChevronDown className="w-4 h-4 text-[#FE5102]" />;
  };

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="bg-[#141414] border-b border-zinc-800">
        <div className="flex flex-wrap gap-4 p-4">
          {/* Category Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="category-filter" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Category
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-[#FFFAEE] focus:outline-none focus:ring-2 focus:ring-[#FE5102]/50 focus:border-[#FE5102] transition-colors cursor-pointer hover:border-[#FE5102]/30"
            >
              <option value="all">All Categories</option>
              {filterOptions.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-category Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="subcategory-filter" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Sub-category
            </label>
            <select
              id="subcategory-filter"
              value={subCategoryFilter}
              onChange={(e) => setSubCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-[#FFFAEE] focus:outline-none focus:ring-2 focus:ring-[#FE5102]/50 focus:border-[#FE5102] transition-colors cursor-pointer hover:border-[#FE5102]/30"
            >
              <option value="all">All Sub-categories</option>
              {filterOptions.subCategories.map((subCategory) => (
                <option key={subCategory} value={subCategory}>
                  {subCategory}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pricing-filter" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Pricing
            </label>
            <select
              id="pricing-filter"
              value={pricingFilter}
              onChange={(e) => setPricingFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-[#FFFAEE] focus:outline-none focus:ring-2 focus:ring-[#FE5102]/50 focus:border-[#FE5102] transition-colors cursor-pointer hover:border-[#FE5102]/30"
            >
              <option value="all">All Pricing</option>
              {filterOptions.pricings.map((pricing) => (
                <option key={pricing} value={pricing}>
                  {pricing}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end ml-auto">
            <div className="px-3 py-2 text-sm text-zinc-500">
              <span className="font-medium text-[#FE5102]">{filteredAndSortedResources.length}</span>
              {' '}of{' '}
              <span className="font-medium">{resources.length}</span>
              {' '}resources
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-[#141414] shadow-[0_1px_0_0_rgba(255,255,255,0.1)]">
            <tr className="border-b border-zinc-800">
              {/* Thumbnail Header */}
              <th className="w-16 p-4 bg-[#141414]">
                <span className="sr-only">Thumbnail</span>
              </th>

              {/* Name Header */}
              <th className="text-left p-4 bg-[#141414]">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500 hover:text-[#FE5102] transition-colors group"
                >
                  Name
                  {getSortIcon('name')}
                </button>
              </th>

              {/* Category Header */}
              <th className="text-left p-4 bg-[#141414]">
                <button
                  onClick={() => handleSort('category')}
                  className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500 hover:text-[#FE5102] transition-colors group"
                >
                  Category
                  {getSortIcon('category')}
                </button>
              </th>

              {/* Sub-category Header */}
              <th className="text-left p-4 bg-[#141414]">
                <button
                  onClick={() => handleSort('subCategory')}
                  className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500 hover:text-[#FE5102] transition-colors group"
                >
                  Sub-category
                  {getSortIcon('subCategory')}
                </button>
              </th>

              {/* Pricing Header */}
              <th className="text-left p-4 bg-[#141414]">
                <button
                  onClick={() => handleSort('pricing')}
                  className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500 hover:text-[#FE5102] transition-colors group"
                >
                  Pricing
                  {getSortIcon('pricing')}
                </button>
              </th>

              {/* Actions Header */}
              <th className="w-20 p-4 bg-[#141414]">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedResources.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-zinc-500">
                  No resources match the selected filters.
                </td>
              </tr>
            ) : (
              filteredAndSortedResources.map((resource) => (
                <tr
                  key={resource.id}
                  onClick={() => navigate(`/resource/${resource.id}`)}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                >
                  {/* Thumbnail Column */}
                  <td className="p-4">
                    <ResourceThumbnail resource={resource} />
                  </td>

                  {/* Name Column - Links to detail page */}
                  <td className="p-4">
                    <span className="font-medium text-[#FFFAEE] group-hover:text-[#FE5102] transition-colors">
                      {resource.name}
                    </span>
                  </td>

                  {/* Category Column */}
                  <td className="p-4 text-zinc-400">
                    {resource.category || '-'}
                  </td>

                  {/* Sub-category Column */}
                  <td className="p-4 text-zinc-400">
                    {resource.subCategory || '-'}
                  </td>

                  {/* Pricing Column */}
                  <td className="p-4">
                    {resource.pricing ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-800 text-xs font-medium text-[#FFFAEE] border border-zinc-700">
                        {resource.pricing}
                      </span>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </td>

                  {/* Actions Column - External Link */}
                  <td className="p-4">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-[#FE5102] hover:border-[#FE5102]/30 transition-all"
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
