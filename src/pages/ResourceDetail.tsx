import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Tag, DollarSign, Star, Github } from 'lucide-react';
import { resources } from '../data';
import { CATEGORY_COLORS, DEFAULT_COLOR } from '../types/resource';

/**
 * Get favicon URL for a given website URL
 */
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return '';
  }
}

/**
 * ResourceDetail Page
 *
 * Displays detailed information about a single resource.
 * Includes thumbnail/screenshot, description, tags, pricing, and external link.
 */
export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Find the resource
  const resource = resources.find(r => r.id === Number(id));

  // Handle resource not found
  if (!resource) {
    return (
      <div className="min-h-screen bg-[#141414] text-[#FFFAEE] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Resource Not Found</h1>
          <p className="text-zinc-500 mb-6">The resource you're looking for doesn't exist.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FE5102] text-white rounded-lg hover:bg-[#FE5102]/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Universe
          </Link>
        </div>
      </div>
    );
  }

  const categoryColor = resource.category
    ? CATEGORY_COLORS[resource.category] || DEFAULT_COLOR
    : DEFAULT_COLOR;

  const faviconUrl = getFaviconUrl(resource.url);

  return (
    <div className="min-h-screen bg-[#141414] text-[#FFFAEE]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#141414]/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#FFFAEE] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Hero Section */}
          <div className="flex items-start gap-6 mb-8">
            {/* Favicon / Thumbnail */}
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800 border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: categoryColor }}
            >
              {resource.thumbnail ? (
                <img
                  src={resource.thumbnail}
                  alt={resource.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = faviconUrl;
                    (e.target as HTMLImageElement).className = 'w-12 h-12 object-contain';
                  }}
                />
              ) : faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt={resource.name}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <span className="text-2xl font-bold text-zinc-400">
                  {resource.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Title and Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">
                    {resource.name}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Category Badge */}
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: categoryColor }}
                    >
                      {resource.category || 'Uncategorized'}
                    </span>

                    {/* Subcategory */}
                    {resource.subCategory && (
                      <span className="text-sm text-zinc-500">
                        {resource.subCategory}
                      </span>
                    )}

                    {/* Featured Badge */}
                    {resource.featured && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                        <Star className="w-3 h-3" />
                        Featured
                      </span>
                    )}

                    {/* Open Source Badge */}
                    {resource.opensource && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                        <Github className="w-3 h-3" />
                        Open Source
                      </span>
                    )}
                  </div>
                </div>

                {/* External Link Button */}
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#FE5102] text-white rounded-lg hover:bg-[#FE5102]/90 transition-colors flex-shrink-0"
                >
                  Visit Site
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Screenshot */}
          {resource.screenshot && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <img
                  src={resource.screenshot}
                  alt={`${resource.name} screenshot`}
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          )}

          {/* Description */}
          {resource.description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8"
            >
              <h2 className="text-lg font-semibold mb-3">About</h2>
              <p className="text-zinc-300 leading-relaxed">
                {resource.description}
              </p>
            </motion.div>
          )}

          {/* Details Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
          >
            {/* Pricing */}
            {resource.pricing && (
              <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                  <DollarSign className="w-4 h-4" />
                  Pricing
                </div>
                <span className="text-[#FFFAEE] font-medium">
                  {resource.pricing}
                </span>
              </div>
            )}

            {/* URL */}
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                <ExternalLink className="w-4 h-4" />
                Website
              </div>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FE5102] hover:underline truncate block"
              >
                {new URL(resource.url).hostname}
              </a>
            </div>
          </motion.div>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-3">
                <Tag className="w-4 h-4" />
                Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-sm border border-zinc-700 hover:border-zinc-600 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
