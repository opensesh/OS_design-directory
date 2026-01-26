import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  Tag,
  DollarSign,
  Star,
  Code,
  Globe,
  Folder,
  Layers,
  Copy,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import { resources } from '../data';

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
 * Get domain from URL
 */
function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Pricing badge styles based on pricing type
 */
function getPricingStyle(pricing: string | null) {
  if (!pricing) return { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700' };

  const lower = pricing.toLowerCase();
  if (lower === 'free') return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  if (lower === 'freemium') return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
  if (lower === 'paid' || lower === 'pay per use') return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' };
  return { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700' };
}

/**
 * ResourceDetail Page
 *
 * Displays detailed information about a single resource with:
 * - Browser mockup frame for screenshots
 * - Hero section with favicon/thumbnail
 * - About section with description and tags
 * - Details section with category, pricing, and badges
 * - Related resources section with smart matching
 */
export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [screenshotError, setScreenshotError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  // Find the resource
  const resource = resources.find(r => r.id === Number(id));

  // Calculate related resources based on shared tags, category, and subcategory
  const relatedResources = useMemo(() => {
    if (!resource) return [];

    const resourceTags = resource.tags || [];

    return resources
      .filter(r => r.id !== resource.id)
      .map(r => {
        let score = 0;
        const rTags = r.tags || [];

        // +3 points per shared tag
        const sharedTags = resourceTags.filter(t =>
          rTags.some(rt => rt.toLowerCase() === t.toLowerCase())
        );
        score += sharedTags.length * 3;

        // +2 points for same sub-category
        if (r.subCategory && r.subCategory === resource.subCategory) score += 2;

        // +1 point for same category
        if (r.category && r.category === resource.category) score += 1;

        return { resource: r, score };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(s => s.resource);
  }, [resource]);

  // Copy URL to clipboard
  const copyUrl = async () => {
    if (resource) {
      try {
        await navigator.clipboard.writeText(resource.url);
        setUrlCopied(true);
        setTimeout(() => setUrlCopied(false), 2000);
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = resource.url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setUrlCopied(true);
        setTimeout(() => setUrlCopied(false), 2000);
      }
    }
  };

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

  const faviconUrl = getFaviconUrl(resource.url);
  const domain = getDomain(resource.url);
  const pricingStyle = getPricingStyle(resource.pricing);
  const hasThumbnail = resource.thumbnail && !imgError;
  const hasScreenshot = resource.screenshot && !screenshotError;

  return (
    <div className="min-h-screen bg-[#141414] text-[#FFFAEE]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#141414]/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
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
      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Screenshot Section - Browser Mockup Frame */}
          {hasScreenshot && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-8"
            >
              <div className="rounded-lg overflow-hidden border border-zinc-800/50 shadow-xl bg-zinc-900">
                {/* Browser chrome with traffic lights */}
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border-b border-zinc-800/50">
                  {/* Traffic lights */}
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  {/* URL bar */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 rounded-md max-w-xs w-full">
                      <Globe className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                      <span className="text-[11px] text-zinc-500 truncate">{domain}</span>
                    </div>
                  </div>
                  {/* Spacer for symmetry */}
                  <div className="w-[42px]" />
                </div>
                {/* Screenshot */}
                <div className="relative aspect-[16/7] md:aspect-[16/6] bg-zinc-950">
                  <img
                    src={resource.screenshot!}
                    alt={`Screenshot of ${resource.name}`}
                    className="w-full h-full object-cover object-top"
                    onError={() => setScreenshotError(true)}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Hero Section */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start mb-8">
            {/* Left: Thumbnail/Favicon */}
            <div className="shrink-0">
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 shadow-xl">
                {hasThumbnail ? (
                  <img
                    src={resource.thumbnail!}
                    alt={resource.name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : faviconUrl && !faviconError ? (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <img
                      src={faviconUrl}
                      alt={resource.name}
                      className="w-10 h-10 object-contain"
                      onError={() => setFaviconError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <span className="text-2xl font-bold text-zinc-400">
                      {resource.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
                {resource.name}
              </h1>

              {/* Domain */}
              <div className="flex items-center gap-2 text-zinc-500 mb-4">
                <Globe className="w-3.5 h-3.5" />
                <span className="text-sm">{domain}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#FE5102] text-white rounded-lg hover:bg-[#FE5102]/90 transition-all font-medium text-sm"
                >
                  <span>Visit Website</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={copyUrl}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                    urlCopied
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-[#FFFAEE]'
                  }`}
                >
                  {urlCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* About Section - Description + Tags */}
          {(resource.description || (resource.tags && resource.tags.length > 0)) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <h2 className="text-xs font-semibold text-[#FFFAEE] mb-3 uppercase tracking-wide flex items-center gap-2">
                <span className="w-6 h-px bg-[#FE5102]" />
                About
              </h2>

              {resource.description && (
                <p className="text-sm leading-relaxed text-zinc-300 mb-4">
                  {resource.description}
                </p>
              )}

              {/* Tags with Tag icon */}
              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {resource.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/50 text-xs text-zinc-400"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Details Section - Category, Pricing, Badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <h2 className="text-xs font-semibold text-[#FFFAEE] mb-3 uppercase tracking-wide flex items-center gap-2">
              <span className="w-6 h-px bg-[#FE5102]" />
              Details
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Category - Aperol colored */}
              {resource.category && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FE5102]/10 text-[#FE5102] text-xs font-medium border border-[#FE5102]/20">
                  <Folder className="w-3 h-3" />
                  {resource.category}
                </span>
              )}

              {/* Subcategory - Gray */}
              {resource.subCategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-400 text-xs border border-zinc-700">
                  <Layers className="w-3 h-3" />
                  {resource.subCategory}
                </span>
              )}

              {/* Pricing - Color coded */}
              {resource.pricing && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${pricingStyle.bg} ${pricingStyle.text} ${pricingStyle.border}`}>
                  <DollarSign className="w-3 h-3" />
                  {resource.pricing}
                </span>
              )}

              {/* Tier - Gray */}
              {resource.tier && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-400 text-xs border border-zinc-700">
                  <Layers className="w-3 h-3" />
                  Tier {resource.tier}
                </span>
              )}

              {/* Featured - Amber */}
              {resource.featured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                  <Star className="w-3 h-3 fill-current" />
                  Featured
                </span>
              )}

              {/* Open Source - Emerald */}
              {resource.opensource && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  <Code className="w-3 h-3" />
                  Open Source
                </span>
              )}
            </div>
          </motion.div>

          {/* Related Resources */}
          {relatedResources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 pt-6 border-t border-zinc-800/30"
            >
              <h2 className="text-xs font-semibold text-[#FFFAEE] mb-3 uppercase tracking-wide flex items-center gap-2">
                <span className="w-6 h-px bg-[#FE5102]" />
                Related Resources
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedResources.map((related) => {
                  const relatedFavicon = getFaviconUrl(related.url);
                  return (
                    <Link
                      key={related.id}
                      to={`/resource/${related.id}`}
                      className="group flex items-center gap-3 p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30 hover:border-[#FE5102]/30 hover:bg-zinc-800/60 transition-all"
                    >
                      {/* Mini thumbnail with favicon fallback */}
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0 flex items-center justify-center">
                        {related.thumbnail ? (
                          <img
                            src={related.thumbnail}
                            alt={related.name}
                            className="w-full h-full object-cover"
                          />
                        ) : relatedFavicon ? (
                          <img
                            src={relatedFavicon}
                            alt={related.name}
                            className="w-6 h-6 object-contain"
                          />
                        ) : (
                          <span className="text-xs font-medium text-zinc-400">
                            {related.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-[#FFFAEE] group-hover:text-[#FE5102] transition-colors truncate">
                          {related.name}
                        </h3>
                        <p className="text-xs text-zinc-500 truncate">
                          {related.subCategory || related.category || 'Resource'}
                        </p>
                      </div>

                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#FE5102] transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
