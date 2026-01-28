import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
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
  Search,
  ChevronRight,
} from 'lucide-react';
import { resources } from '../data';
import { RatingScale } from '../components/ui/RatingScale';
import { SearchModal } from '../components/search/SearchModal';

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
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

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

  // Preload screenshot image to get dimensions for adaptive aspect ratio
  useEffect(() => {
    if (resource?.screenshot) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = resource.screenshot;
    } else {
      setImageDimensions(null);
    }
  }, [resource?.screenshot]);

  // Calculate aspect ratio dynamically based on image dimensions
  const aspectRatio = imageDimensions
    ? `${imageDimensions.width}/${imageDimensions.height}`
    : '16/10'; // fallback while loading

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
      {/* Header - Consistent with Home */}
      <header className="sticky top-0 z-10 bg-[#141414]/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left: Logo */}
          <Link
            to="/"
            className="flex items-center justify-center w-10 h-10 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors"
          >
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
          </Link>

          {/* Center: Breadcrumbs - desktop only */}
          <div className="hidden md:flex items-center gap-2 text-sm">
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

          {/* Right: Desktop actions + Mobile search */}
          <div className="flex items-center gap-2">
            {/* Mobile: Search button */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="flex md:hidden items-center justify-center w-10 h-10 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-400 hover:text-[#FFFAEE] hover:border-zinc-600 transition-all"
              aria-label="Search resources"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Subheader - Mobile only: Back + Breadcrumbs */}
      <div className="md:hidden flex items-center px-6 py-3 border-b border-zinc-800 bg-[#141414]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="shrink-0 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
          </button>
          <nav className="flex items-center gap-1 text-sm min-w-0">
            <Link
              to={`/?display=table&category=${encodeURIComponent(resource.category || '')}`}
              className="text-zinc-400 hover:text-[#FFFAEE] truncate transition-colors"
            >
              {resource.category || 'Resource'}
            </Link>
            <ChevronRight className="w-3 h-3 shrink-0 text-zinc-600" />
            <span className="text-[#FFFAEE] truncate">
              {resource.subCategory || resource.name}
            </span>
          </nav>
        </div>
      </div>

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
              <div className="relative bg-[#191919] rounded-xl p-6 flex items-center justify-center">
                {/* Browser Mockup - centered with adaptive aspect ratio */}
                <div className="rounded-lg overflow-hidden border border-zinc-800/50 max-w-2xl w-full shadow-2xl max-h-[70vh]">
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
                  {/* Screenshot - adaptive aspect ratio based on image dimensions */}
                  <div
                    className="relative bg-zinc-950"
                    style={{
                      aspectRatio,
                      maxHeight: 'calc(70vh - 100px)', // Account for browser chrome and padding
                      width: '100%',
                    }}
                  >
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

          {/* Title + Tags Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            {/* Icon + Title + Buttons Row */}
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

              {/* Title + Domain + Buttons */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  {/* Clickable Title + Domain */}
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block min-w-0 flex-1"
                  >
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight group-hover:text-[#FE5102] transition-colors">
                      {resource.name}
                    </h1>
                    <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-[#FE5102] transition-colors mt-1">
                      <Globe className="w-3.5 h-3.5" />
                      <span className="text-sm truncate">{domain}</span>
                    </div>
                  </a>

                  {/* Mobile action buttons - inline on sm+, hidden on xs */}
                  <div className="hidden sm:flex md:hidden items-center gap-1.5 flex-shrink-0">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FE5102] text-white text-xs font-medium rounded-lg hover:bg-[#FE5102]/90 transition-colors"
                    >
                      Website
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={copyUrl}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs transition-all ${
                        urlCopied
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {urlCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{urlCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Desktop action buttons - next to title */}
                  <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#FE5102] text-white text-sm font-medium rounded-lg hover:bg-[#FE5102]/90 transition-colors"
                    >
                      Website
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                    <button
                      onClick={copyUrl}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                        urlCopied
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-[#FFFAEE] hover:bg-zinc-700'
                      }`}
                    >
                      {urlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="text-sm">{urlCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* XS mobile action buttons - below title on very small screens */}
                <div className="flex sm:hidden items-center gap-1.5 mt-3">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FE5102] text-white text-xs font-medium rounded-lg hover:bg-[#FE5102]/90 transition-colors"
                  >
                    Website
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={copyUrl}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs transition-all ${
                      urlCopied
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {urlCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{urlCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tags - Outside flex, aligned with icon's left edge */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg px-3 py-2 mt-4">
                <div className="flex flex-wrap gap-1.5">
                  {resource.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/50 text-zinc-400"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Rating & Details - With section headers */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-6 mb-6"
          >
            {/* Rating Section */}
            {resource.gravityScore && (
              <div>
                <h2 className="text-xs font-semibold text-[#FFFAEE] mb-3 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-6 h-px bg-[#FE5102]" />
                  Rating
                </h2>
                <RatingScale
                  score={resource.gravityScore}
                  rationale={resource.gravityRationale}
                  showTooltip={true}
                  animateOnMount
                />
              </div>
            )}

            {/* Details Section */}
            <div>
              <h2 className="text-xs font-semibold text-[#FFFAEE] mb-3 uppercase tracking-wide flex items-center gap-2">
                <span className="w-6 h-px bg-[#FE5102]" />
                Details
              </h2>
              <div className="flex flex-wrap gap-1.5">
              {/* Category - Aperol colored */}
              {resource.category && (
                <Link
                  to={`/?display=table&category=${encodeURIComponent(resource.category)}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FE5102]/10 text-[#FE5102] text-xs border border-[#FE5102]/20 hover:bg-[#FE5102]/20 transition-colors"
                >
                  <Folder className="w-2.5 h-2.5" />
                  {resource.category}
                </Link>
              )}

              {/* Subcategory - Gray */}
              {resource.subCategory && (
                <Link
                  to={`/?display=table&subCategory=${encodeURIComponent(resource.subCategory)}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/60 text-zinc-400 text-xs border border-zinc-700/50 hover:bg-zinc-700 hover:text-[#FFFAEE] transition-colors"
                >
                  <Layers className="w-2.5 h-2.5" />
                  {resource.subCategory}
                </Link>
              )}

              {/* Pricing - Color coded */}
              {resource.pricing && (
                <Link
                  to={`/?display=table&pricing=${encodeURIComponent(resource.pricing)}`}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border hover:opacity-80 transition-colors ${pricingStyle.bg} ${pricingStyle.text} ${pricingStyle.border}`}
                >
                  <DollarSign className="w-2.5 h-2.5" />
                  {resource.pricing}
                </Link>
              )}

              {/* Tier - Gray */}
              {resource.tier && (
                <Link
                  to={`/?display=table&tier=${resource.tier}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/60 text-zinc-400 text-xs border border-zinc-700/50 hover:bg-zinc-700 hover:text-[#FFFAEE] transition-colors"
                >
                  <Layers className="w-2.5 h-2.5" />
                  Tier {resource.tier}
                </Link>
              )}

              {/* Featured - Amber */}
              {resource.featured && (
                <Link
                  to="/?display=table&featured=true"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                >
                  <Star className="w-2.5 h-2.5 fill-current" />
                  Featured
                </Link>
              )}

              {/* Open Source - Emerald */}
              {resource.opensource && (
                <Link
                  to="/?display=table&opensource=true"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                  <Code className="w-2.5 h-2.5" />
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
              transition={{ delay: 0.25 }}
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
              transition={{ delay: 0.3 }}
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

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectResource={(selectedResource) => {
          setIsSearchModalOpen(false);
          navigate(`/resource/${selectedResource.id}`);
        }}
      />
    </div>
  );
}
