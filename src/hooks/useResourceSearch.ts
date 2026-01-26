import { useState, useEffect, useCallback, useMemo } from 'react';
import { resources } from '../data';
import type { NormalizedResource } from '../types/resource';

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
}

/**
 * Calculate a relevance score for a resource based on the search query
 * Higher scores = more relevant
 *
 * Scoring weights:
 * - Name exact match: 100
 * - Name starts with: 80
 * - Name contains: 60
 * - Description contains: 40
 * - Category match: 30
 * - Subcategory match: 25
 * - Tag match: 20
 */
function scoreResource(resource: NormalizedResource, query: string): SearchResult | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  let score = 0;
  let matchedField = '';

  // Name matching (highest weight)
  const name = resource.name.toLowerCase();
  if (name === q) {
    score += 100;
    matchedField = 'name';
  } else if (name.startsWith(q)) {
    score += 80;
    matchedField = 'name';
  } else if (name.includes(q)) {
    score += 60;
    matchedField = 'name';
  }

  // Description matching
  const description = resource.description?.toLowerCase() || '';
  if (description.includes(q)) {
    score += 40;
    if (!matchedField) matchedField = 'description';
  }

  // Category matching
  const category = resource.category?.toLowerCase() || '';
  if (category.includes(q)) {
    score += 30;
    if (!matchedField) matchedField = 'category';
  }

  // Subcategory matching
  const subCategory = resource.subCategory?.toLowerCase() || '';
  if (subCategory.includes(q)) {
    score += 25;
    if (!matchedField) matchedField = 'subCategory';
  }

  // Tag matching
  const tags = resource.tags || [];
  for (const tag of tags) {
    if (tag.toLowerCase().includes(q)) {
      score += 20;
      if (!matchedField) matchedField = 'tags';
      break; // Only count once
    }
  }

  // Multi-word query bonus: check if all words match somewhere
  const queryWords = q.split(/\s+/).filter(w => w.length > 1);
  if (queryWords.length > 1) {
    const searchText = `${name} ${description} ${category} ${subCategory} ${tags.join(' ')}`.toLowerCase();
    const allMatch = queryWords.every(word => searchText.includes(word));
    if (allMatch) {
      score += 15;
    }
  }

  if (score === 0) return null;

  return {
    resource,
    score,
    matchedField,
  };
}

/**
 * Hook for searching resources with debouncing and scoring
 */
export function useResourceSearch(options: UseResourceSearchOptions = {}): UseResourceSearchResult {
  const { debounceMs = 100, maxResults = 50 } = options;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debounce the query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Calculate search results
  const results = useMemo((): SearchResult[] => {
    if (!debouncedQuery.trim()) return [];

    const scored: SearchResult[] = [];

    for (const resource of resources) {
      const result = scoreResource(resource, debouncedQuery);
      if (result) {
        scored.push(result);
      }
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, maxResults);
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

  // Default results for empty query state (top 15 resources grouped by category)
  const defaultResults = useMemo((): SearchResult[] => {
    return resources
      .slice(0, 15)
      .map(r => ({ resource: r, score: 0, matchedField: '' }));
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  return {
    query,
    setQuery,
    results,
    groupedResults,
    defaultResults,
    isSearching,
    clearSearch,
  };
}
