import { useState, useEffect, useCallback, useMemo } from 'react';
import { resources } from '../data';
import type { NormalizedResource } from '../types/resource';
import { semanticSearch, type SearchMetadata } from '../lib/search';

export interface SearchResult {
  resource: NormalizedResource;
  score: number;
  matchedField: string;
}

export interface GroupedSearchResults {
  [category: string]: SearchResult[];
}

interface UseResourceSearchOptions {
  debounceMs?: number;
  maxResults?: number;
}

interface UseResourceSearchResult {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  groupedResults: GroupedSearchResults;
  defaultResults: SearchResult[];
  isSearching: boolean;
  clearSearch: () => void;
  metadata: SearchMetadata | null;
}

/**
 * Hook for searching resources with semantic search, debouncing, and scoring
 *
 * Uses the semantic search library which provides:
 * - Synonym expansion (photo → photography, image, picture)
 * - Concept mapping (vibe code → Cursor, v0, Bolt)
 * - Fuzzy matching for typos (figam → Figma)
 * - Intelligent fallbacks (always returns useful results)
 */
export function useResourceSearch(options: UseResourceSearchOptions = {}): UseResourceSearchResult {
  const { debounceMs = 100, maxResults = 50 } = options;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchMetadata, setSearchMetadata] = useState<SearchMetadata | null>(null);

  // Debounce the query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Calculate search results using semantic search
  const results = useMemo((): SearchResult[] => {
    if (!debouncedQuery.trim()) {
      setSearchMetadata(null);
      return [];
    }

    // Use semantic search for intelligent matching
    const { results: semanticResults, metadata } = semanticSearch(resources, debouncedQuery, {
      minResults: 3,
      maxResults,
      includeFallback: true,
    });

    setSearchMetadata(metadata);

    // Convert ScoredResult to SearchResult for backwards compatibility
    return semanticResults.map(sr => ({
      resource: sr.resource,
      score: sr.score,
      matchedField: sr.matchReasons[0] || 'semantic',
    }));
  }, [debouncedQuery, maxResults]);

  // Group results by category
  const groupedResults = useMemo((): GroupedSearchResults => {
    const groups: GroupedSearchResults = {};

    for (const result of results) {
      const category = result.resource.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(result);
    }

    return groups;
  }, [results]);

  // Default results for empty query state (top 15 resources by gravity score)
  const defaultResults = useMemo((): SearchResult[] => {
    return [...resources]
      .sort((a, b) => {
        // Sort by: featured first, then by gravity score
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.gravityScore - a.gravityScore;
      })
      .slice(0, 15)
      .map(r => ({ resource: r, score: 0, matchedField: '' }));
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setSearchMetadata(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    groupedResults,
    defaultResults,
    isSearching,
    clearSearch,
    metadata: searchMetadata,
  };
}
