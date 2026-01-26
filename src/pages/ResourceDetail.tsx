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
 * Split description into two paragraphs at a sentence boundary near the middle
 */
function splitDescription(description: string): [string, string] {
  // Find all sentence endings (. followed by space and capital letter, or end of string)
  const sentences = description.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [description];

  if (sentences.length <= 2) {
    // If only 1-2 sentences, split at first sentence
    const firstSentence = sentences[0]?.trim() || '';
    const rest = sentences.slice(1).join('').trim();
    return [firstSentence, rest];
  }

  // Find the split point closest to the middle
  const midpoint = description.length / 2;
  let currentLength = 0;
  let splitIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    currentLength += sentences[i].length;
    if (currentLength >= midpoint) {
      // Choose this or previous based on which is closer to middle
      splitIndex = i + 1;
      break;
    }
  }

  // Ensure we don't have empty paragraphs
  if (splitIndex === 0) splitIndex = 1;
  if (splitIndex >= sentences.length) splitIndex = sentences.length - 1;

  const firstPart = sentences.slice(0, splitIndex).join('').trim();
  const secondPart = sentences.slice(splitIndex).join('').trim();

  return [firstPart, secondPart];
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
        <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-3 items-center">
          {/* Left: Back button */}
          <div className="justify-self-start">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#FFFAEE] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* Center: Breadcrumbs - truly centered, hidden on mobile */}
          <div className="hidden md:flex justify-self-center items-center gap-2 text-sm">
            <Link
              to={`/?display=table&category=${encodeURIComponent(resource.category || '')}`}
              className="text-zinc-400 hover:text-[#FFFAEE] transition-colors"
            >
              {resource.category || 'Resource'}
            </Link>
            <span className="text-zinc-600">/</span>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group text-[#FFFAEE] hover:text-[#FE5102] flex items-center gap-1 transition-colors"
            >
              {resource.name}
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          {/* Right: Action buttons */}
          <div className="justify-self-end flex items-center gap-2">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#FE5102] text-white rounded-lg hover:bg-[#FE5102]/90 transition-all font-medium text-sm whitespace-nowrap"
            >
              <span>Visit Site</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={copyUrl}
              className={`relative group inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-all ${
                urlCopied
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-[#FFFAEE] hover:border-zinc-600'
              }`}
            >
              {urlCopied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {/* CSS tooltip */}
              <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900 text-xs text-zinc-200 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-zinc-700">
                {urlCopied ? 'Copied!' : 'Copy URL'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Screenshot Container with Actions */}
          {hasScreenshot && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-8"
            >
              <div className="bg-[#191919] rounded-xl p-6 flex items-center justify-center min-h-[400px]">
                {/* Browser Mockup - centered and smaller */}
                <div className="rounded-lg overflow-hidden border border-zinc-800/50 max-w-2xl w-full shadow-2xl">
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
                  {/* Screenshot - object-contain to show full image */}
                  <div className="relative aspect-[16/10] bg-zinc-950">
                    <img
                      src={resource.screenshot!}
                      alt={`Screenshot of ${resource.name}`}
                      className="w-full h-full object-contain"
                      onError={() => setScreenshotError(true)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Info Section - Two Column Layout */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row md:items-start gap-6 mb-6"
          >
            {/* Left: Icon + Title + Domain + Tags */}
            <div className="flex items-start gap-4">
              {/* Thumbnail/Favicon */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 shadow-lg flex-shrink-0">
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
                      className="w-8 h-8 object-contain"
                      onError={() => setFaviconError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <span className="text-xl font-bold text-zinc-400">
                      {resource.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Title + Domain + Tags */}
              <div>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2"
                >
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight group-hover:text-[#FE5102] transition-colors">
                    {resource.name}
                  </h1>
                  <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-[#FE5102]" />
                </a>
                <div className="flex items-center gap-1.5 text-zinc-500 mb-2">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="text-sm">{domain}</span>
                </div>

                {/* Tags */}
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
              </div>
            </div>

            {/* Right: Details - responsive layout */}
            {/* Desktop: horizontal */}
            <div className="hidden md:flex items-center gap-3 md:ml-auto">
              <h2 className="text-xs font-semibold text-[#FFFAEE] uppercase tracking-wide flex items-center gap-2 flex-shrink-0">
                <span className="w-6 h-px bg-[#FE5102]" />
                Details
              </h2>
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Category - Aperol colored */}
                {resource.category && (
                  <Link
                    to={`/?display=table&category=${encodeURIComponent(resource.category)}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FE5102]/10 text-[#FE5102] text-xs font-medium border border-[#FE5102]/20 hover:bg-[#FE5102]/20 transition-colors"
                  >
                    <Folder className="w-3 h-3" />
                    {resource.category}
                  </Link>
                )}

                {/* Subcategory - Gray */}
                {resource.subCategory && (
                  <Link
                    to={`/?display=table&subCategory=${encodeURIComponent(resource.subCategory)}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-400 text-xs border border-zinc-700 hover:bg-zinc-700 hover:text-[#FFFAEE] transition-colors"
                  >
                    <Layers className="w-3 h-3" />
                    {resource.subCategory}
                  </Link>
                )}

                {/* Pricing - Color coded */}
                {resource.pricing && (
                  <Link
                    to={`/?display=table&pricing=${encodeURIComponent(resource.pricing)}`}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border hover:opacity-80 transition-colors ${pricingStyle.bg} ${pricingStyle.text} ${pricingStyle.border}`}
                  >
                    <DollarSign className="w-3 h-3" />
                    {resource.pricing}
                  </Link>
                )}

                {/* Tier - Gray */}
                {resource.tier && (
                  <Link
                    to={`/?display=table&tier=${resource.tier}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-400 text-xs border border-zinc-700 hover:bg-zinc-700 hover:text-[#FFFAEE] transition-colors"
                  >
                    <Layers className="w-3 h-3" />
                    Tier {resource.tier}
                  </Link>
                )}

                {/* Featured - Amber */}
                {resource.featured && (
                  <Link
                    to="/?display=table&featured=true"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                  >
                    <Star className="w-3 h-3 fill-current" />
                    Featured
                  </Link>
                )}

                {/* Open Source - Emerald */}
                {resource.opensource && (
                  <Link
                    to="/?display=table&opensource=true"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Code className="w-3 h-3" />
                    Open Source
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile: vertical stack */}
            <div className="md:hidden">
              <h2 className="text-xs font-semibold text-[#FFFAEE] uppercase tracking-wide flex items-center gap-2 mb-2">
                <span className="w-6 h-px bg-[#FE5102]" />
                Details
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {/* Category - Aperol colored */}
                {resource.category && (
                  <Link
                    to={`/?display=table&category=${encodeURIComponent(resource.category)}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FE5102]/10 text-[#FE5102] text-xs font-medium border border-[#FE5102]/20 hover:bg-[#FE5102]/20 transition-colors"
                  >
                    <Folder className="w-3 h-3" />
                    {resource.category}
                  </Link>
                )}

                {/* Subcategory - Gray */}
                {resource.subCategory && (
                  <Link
                    to={`/?display=table&subCategory=${encodeURIComponent(resource.subCategory)}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-400 text-xs border border-zinc-700 hover:bg-zinc-700 hover:text-[#FFFAEE] transition-colors"
                  >
                    <Layers className="w-3 h-3" />
                    {resource.subCategory}
                  </Link>
                )}

                {/* Pricing - Color coded */}
                {resource.pricing && (
                  <Link
                    to={`/?display=table&pricing=${encodeURIComponent(resource.pricing)}`}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border hover:opacity-80 transition-colors ${pricingStyle.bg} ${pricingStyle.text} ${pricingStyle.border}`}
                  >
                    <DollarSign className="w-3 h-3" />
                    {resource.pricing}
                  </Link>
                )}

                {/* Tier - Gray */}
                {resource.tier && (
                  <Link
                    to={`/?display=table&tier=${resource.tier}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-400 text-xs border border-zinc-700 hover:bg-zinc-700 hover:text-[#FFFAEE] transition-colors"
                  >
                    <Layers className="w-3 h-3" />
                    Tier {resource.tier}
                  </Link>
                )}

                {/* Featured - Amber */}
                {resource.featured && (
                  <Link
                    to="/?display=table&featured=true"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                  >
                    <Star className="w-3 h-3 fill-current" />
                    Featured
                  </Link>
                )}

                {/* Open Source - Emerald */}
                {resource.opensource && (
                  <Link
                    to="/?display=table&opensource=true"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Code className="w-3 h-3" />
                    Open Source
                  </Link>
                )}
              </div>
            </div>
          </motion.div>

          {/* About Section - Full width description */}
          {resource.description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <h2 className="text-xs font-semibold text-[#FFFAEE] mb-3 uppercase tracking-wide flex items-center gap-2">
                <span className="w-6 h-px bg-[#FE5102]" />
                About
              </h2>

              {(() => {
                const [first, second] = splitDescription(resource.description);
                return (
                  <div className="space-y-3">
                    <p className="text-sm leading-relaxed text-zinc-300">
                      {first}
                    </p>
                    {second && (
                      <p className="text-sm leading-relaxed text-zinc-300">
                        {second}
                      </p>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}

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
