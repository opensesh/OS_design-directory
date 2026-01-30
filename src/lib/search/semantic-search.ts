/**
 * Semantic Search Engine for Design Directory
 *
 * Three-layer search system:
 * 1. Concept & Synonym Expansion
 * 2. Multi-Strategy Matching with weighted scoring
 * 3. Intelligent Fallbacks (restricted to maintain relevance)
 *
 * Enhanced with LLM support:
 * - Hard filters for explicit criteria (pricing, rating, etc.)
 * - LLM-extracted concept matching
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
 * Hard filters from LLM parsing - must match exactly
 */
export interface HardFilters {
  pricing?: string[];
  categories?: string[];
  subCategories?: string[];
  minGravityScore?: number;
  maxGravityScore?: number;
  tags?: string[];
  featured?: boolean;
  opensource?: boolean;
}

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
  directMatchCount: number;
  /** Number of resources after hard filters applied */
  filteredPoolSize?: number;
  /** Filters that were applied */
  appliedFilters?: HardFilters;
  /** LLM concepts used for matching */
  llmConcepts?: string[];
}

/**
 * Complete search response
 */
export interface SearchResponse {
  results: ScoredResult[];
  metadata: SearchMetadata;
}

/**
 * Search options including LLM-enhanced features
 */
export interface SearchOptions {
  minResults?: number;
  maxResults?: number;
  includeFallback?: boolean;
  /** Hard filters that resources MUST match */
  hardFilters?: HardFilters;
  /** LLM-extracted semantic concepts for boosting */
  llmConcepts?: string[];
}

/**
 * Minimum score threshold - results below this are filtered out
 * This prevents irrelevant resources from appearing in results
 */
const MIN_RELEVANCE_THRESHOLD = 25;

/**
 * Scoring weights for different match types
 * Tuned to favor direct matches and reduce false positives
 */
const SCORING_WEIGHTS = {
  NAME_EXACT: 100,        // Keep - exact name is highly relevant
  CONCEPT_BOOST: 80,      // Keep - concept matches are intentional
  NAME_STARTS_WITH: 70,   // Keep
  NAME_CONTAINS: 40,      // Keep
  TAG_EXACT: 50,          // INCREASED from 30 - exact tag is strong signal
  TAG_CONTAINS: 15,       // DECREASED from 25 - partial tags cause false positives
  CATEGORY_MATCH: 20,     // Keep
  SUBCATEGORY_MATCH: 15,  // Keep
  DESCRIPTION_CONTAINS: 3, // DECREASED from 10 - too many false positives from common words
  FUZZY_MAX: 40,          // Keep
  GRAVITY_MULTIPLIER: 1.5, // DECREASED from 2 - reduce gravity influence
  FEATURED_BONUS: 5,      // DECREASED from 10 - featured shouldn't override relevance
  SYNONYM_MATCH: 20,      // DECREASED from 35 - synonym matches are indirect
  PRICING_MATCH: 25,      // Keep
  LLM_CONCEPT_MATCH: 40,  // NEW - LLM-extracted concept matches
};

/**
 * Apply hard filters to resources BEFORE scoring
 * This ensures results MUST match the filter criteria
 */
export function applyHardFilters(
  resources: NormalizedResource[],
  filters: HardFilters | undefined
): NormalizedResource[] {
  if (!filters) return resources;

  return resources.filter(resource => {
    // Pricing filter (OR logic - matches any specified pricing)
    if (filters.pricing && filters.pricing.length > 0) {
      if (!resource.pricing) return false;
      const resourcePricing = resource.pricing.toLowerCase();
      const matchesPricing = filters.pricing.some(
        p => resourcePricing === p.toLowerCase()
      );
      if (!matchesPricing) return false;
    }

    // Category filter (OR logic)
    if (filters.categories && filters.categories.length > 0) {
      if (!resource.category) return false;
      const resourceCategory = resource.category.toLowerCase();
      const matchesCategory = filters.categories.some(
        c => resourceCategory === c.toLowerCase()
      );
      if (!matchesCategory) return false;
    }

    // SubCategory filter (OR logic)
    if (filters.subCategories && filters.subCategories.length > 0) {
      if (!resource.subCategory) return false;
      const resourceSubCategory = resource.subCategory.toLowerCase();
      const matchesSubCategory = filters.subCategories.some(
        sc => resourceSubCategory === sc.toLowerCase()
      );
      if (!matchesSubCategory) return false;
    }

    // Gravity score filters (range)
    if (filters.minGravityScore !== undefined) {
      if (resource.gravityScore < filters.minGravityScore) return false;
    }
    if (filters.maxGravityScore !== undefined) {
      if (resource.gravityScore > filters.maxGravityScore) return false;
    }

    // Tag filter (OR logic - resource must have at least one matching tag)
    if (filters.tags && filters.tags.length > 0) {
      if (!resource.tags || resource.tags.length === 0) return false;
      const resourceTags = resource.tags.map(t => t.toLowerCase());
      const matchesTag = filters.tags.some(
        filterTag => resourceTags.some(rt => rt.includes(filterTag.toLowerCase()))
      );
      if (!matchesTag) return false;
    }

    // Boolean flags
    if (filters.featured !== undefined) {
      if (resource.featured !== filters.featured) return false;
    }
    if (filters.opensource !== undefined) {
      if (resource.opensource !== filters.opensource) return false;
    }

    return true;
  });
}

/**
 * Main semantic search function
 */
export function semanticSearch(
  resources: NormalizedResource[],
  query: string,
  options: SearchOptions = {}
): SearchResponse {
  const {
    minResults = 1,
    maxResults = 50,
    includeFallback = false,
    hardFilters,
    llmConcepts,
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
        directMatchCount: 0,
      },
    };
  }

  // Apply hard filters FIRST (before any scoring)
  const filteredResources = applyHardFilters(resources, hardFilters);
  const filteredPoolSize = filteredResources.length;

  // If hard filters eliminated all resources, return empty with explanation
  if (filteredPoolSize === 0 && hardFilters) {
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
        directMatchCount: 0,
        filteredPoolSize: 0,
        appliedFilters: hardFilters,
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

  // Detect category and pricing filters (for boosting, not hard filtering)
  const matchedCategory = resolveCategory(normalizedQuery);
  const matchedPricing = resolvePricing(normalizedQuery);

  // Collect concept-boosted resource names (from static mappings)
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

  for (const resource of filteredResources) {
    const result = scoreResource(
      resource,
      normalizedQuery,
      queryTokens,
      Array.from(expandedTerms),
      conceptBoostedNames,
      matchedCategory,
      matchedPricing,
      llmConcepts // Pass LLM concepts for additional scoring
    );

    // Only include results above the relevance threshold
    if (result.score >= MIN_RELEVANCE_THRESHOLD) {
      scoredResults.push(result);
    }
  }

  // Sort by score (descending)
  scoredResults.sort((a, b) => b.score - a.score);

  // Track direct match count before any fallbacks
  const directMatchCount = scoredResults.length;

  // Layer 3: Intelligent Fallbacks (only for very short/generic queries)
  let finalResults = scoredResults.slice(0, maxResults);
  let quality: MatchQuality = determineQuality(scoredResults);

  // Only use fallback for very generic queries (2-3 chars) with no results
  const isGenericQuery = normalizedQuery.length <= 3 && detectedConcepts.length === 0;
  
  if (includeFallback && isGenericQuery && finalResults.length < minResults) {
    const fallbackResults = generateFallbacks(
      filteredResources, // Use filtered pool for fallbacks too
      detectedConcepts,
      matchedCategory,
      new Set(finalResults.map(r => r.resource.id)),
      minResults - finalResults.length,
      normalizedQuery
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
      directMatchCount,
      filteredPoolSize,
      appliedFilters: hardFilters,
      llmConcepts,
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
  matchedPricing: string | null,
  llmConcepts?: string[]
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

  // 4b. LLM-extracted concept matching (NEW)
  if (llmConcepts && llmConcepts.length > 0) {
    const descriptionLower = (resource.description || '').toLowerCase();
    const tagsLower = (resource.tags || []).map(t => t.toLowerCase());
    
    for (const concept of llmConcepts) {
      const conceptLower = concept.toLowerCase();
      
      // Check if concept appears in description or tags
      if (descriptionLower.includes(conceptLower)) {
        score += SCORING_WEIGHTS.LLM_CONCEPT_MATCH;
        matchReasons.push(`llm concept: ${concept}`);
        break; // Only count once per resource
      }
      
      // Check tags for concept match
      if (tagsLower.some(tag => tag.includes(conceptLower) || conceptLower.includes(tag))) {
        score += SCORING_WEIGHTS.LLM_CONCEPT_MATCH;
        matchReasons.push(`llm concept tag: ${concept}`);
        break;
      }
    }
  }

  // 5. Tag matching - more restrictive, only count strong matches
  if (resource.tags?.length) {
    let tagMatchFound = false;
    
    for (const tag of resource.tags) {
      const tagLower = tag.toLowerCase();

      // Check exact tag match with query terms (strong signal)
      for (const token of queryTokens) {
        if (tagLower === token) {
          score += SCORING_WEIGHTS.TAG_EXACT;
          matchReasons.push(`exact tag: ${tag}`);
          tagMatchFound = true;
          break;
        }
      }

      // Only check partial matches if no exact match found
      if (!tagMatchFound) {
        for (const token of queryTokens) {
          // Require minimum 4 chars for partial matching to reduce noise
          if (token.length >= 4 && (tagLower.includes(token) || token.includes(tagLower))) {
            score += SCORING_WEIGHTS.TAG_CONTAINS;
            matchReasons.push(`partial tag: ${tag}`);
            break;
          }
        }
      }
    }

    // Synonym tag matching - only exact matches, not partial
    if (!tagMatchFound) {
      for (const tag of resource.tags) {
        const tagLower = tag.toLowerCase();
        for (const term of expandedTerms) {
          if (tagLower === term) {
            score += SCORING_WEIGHTS.SYNONYM_MATCH;
            matchReasons.push(`synonym tag: ${tag}`);
            break;
          }
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

  // 8. Description matching - only for direct query match, not expanded terms
  // This reduces false positives from common words in descriptions
  if (resource.description) {
    const descriptionLower = resource.description.toLowerCase();

    // Direct query match in description (weak signal)
    if (descriptionLower.includes(query) && query.length >= 4) {
      score += SCORING_WEIGHTS.DESCRIPTION_CONTAINS;
      matchReasons.push('description contains query');
    }
  }

  // 9. Pricing matching (soft boost - hard filter is applied earlier)
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

  // Apply multipliers for important resources (only if already matched)
  if (score > 0) {
    // Gravity score bonus - reduced influence
    score *= 1 + (resource.gravityScore / 10) * (SCORING_WEIGHTS.GRAVITY_MULTIPLIER - 1);

    // Featured bonus - small bump
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
 * Now much more restrictive - only for generic queries
 */
function generateFallbacks(
  resources: NormalizedResource[],
  detectedConcepts: string[],
  matchedCategory: string | null,
  excludeIds: Set<number>,
  count: number,
  query: string
): ScoredResult[] {
  const fallbacks: ScoredResult[] = [];
  
  // For specific queries (concept detected or longer query), skip fallbacks entirely
  const isSpecificQuery = detectedConcepts.length > 0 || query.length > 3;
  if (isSpecificQuery) {
    return []; // No fallbacks for specific queries
  }

  // Strategy 1: Get resources from matched category only
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
        if (fallbacks.length >= count) break;
      }
    }
  }

  // Strategy 2: REMOVED - No more "popular fallback" for generic searches
  // This was the main source of irrelevant results

  // Sort fallbacks by score and limit to max 3
  fallbacks.sort((a, b) => b.score - a.score);
  return fallbacks.slice(0, Math.min(count, 3));
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
