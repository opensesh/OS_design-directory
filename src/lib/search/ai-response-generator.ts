/**
 * AI Response Generator for Design Directory Search
 *
 * Generates contextual, helpful messages based on search results
 * and match quality. Makes the search feel intelligent and conversational.
 * 
 * Updated to use directMatchCount for honest result reporting.
 */

import type { SearchMetadata, ScoredResult } from './semantic-search';
import { conceptMappings } from './semantic-mappings';

/**
 * Response with the message and metadata for display
 */
export interface AIResponse {
  message: string;
  matchCount: number;
  highlight?: string;
}

/**
 * Generate a contextual AI response based on search results
 * Uses directMatchCount for honest reporting (excludes low-relevance padding)
 */
export function generateAIResponse(
  results: ScoredResult[],
  metadata: SearchMetadata
): AIResponse {
  const { quality, originalQuery } = metadata;
  // Use directMatchCount for honest reporting
  const matchCount = metadata.directMatchCount ?? results.length;

  // No results at all
  if (matchCount === 0) {
    return {
      message: 'No resources found for "' + originalQuery + '". Try a different search term or browse by category.',
      matchCount: 0,
    };
  }

  // Generate response based on quality and context
  switch (quality) {
    case 'high':
      return generateHighQualityResponse(results, metadata, matchCount);
    case 'medium':
      return generateMediumQualityResponse(results, metadata, matchCount);
    case 'low':
      return generateLowQualityResponse(results, metadata, matchCount);
    case 'fallback':
      return generateFallbackResponse(metadata, matchCount);
    default:
      return {
        message: 'Found ' + matchCount + ' resources for "' + originalQuery + '".',
        matchCount,
      };
  }
}

/**
 * High quality matches - confident, specific responses
 */
function generateHighQualityResponse(
  results: ScoredResult[],
  metadata: SearchMetadata,
  matchCount: number
): AIResponse {
  const { detectedConcepts, originalQuery, matchedPricing } = metadata;
  const topResult = results[0]?.resource;

  // Concept-based responses
  if (detectedConcepts.length > 0) {
    const concept = detectedConcepts[0];
    const conceptInfo = conceptMappings[concept];

    if (conceptInfo) {
      const conceptName = formatConceptName(concept);
      return {
        message: 'Found ' + matchCount + ' ' + conceptName + ' tools. ' + conceptInfo.description + '.',
        matchCount,
        highlight: topResult?.name,
      };
    }
  }

  // Exact name match
  if (topResult && results[0].matchReasons.includes('exact name match')) {
    const desc = topResult.description ? ' – ' + truncate(topResult.description, 80) : '';
    return {
      message: 'Found ' + topResult.name + desc + '.',
      matchCount,
      highlight: topResult.name,
    };
  }

  // Category-specific response
  if (topResult?.category) {
    const categoryResponses: Record<string, string> = {
      'AI': 'Found ' + matchCount + ' AI-powered tools.',
      'Tools': 'Found ' + matchCount + ' design tools.',
      'Inspiration': 'Found ' + matchCount + ' sources of design inspiration.',
      'Learning': 'Found ' + matchCount + ' learning resources.',
      'Templates': 'Found ' + matchCount + ' templates and assets.',
      'Community': 'Found ' + matchCount + ' design communities.',
    };

    if (categoryResponses[topResult.category]) {
      return {
        message: categoryResponses[topResult.category],
        matchCount,
      };
    }
  }

  // Pricing-based response
  if (matchedPricing) {
    const pricingLabel = matchedPricing.toLowerCase();
    return {
      message: 'Found ' + matchCount + ' ' + pricingLabel + ' resources for "' + originalQuery + '".',
      matchCount,
    };
  }

  // Generic high-quality response
  return {
    message: 'Found ' + matchCount + ' resources for "' + originalQuery + '".',
    matchCount,
    highlight: topResult?.name,
  };
}

/**
 * Medium quality matches - helpful but less certain
 */
function generateMediumQualityResponse(
  results: ScoredResult[],
  metadata: SearchMetadata,
  matchCount: number
): AIResponse {
  const { originalQuery } = metadata;
  const topResult = results[0]?.resource;

  // Tag-based match
  if (results[0]?.matchReasons.some((r: string) => r.includes('tag'))) {
    return {
      message: 'Found ' + matchCount + ' resources related to "' + originalQuery + '".',
      matchCount,
    };
  }

  // Description match
  if (results[0]?.matchReasons.includes('description contains query')) {
    return {
      message: 'Found ' + matchCount + ' resources mentioning "' + originalQuery + '".',
      matchCount,
    };
  }

  return {
    message: 'Found ' + matchCount + ' resources related to "' + originalQuery + '".',
    matchCount,
    highlight: topResult?.name,
  };
}

/**
 * Low quality matches - honest about uncertainty
 */
function generateLowQualityResponse(
  results: ScoredResult[],
  metadata: SearchMetadata,
  matchCount: number
): AIResponse {
  const { originalQuery } = metadata;
  const topResult = results[0]?.resource;

  // Fuzzy match acknowledgment
  if (results[0]?.matchReasons.includes('fuzzy name match')) {
    return {
      message: 'Did you mean "' + topResult?.name + '"?',
      matchCount,
      highlight: topResult?.name,
    };
  }

  // Single result
  if (matchCount === 1 && topResult) {
    return {
      message: 'Found ' + topResult.name + ' for "' + originalQuery + '".',
      matchCount: 1,
      highlight: topResult.name,
    };
  }

  return {
    message: 'Found ' + matchCount + ' resources that might match "' + originalQuery + '".',
    matchCount,
  };
}

/**
 * Fallback responses - when no good matches found
 */
function generateFallbackResponse(
  metadata: SearchMetadata,
  matchCount: number
): AIResponse {
  const { originalQuery, matchedCategory } = metadata;

  // Category fallback
  if (matchedCategory && matchCount > 0) {
    return {
      message: 'Showing ' + matchCount + ' ' + matchedCategory + ' resources.',
      matchCount,
    };
  }

  // No results fallback
  if (matchCount === 0) {
    return {
      message: 'No results for "' + originalQuery + '". Try browsing by category.',
      matchCount: 0,
    };
  }

  return {
    message: 'Found ' + matchCount + ' resources.',
    matchCount,
  };
}

/**
 * Generate a response for empty/initial state
 */
export function generateWelcomeResponse(): AIResponse {
  const welcomeMessages = [
    'Ask me about any design tool, like "figma alternatives" or "ai image generators".',
    'Try searching for "vibe code tools" or "stock photos" to get started.',
    'What are you looking for? I can help find design tools, learning resources, and more.',
    'Search for tools, templates, or inspiration. Try "video editing" or "color palettes".',
  ];

  return {
    message: welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)],
    matchCount: 0,
  };
}

/**
 * Generate a response for category browse mode
 */
export function generateCategoryResponse(
  category: string,
  resourceCount: number
): AIResponse {
  const categoryDescriptions: Record<string, string> = {
    'AI': 'AI-powered tools for design, content creation, and automation',
    'Tools': 'Design and development tools to bring your ideas to life',
    'Inspiration': 'Galleries and showcases to spark your creativity',
    'Learning': 'Tutorials, courses, and resources to grow your skills',
    'Templates': 'Ready-to-use templates, assets, and design kits',
    'Community': 'Communities where designers connect and collaborate',
  };

  const description = categoryDescriptions[category] || ('resources in ' + category);

  return {
    message: 'Showing ' + resourceCount + ' ' + description + '.',
    matchCount: resourceCount,
  };
}

/**
 * Generate a response when filters are applied
 */
export function generateFilterResponse(
  filters: {
    category?: string;
    subCategory?: string;
    pricing?: string;
  },
  resourceCount: number
): AIResponse {
  const parts: string[] = [];

  if (filters.pricing) {
    parts.push(filters.pricing.toLowerCase());
  }
  if (filters.subCategory) {
    parts.push(filters.subCategory.toLowerCase());
  }
  if (filters.category) {
    parts.push(filters.category.toLowerCase());
  }

  const filterDescription = parts.length > 0
    ? parts.join(' ')
    : 'all';

  return {
    message: 'Showing ' + resourceCount + ' ' + filterDescription + ' resources.',
    matchCount: resourceCount,
  };
}

// Helper functions

function formatConceptName(concept: string): string {
  return concept
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}
