/**
 * Semantic Mappings for Design Directory Search
 *
 * This file contains the knowledge base for semantic search:
 * - Synonym groups for word variations
 * - Concept mappings for abstract ideas
 * - Category aliases for flexible matching
 * 
 * IMPORTANT: Keep synonym groups tight to avoid false positives.
 * Removed overly broad terms like "visual" from photo synonyms.
 */

/**
 * Synonym Groups - Words that should match each other
 * Key is the canonical term, values are synonyms that expand to include the key
 * 
 * NOTE: Keep these tight! Broad terms like "visual" cause false positives.
 */
export const synonymGroups: Record<string, string[]> = {
  // Visual media - REMOVED "visual" (too broad, matches everything)
  photo: ['photography', 'image', 'picture', 'photos', 'images', 'pictures', 'pic', 'pics', 'photograph'],
  video: ['film', 'movie', 'footage', 'clip', 'videos', 'films', 'movies', 'clips', 'motion', 'cinematic'],
  animation: ['animate', 'animated', 'animations', 'motion graphics', 'lottie'],

  // Design - REMOVED "interface", "visual" (too broad)
  design: ['designer', 'designing', 'designs', 'ui', 'ux'],
  prototype: ['prototyping', 'prototypes', 'mockup', 'mockups', 'wireframe', 'wireframes'],
  icon: ['icons', 'iconography', 'pictogram', 'pictograms', 'glyph', 'glyphs', 'symbol', 'symbols'],
  illustration: ['illustrations', 'illustrator', 'drawing', 'drawings', 'artwork'],

  // Typography
  font: ['fonts', 'typography', 'typeface', 'typefaces', 'lettering', 'typographic'],

  // 3D
  '3d': ['three-dimensional', 'webgl', 'modeling', 'render', 'rendering', 'three.js', 'threejs', 'blender', '3-d'],

  // Code & Development - REMOVED broad terms
  code: ['coding', 'programming', 'development', 'developer', 'dev', 'software'],
  website: ['web', 'site', 'webpage', 'sites', 'websites', 'landing page'],
  component: ['components', 'ui kit', 'ui kits', 'design system'],

  // AI
  ai: ['artificial intelligence', 'machine learning', 'ml', 'gpt', 'llm', 'generative'],

  // Resources - REMOVED "library" (too broad)
  free: ['freeware', 'gratis', 'no cost', 'open source', 'opensource'],
  template: ['templates', 'starter', 'starters', 'boilerplate', 'scaffold', 'kit', 'kits'],
  asset: ['assets', 'resource', 'resources', 'stock'],

  // Learning
  tutorial: ['tutorials', 'course', 'courses', 'lesson', 'lessons', 'guide', 'guides', 'learn', 'learning'],

  // Collaboration
  collaboration: ['collaborate', 'collaborative', 'team', 'teams', 'teamwork', 'share', 'sharing'],

  // Color
  color: ['colors', 'colour', 'colours', 'palette', 'palettes', 'gradient', 'gradients', 'scheme'],

  // Audio
  audio: ['sound', 'sounds', 'music', 'soundtrack', 'sfx', 'sound effects'],
  
  // YouTube/Content creator specific
  youtube: ['youtuber', 'youtubers', 'content creator', 'content creators', 'creator tools'],
  thumbnail: ['thumbnails', 'thumb', 'thumbs'],
};

/**
 * Concept Mappings - Abstract ideas mapped to specific resources and categories
 * 
 * IMPORTANT: resourceNames MUST reference actual resources in resources.json
 * Run validation script to check for mismatches.
 */
export const conceptMappings: Record<string, {
  keywords: string[];
  resourceNames: string[];
  categories: string[];
  description: string;
}> = {
  'vibe code': {
    keywords: ['vibe', 'vibe coding', 'vibe-coding', 'vibecoding', 'ai coding', 'ai code', 'prompt to code'],
    resourceNames: ['Cursor', 'v0', 'Bolt', 'Replit', 'GitHub Copilot', 'Lovable', 'Windsurf'],
    categories: ['AI', 'Tools'],
    description: 'AI-powered coding tools that turn natural language into code',
  },
  'youtube creator': {
    keywords: ['youtube', 'youtuber', 'content creator', 'video creator', 'creator tools', 'thumbnails'],
    // FIXED: Only reference resources that exist in resources.json
    resourceNames: ['Runway', 'VEED.io', 'Canva', 'Y2Mate', 'VidIQ', 'Social Blade'],
    categories: ['AI', 'Tools'], // Include AI since Runway is in AI category
    description: 'Tools for YouTube content creation, editing, and analytics',
  },
  'ai art': {
    keywords: ['ai art', 'ai image', 'ai generate', 'generate image', 'text to image', 'ai illustration'],
    resourceNames: ['Midjourney', 'DALL-E', 'Leonardo AI', 'Stable Diffusion', 'Ideogram', 'Adobe Firefly'],
    categories: ['AI', 'Tools'],
    description: 'AI-powered image generation and creative tools',
  },
  'no code': {
    keywords: ['no code', 'nocode', 'no-code', 'low code', 'lowcode', 'low-code', 'visual builder', 'drag and drop'],
    resourceNames: ['Framer', 'Webflow', 'Wix', 'Squarespace', 'Softr', 'Glide', 'Bubble', 'Carrd'],
    categories: ['Tools'],
    description: 'Visual website and app builders without coding',
  },
  'stock assets': {
    keywords: ['stock', 'free photos', 'free images', 'free videos', 'media library', 'stock footage', 'royalty free'],
    resourceNames: ['Unsplash', 'Pexels', 'Pixabay', 'Freepik', 'Coverr', 'Mixkit'],
    categories: ['Templates', 'Inspiration'],
    description: 'Free and royalty-free stock photos, videos, and assets',
  },
  'design inspiration': {
    keywords: ['inspiration', 'inspo', 'ideas', 'portfolio', 'showcase', 'gallery', 'examples', 'reference'],
    resourceNames: ['Dribbble', 'Behance', 'Awwwards', 'Pinterest', 'Mobbin', 'Land-book', 'One Page Love'],
    categories: ['Inspiration'],
    description: 'Design inspiration galleries and showcases',
  },
  'figma alternative': {
    keywords: ['figma alternative', 'figma alternatives', 'like figma', 'instead of figma', 'replace figma'],
    resourceNames: ['Penpot', 'Sketch', 'Adobe XD', 'Lunacy', 'Framer'],
    categories: ['Tools'],
    description: 'Design tools similar to or alternative to Figma',
  },
  'website builder': {
    keywords: ['website builder', 'site builder', 'web builder', 'build website', 'make website', 'create website'],
    resourceNames: ['Framer', 'Webflow', 'Wix', 'Squarespace', 'Carrd', 'Super', 'Typedream'],
    categories: ['Tools'],
    description: 'Tools for building and hosting websites',
  },
  'color tool': {
    keywords: ['color tool', 'color picker', 'palette generator', 'color palette', 'color scheme', 'colors'],
    resourceNames: ['Coolors', 'Color Hunt', 'Adobe Color', 'Realtime Colors', 'Huemint', 'Khroma'],
    categories: ['Tools'],
    description: 'Color palette generators and color tools',
  },
  'font finder': {
    keywords: ['font finder', 'find font', 'identify font', 'what font', 'font pairing', 'font combination'],
    resourceNames: ['Google Fonts', 'Fontshare', 'Font Squirrel', 'WhatTheFont', 'Typewolf', 'Fontjoy'],
    categories: ['Tools', 'Templates'],
    description: 'Font discovery, pairing, and typography tools',
  },
  'icon library': {
    keywords: ['icon library', 'icon set', 'icons', 'icon pack', 'free icons', 'icon collection'],
    resourceNames: ['Heroicons', 'Feather Icons', 'Phosphor Icons', 'Lucide', 'Iconoir', 'Tabler Icons', 'Font Awesome'],
    categories: ['Templates', 'Tools'],
    description: 'Icon libraries and icon sets for design and development',
  },
  'component library': {
    keywords: ['component library', 'ui library', 'ui kit', 'design system', 'react components', 'ui components'],
    resourceNames: ['shadcn/ui', 'Radix', 'Chakra UI', 'MUI', 'Ant Design', 'Tailwind UI'],
    categories: ['Tools', 'Templates'],
    description: 'UI component libraries and design systems',
  },
  'motion design': {
    keywords: ['motion design', 'motion graphics', 'animation', 'animate', 'after effects', 'lottie'],
    resourceNames: ['LottieFiles', 'Rive', 'Jitter', 'Cavalry', 'Fable', 'Motion'],
    categories: ['Tools'],
    description: 'Motion design and animation tools',
  },
  'remove background': {
    keywords: ['remove background', 'background remover', 'cutout', 'remove bg', 'transparent', 'extract'],
    resourceNames: ['Remove.bg', 'Photoroom', 'Unscreen', 'Clipping Magic'],
    categories: ['Tools', 'AI'],
    description: 'Background removal and image editing tools',
  },
  // NEW: Photography-specific concept
  'photography': {
    keywords: ['photography', 'photo', 'photos', 'photographer', 'stock photos', 'free photos'],
    resourceNames: ['Unsplash', 'Pexels', 'Pixabay', 'Freepik'],
    categories: ['Templates', 'Inspiration'],
    description: 'Stock photography and photo resources',
  },
};

/**
 * Category Aliases - Alternative names for categories
 */
export const categoryAliases: Record<string, string[]> = {
  'AI': ['artificial intelligence', 'machine learning', 'ml', 'generative', 'smart'],
  'Tools': ['apps', 'applications', 'software', 'programs', 'utilities'],
  'Inspiration': ['inspo', 'ideas', 'galleries', 'showcase', 'portfolio', 'examples'],
  'Learning': ['tutorials', 'courses', 'education', 'educational', 'training', 'lessons'],
  'Templates': ['assets', 'resources', 'kits', 'starters', 'boilerplates'],
  'Community': ['communities', 'forums', 'social', 'network', 'networking'],
};

/**
 * Pricing Keywords - For filtering by pricing model
 */
export const pricingKeywords: Record<string, string[]> = {
  'Free': ['free', 'gratis', 'no cost', '$0', 'zero cost'],
  'Freemium': ['freemium', 'free tier', 'free plan', 'basic free', 'free version'],
  'Paid': ['paid', 'premium', 'pro', 'subscription', 'license'],
  'Open Source': ['open source', 'opensource', 'oss', 'libre', 'foss'],
};

/**
 * Get all synonyms for a term (including the term itself)
 */
export function expandSynonyms(term: string): string[] {
  const normalized = term.toLowerCase().trim();
  const expanded = new Set<string>([normalized]);

  // Check if term is a key in synonym groups
  if (synonymGroups[normalized]) {
    synonymGroups[normalized].forEach(syn => expanded.add(syn));
  }

  // Check if term appears in any synonym group's values
  for (const [key, synonyms] of Object.entries(synonymGroups)) {
    if (synonyms.includes(normalized)) {
      expanded.add(key);
      synonyms.forEach(syn => expanded.add(syn));
    }
  }

  return Array.from(expanded);
}

/**
 * Detect concepts in a query string
 */
export function detectConcepts(query: string): string[] {
  const normalized = query.toLowerCase().trim();
  const detectedConcepts: string[] = [];

  for (const [conceptName, concept] of Object.entries(conceptMappings)) {
    // Check if query matches any of the concept keywords
    if (concept.keywords.some(keyword =>
      normalized.includes(keyword) || keyword.includes(normalized)
    )) {
      detectedConcepts.push(conceptName);
    }
  }

  return detectedConcepts;
}

/**
 * Get matching category from aliases
 */
export function resolveCategory(term: string): string | null {
  const normalized = term.toLowerCase().trim();

  // Direct match
  for (const category of Object.keys(categoryAliases)) {
    if (category.toLowerCase() === normalized) {
      return category;
    }
  }

  // Alias match
  for (const [category, aliases] of Object.entries(categoryAliases)) {
    if (aliases.some(alias => alias.toLowerCase() === normalized)) {
      return category;
    }
  }

  return null;
}

/**
 * Get pricing filter from keywords
 */
export function resolvePricing(term: string): string | null {
  const normalized = term.toLowerCase().trim();

  for (const [pricing, keywords] of Object.entries(pricingKeywords)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      return pricing;
    }
  }

  return null;
}
