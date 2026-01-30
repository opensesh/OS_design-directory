/**
 * useLLMSearch Hook
 *
 * React hook that orchestrates hybrid search:
 * - Simple queries use fast local semantic search
 * - Complex queries use LLM parsing for intent extraction and hard filtering
 */

import { useState, useCallback, useRef } from 'react';
import { resources } from '../data';

import {
  semanticSearch,
  generateAIResponse,
  type ScoredResult,
  type SearchMetadata,
  type HardFilters,
} from '../lib/search';
import {
  classifyQueryComplexity,
  type QueryClassification,
} from '../lib/search/query-classifier';
import {
  parseQueryWithLLM,
  createFallbackParse,
  type ParsedQuery,
} from '../lib/search/llm-query-parser';

/**
 * Search result structure
 */
export interface LLMSearchResult {
  results: ScoredResult[];
  metadata: SearchMetadata;
  aiResponse: { message: string; matchCount: number };
  parsedQuery: ParsedQuery | null;
  classification: QueryClassification | null;
  isLLMEnhanced: boolean;
}

/**
 * Hook return type
 */
export interface UseLLMSearchReturn {
  search: (query: string) => Promise<LLMSearchResult>;
  isLoading: boolean;
  error: string | null;
  lastResult: LLMSearchResult | null;
}

/**
 * Configuration options
 */
interface UseLLMSearchOptions {
  /** Timeout for LLM calls in ms (default: 5000) */
  llmTimeout?: number;
  /** Whether to use LLM for complex queries (default: true) */
  enableLLM?: boolean;
  /** Minimum results before using fallbacks */
  minResults?: number;
  /** Maximum results to return */
  maxResults?: number;
}

/**
 * Custom hook for LLM-enhanced semantic search
 */
export function useLLMSearch(options: UseLLMSearchOptions = {}): UseLLMSearchReturn {
  const {
    llmTimeout = 5000,
    enableLLM = true,
    minResults = 1,
    maxResults = 50,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<LLMSearchResult | null>(null);

  // Abort controller for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Main search function
   */
  const search = useCallback(
    async (query: string): Promise<LLMSearchResult> => {
      // Cancel any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      const normalizedQuery = query.trim();

      // Handle empty query
      if (!normalizedQuery) {
        const emptyResult: LLMSearchResult = {
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
          aiResponse: { message: '', matchCount: 0 },
          parsedQuery: null,
          classification: null,
          isLLMEnhanced: false,
        };
        setLastResult(emptyResult);
        setIsLoading(false);
        return emptyResult;
      }

      try {
        // Step 1: Classify query complexity
        const classification = classifyQueryComplexity(normalizedQuery);
        let parsedQuery: ParsedQuery | null = null;
        let hardFilters: HardFilters | undefined;
        let llmConcepts: string[] | undefined;
        let isLLMEnhanced = false;

        // Step 2: For complex queries, use LLM parsing
        if (enableLLM && classification.isComplex) {
          try {
            // Race between LLM call and timeout
            parsedQuery = await Promise.race([
              parseQueryWithLLM(normalizedQuery),
              new Promise<ParsedQuery>((_, reject) =>
                setTimeout(() => reject(new Error('LLM timeout')), llmTimeout)
              ),
            ]);
            isLLMEnhanced = true;

            // Extract hard filters from parsed query
            if (parsedQuery.filters) {
              hardFilters = {
                pricing: parsedQuery.filters.pricing,
                categories: parsedQuery.filters.categories,
                subCategories: parsedQuery.filters.subCategories,
                minGravityScore: parsedQuery.filters.minGravityScore,
                maxGravityScore: parsedQuery.filters.maxGravityScore,
                tags: parsedQuery.filters.tags,
                featured: parsedQuery.filters.featured,
                opensource: parsedQuery.filters.opensource,
              };

              // Clean up empty arrays
              if (hardFilters.pricing?.length === 0) delete hardFilters.pricing;
              if (hardFilters.categories?.length === 0) delete hardFilters.categories;
              if (hardFilters.subCategories?.length === 0) delete hardFilters.subCategories;
              if (hardFilters.tags?.length === 0) delete hardFilters.tags;
            }

            // Extract LLM concepts for soft matching
            if (parsedQuery.concepts && parsedQuery.concepts.length > 0) {
              llmConcepts = parsedQuery.concepts;
            }
          } catch (llmError) {
            // LLM failed - use fallback parsing
            console.warn('LLM search failed, using local fallback:', llmError);
            parsedQuery = createFallbackParse(normalizedQuery);
            
            // Still apply any filters we could extract locally
            if (parsedQuery.filters) {
              hardFilters = parsedQuery.filters as HardFilters;
            }
          }
        }

        // Step 3: Execute semantic search with filters
        const { results, metadata } = semanticSearch(resources, normalizedQuery, {
          minResults,
          maxResults,
          includeFallback: true,
          hardFilters,
          llmConcepts,
        });

        // Step 4: Generate AI response
        const aiResponse = generateAIResponse(results, metadata);

        // Build result
        const searchResult: LLMSearchResult = {
          results,
          metadata,
          aiResponse,
          parsedQuery,
          classification,
          isLLMEnhanced,
        };

        setLastResult(searchResult);
        setIsLoading(false);
        return searchResult;
      } catch (err) {
        // Handle unexpected errors with graceful fallback
        console.error('Search error:', err);
        setError('Search encountered an error. Showing basic results.');

        // Fallback to basic local search
        const { results, metadata } = semanticSearch(resources, normalizedQuery, {
          minResults,
          maxResults,
          includeFallback: true,
        });

        const aiResponse = generateAIResponse(results, metadata);

        const fallbackResult: LLMSearchResult = {
          results,
          metadata,
          aiResponse,
          parsedQuery: null,
          classification: null,
          isLLMEnhanced: false,
        };

        setLastResult(fallbackResult);
        setIsLoading(false);
        return fallbackResult;
      }
    },
    [enableLLM, llmTimeout, minResults, maxResults]
  );

  return {
    search,
    isLoading,
    error,
    lastResult,
  };
}

/**
 * Utility function for one-off searches without hook state
 */
export async function performLLMSearch(
  query: string,
  options: { enableLLM?: boolean; timeout?: number } = {}
): Promise<LLMSearchResult> {
  const { enableLLM = true, timeout = 5000 } = options;
  const normalizedQuery = query.trim();

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
      aiResponse: { message: '', matchCount: 0 },
      parsedQuery: null,
      classification: null,
      isLLMEnhanced: false,
    };
  }

  const classification = classifyQueryComplexity(normalizedQuery);
  let parsedQuery: ParsedQuery | null = null;
  let hardFilters: HardFilters | undefined;
  let llmConcepts: string[] | undefined;
  let isLLMEnhanced = false;

  if (enableLLM && classification.isComplex) {
    try {
      parsedQuery = await Promise.race([
        parseQueryWithLLM(normalizedQuery),
        new Promise<ParsedQuery>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), timeout)
        ),
      ]);
      isLLMEnhanced = true;

      if (parsedQuery.filters) {
        hardFilters = parsedQuery.filters as HardFilters;
      }
      if (parsedQuery.concepts?.length) {
        llmConcepts = parsedQuery.concepts;
      }
    } catch {
      parsedQuery = createFallbackParse(normalizedQuery);
      if (parsedQuery.filters) {
        hardFilters = parsedQuery.filters as HardFilters;
      }
    }
  }

  const { results, metadata } = semanticSearch(resources, normalizedQuery, {
    minResults: 1,
    maxResults: 50,
    includeFallback: true,
    hardFilters,
    llmConcepts,
  });

  const aiResponse = generateAIResponse(results, metadata);

  return {
    results,
    metadata,
    aiResponse,
    parsedQuery,
    classification,
    isLLMEnhanced,
  };
}
