/**
 * Semantic Search Engine for Design Directory
 *
 * Three-layer search system:
 * 1. Concept & Synonym Expansion
 * 2. Multi-Strategy Matching with weighted scoring
 * 3. Intelligent Fallbacks (never empty results)
 */

import type { NormalizedResource } from '../../types/resource';
import {
  expandSynonyms,
  detectConcepts,
  resolveCategory,
  resolvePricing,
  conceptMappings,
} from './semantic-mappings';
import {
  getFuzzyScore,
  getMultiTermFuzzyScore,
  tokenize,
} from './fuzzy-match';

/**
 * Search result with scoring metadata
 */
export interface ScoredResult {
  resource: NormalizedResource;
  score: number;
  matchReasons: string[];
}

/**
 * Search quality level for response generation
 */
export type MatchQuality = 'high' | 'medium' | 'low' | 'fallback';

/**
 * Metadata about the search results
 */
export interface SearchMetadata {
  quality: MatchQuality;
  totalResults: number;
  detectedConcepts: string[];
  expandedTerms: string[];
  matchedCategory: string | null;
  matchedPricing: string | null;
  originalQuery: string;
}

/**
 * Complete search response
 */
export interface SearchResponse {
  results: ScoredResult[];
  metadata: SearchMetadata;
}

/**
 * Scoring weights for different match types
 */
const SCORING_WEIGHTS = {
  NAME_EXACT: 100,
  CONCEPT_BOOST: 80,
  NAME_STARTS_WITH: 70,
  NAME_CONTAINS: 40,
  TAG_EXACT: 30,
  TAG_CONTAINS: 25,
  CATEGORY_MATCH: 20,
  SUBCATEGORY_MATCH: 15,
  DESCRIPTION_CONTAINS: 10,
  FUZZY_MAX: 40,
  GRAVITY_MULTIPLIER: 2,
  FEATURED_BONUS: 10,
  SYNONYM_MATCH: 35,
  PRICING_MATCH: 25,
};

/**
 * Main semantic search function
 */
export function semanticSearch(
  resources: NormalizedResource[],
  query: string,
  options: {
    minResults?: number;
    maxResults?: number;
    includeFallback?: boolean;
  } = {}
): SearchResponse {
  const {
    minResults = 3,
    maxResults = 50,
    includeFallback = true,
  } = options;

  const normalizedQuery = query.toLowerCase().trim();

  // Handle empty query
  if (!normalizedQuery) {
    return {
      results: [],
      metadata: {
        quality: 'fallback',
        totalResults: 0,
        detectedConcepts: [],
        expandedTerms: [],
        matchedCategory: null,
        matchedPricing: null,
        originalQuery: query,
      },
    };
  }

  // Layer 1: Concept & Synonym Expansion
  const detectedConcepts = detectConcepts(normalizedQuery);
  const queryTokens = tokenize(normalizedQuery);
  const expandedTerms = new Set<string>();

  // Expand each query token with synonyms
  for (const token of queryTokens) {
    expandSynonyms(token).forEach(term => expandedTerms.add(term));
  }

  // Detect category and pricing filters
  const matchedCategory = resolveCategory(normalizedQuery);
  const matchedPricing = resolvePricing(normalizedQuery);

  // Collect concept-boosted resource names
  const conceptBoostedNames = new Set<string>();
  for (const concept of detectedConcepts) {
    const mapping = conceptMappings[concept];
    if (mapping) {
      mapping.resourceNames.forEach(name =>
        conceptBoostedNames.add(name.toLowerCase())
      );
    }
  }

  // Layer 2: Multi-Strategy Matching
  const scoredResults: ScoredResult[] = [];

  for (const resource of resources) {
    const result = scoreResource(
      resource,
      normalizedQuery,
      queryTokens,
      Array.from(expandedTerms),
      conceptBoostedNames,
      matchedCategory,
      matchedPricing
    );

    if (result.score > 0) {
      scoredResults.push(result);
    }
  }

  // Sort by score (descending)
  scoredResults.sort((a, b) => b.score - a.score);

  // Layer 3: Intelligent Fallbacks
  let finalResults = scoredResults.slice(0, maxResults);
  let quality: MatchQuality = determineQuality(scoredResults);

  if (includeFallback && finalResults.length < minResults) {
    const fallbackResults = generateFallbacks(
      resources,
      detectedConcepts,
      matchedCategory,
      new Set(finalResults.map(r => r.resource.id)),
      minResults - finalResults.length
    );
    finalResults = [...finalResults, ...fallbackResults];
    quality = finalResults.length > 0 ? 'fallback' : 'low';
  }

  return {
    results: finalResults,
    metadata: {
      quality,
      totalResults: finalResults.length,
      detectedConcepts,
      expandedTerms: Array.from(expandedTerms),
      matchedCategory,
      matchedPricing,
      originalQuery: query,
    },
  };
}

/**
 * Score a single resource against the search criteria
 */
function scoreResource(
  resource: NormalizedResource,
  query: string,
  queryTokens: string[],
  expandedTerms: string[],
  conceptBoostedNames: Set<string>,
  matchedCategory: string | null,
  matchedPricing: string | null
): ScoredResult {
  let score = 0;
  const matchReasons: string[] = [];
  const nameLower = resource.name.toLowerCase();

  // 1. Exact name match
  if (nameLower === query) {
    score += SCORING_WEIGHTS.NAME_EXACT;
    matchReasons.push('exact name match');
  }
  // 2. Name starts with query
  else if (nameLower.startsWith(query)) {
    score += SCORING_WEIGHTS.NAME_STARTS_WITH;
    matchReasons.push('name starts with query');
  }
  // 3. Name contains query
  else if (nameLower.includes(query)) {
    score += SCORING_WEIGHTS.NAME_CONTAINS;
    matchReasons.push('name contains query');
  }

  // 4. Concept boost (e.g., "vibe code" → Cursor gets boost)
  if (conceptBoostedNames.has(nameLower)) {
    score += SCORING_WEIGHTS.CONCEPT_BOOST;
    matchReasons.push('concept match');
  }

  // 5. Tag matching
  if (resource.tags?.length) {
    for (const tag of resource.tags) {
      const tagLower = tag.toLowerCase();

      // Check exact tag match with query terms
      for (const token of queryTokens) {
        if (tagLower === token) {
          score += SCORING_WEIGHTS.TAG_EXACT;
          matchReasons.push(`exact tag: ${tag}`);
          break;
        } else if (tagLower.includes(token) || token.includes(tagLower)) {
          score += SCORING_WEIGHTS.TAG_CONTAINS;
          matchReasons.push(`partial tag: ${tag}`);
        }
      }

      // Check synonym-expanded terms
      for (const term of expandedTerms) {
        if (tagLower === term || tagLower.includes(term)) {
          score += SCORING_WEIGHTS.SYNONYM_MATCH;
          matchReasons.push(`synonym tag: ${tag}`);
          break;
        }
      }
    }
  }

  // 6. Category matching
  if (resource.category) {
    const categoryLower = resource.category.toLowerCase();

    if (matchedCategory && categoryLower === matchedCategory.toLowerCase()) {
      score += SCORING_WEIGHTS.CATEGORY_MATCH;
      matchReasons.push(`category: ${resource.category}`);
    }

    // Check if query contains category name
    if (query.includes(categoryLower) || categoryLower.includes(query)) {
      score += SCORING_WEIGHTS.CATEGORY_MATCH / 2;
      matchReasons.push(`category partial: ${resource.category}`);
    }
  }

  // 7. Subcategory matching
  if (resource.subCategory) {
    const subCategoryLower = resource.subCategory.toLowerCase();
    if (
      query.includes(subCategoryLower) ||
      subCategoryLower.includes(query)
    ) {
      score += SCORING_WEIGHTS.SUBCATEGORY_MATCH;
      matchReasons.push(`subcategory: ${resource.subCategory}`);
    }
  }

  // 8. Description matching (with expanded terms)
  if (resource.description) {
    const descriptionLower = resource.description.toLowerCase();

    // Check expanded terms in description
    for (const term of expandedTerms) {
      if (descriptionLower.includes(term)) {
        score += SCORING_WEIGHTS.DESCRIPTION_CONTAINS;
        matchReasons.push(`description contains: ${term}`);
        break; // Only count once per resource
      }
    }

    // Direct query match in description
    if (descriptionLower.includes(query)) {
      score += SCORING_WEIGHTS.DESCRIPTION_CONTAINS;
      matchReasons.push('description contains query');
    }
  }

  // 9. Pricing matching
  if (matchedPricing && resource.pricing) {
    const pricingLower = resource.pricing.toLowerCase();
    if (
      pricingLower === matchedPricing.toLowerCase() ||
      pricingLower.includes(matchedPricing.toLowerCase())
    ) {
      score += SCORING_WEIGHTS.PRICING_MATCH;
      matchReasons.push(`pricing: ${resource.pricing}`);
    }
  }

  // 10. Fuzzy matching for typos (only if no other matches)
  if (score === 0) {
    const fuzzyScore = getFuzzyScore(query, nameLower, 0.6);
    if (fuzzyScore > 0) {
      score += fuzzyScore * SCORING_WEIGHTS.FUZZY_MAX;
      matchReasons.push('fuzzy name match');
    }

    // Multi-term fuzzy for longer queries
    if (queryTokens.length > 1 && resource.description) {
      const multiTermScore = getMultiTermFuzzyScore(
        query,
        `${resource.name} ${resource.description}`,
        0.6
      );
      if (multiTermScore > 0) {
        score += multiTermScore * (SCORING_WEIGHTS.FUZZY_MAX / 2);
        matchReasons.push('fuzzy content match');
      }
    }
  }

  // Apply multipliers for important resources
  if (score > 0) {
    // Gravity score bonus (higher gravity = more relevant)
    score *= 1 + (resource.gravityScore / 10) * (SCORING_WEIGHTS.GRAVITY_MULTIPLIER - 1);

    // Featured bonus
    if (resource.featured) {
      score += SCORING_WEIGHTS.FEATURED_BONUS;
      matchReasons.push('featured');
    }
  }

  return {
    resource,
    score,
    matchReasons,
  };
}

/**
 * Determine the quality of search results
 */
function determineQuality(results: ScoredResult[]): MatchQuality {
  if (results.length === 0) return 'low';

  const topScore = results[0]?.score || 0;

  if (topScore >= 80 && results.length >= 3) return 'high';
  if (topScore >= 40 && results.length >= 2) return 'medium';
  if (results.length >= 1) return 'low';

  return 'fallback';
}

/**
 * Generate fallback results when primary search yields too few results
 */
function generateFallbacks(
  resources: NormalizedResource[],
  detectedConcepts: string[],
  matchedCategory: string | null,
  excludeIds: Set<number>,
  count: number
): ScoredResult[] {
  const fallbacks: ScoredResult[] = [];

  // Strategy 1: Get resources from detected concept categories
  if (detectedConcepts.length > 0) {
    const conceptCategories = new Set<string>();
    for (const concept of detectedConcepts) {
      const mapping = conceptMappings[concept];
      if (mapping) {
        mapping.categories.forEach(cat => conceptCategories.add(cat));
      }
    }

    for (const resource of resources) {
      if (excludeIds.has(resource.id)) continue;
      if (resource.category && conceptCategories.has(resource.category)) {
        fallbacks.push({
          resource,
          score: resource.gravityScore * 5, // Use gravity as proxy for quality
          matchReasons: ['related category fallback'],
        });
      }
    }
  }

  // Strategy 2: Get resources from matched category
  if (matchedCategory && fallbacks.length < count) {
    for (const resource of resources) {
      if (excludeIds.has(resource.id)) continue;
      if (
        resource.category?.toLowerCase() === matchedCategory.toLowerCase()
      ) {
        fallbacks.push({
          resource,
          score: resource.gravityScore * 4,
          matchReasons: ['category fallback'],
        });
      }
    }
  }

  // Strategy 3: Popular/featured resources
  if (fallbacks.length < count) {
    const popular = resources
      .filter(r => !excludeIds.has(r.id) && !fallbacks.some(f => f.resource.id === r.id))
      .sort((a, b) => {
        // Sort by: featured first, then by gravity score
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.gravityScore - a.gravityScore;
      })
      .slice(0, count - fallbacks.length);

    for (const resource of popular) {
      fallbacks.push({
        resource,
        score: resource.gravityScore * 3,
        matchReasons: ['popular fallback'],
      });
    }
  }

  // Sort fallbacks by score and limit
  fallbacks.sort((a, b) => b.score - a.score);
  return fallbacks.slice(0, count);
}

/**
 * Quick search for autocomplete/suggestions (lighter weight)
 */
export function quickSearch(
  resources: NormalizedResource[],
  query: string,
  maxResults = 5
): NormalizedResource[] {
  const response = semanticSearch(resources, query, {
    maxResults,
    includeFallback: false,
  });
  return response.results.map(r => r.resource);
}

/**
 * Get search suggestions based on partial query
 */
export function getSuggestions(
  resources: NormalizedResource[],
  query: string,
  maxSuggestions = 5
): string[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery || normalizedQuery.length < 2) return [];

  const suggestions = new Set<string>();

  // Add matching resource names
  for (const resource of resources) {
    if (resource.name.toLowerCase().includes(normalizedQuery)) {
      suggestions.add(resource.name);
    }
    if (suggestions.size >= maxSuggestions) break;
  }

  // Add matching tags
  if (suggestions.size < maxSuggestions) {
    for (const resource of resources) {
      if (resource.tags) {
        for (const tag of resource.tags) {
          if (tag.toLowerCase().includes(normalizedQuery)) {
            suggestions.add(tag);
          }
          if (suggestions.size >= maxSuggestions) break;
        }
      }
      if (suggestions.size >= maxSuggestions) break;
    }
  }

  // Add matching categories
  if (suggestions.size < maxSuggestions) {
    for (const resource of resources) {
      if (
        resource.category?.toLowerCase().includes(normalizedQuery)
      ) {
        suggestions.add(resource.category);
      }
      if (suggestions.size >= maxSuggestions) break;
    }
  }

  return Array.from(suggestions).slice(0, maxSuggestions);
}
