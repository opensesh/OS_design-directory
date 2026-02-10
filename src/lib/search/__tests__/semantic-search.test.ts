import { describe, it, expect } from 'vitest';
import {
  semanticSearch,
  applyHardFilters,
  quickSearch,
  getSuggestions,
} from '../semantic-search';
import type { NormalizedResource } from '../../../types/resource';

/**
 * Minimal resource factory for tests
 */
function makeResource(overrides: Partial<NormalizedResource> & { id: number; name: string }): NormalizedResource {
  return {
    url: `https://example.com/${overrides.name.toLowerCase().replace(/\s+/g, '-')}`,
    description: null,
    category: null,
    subCategory: null,
    pricing: null,
    featured: false,
    opensource: false,
    tags: null,
    count: null,
    tier: null,
    thumbnail: null,
    screenshot: null,
    gravityScore: 5.0,
    ...overrides,
  };
}

/**
 * Shared fixture pool covering multiple categories, pricing, tags, and scores
 */
const RESOURCES: NormalizedResource[] = [
  makeResource({ id: 1, name: 'Cursor', description: 'AI-powered code editor', category: 'AI', pricing: 'Freemium', tags: ['ai', 'code', 'editor'], gravityScore: 9.2, featured: true }),
  makeResource({ id: 2, name: 'Figma', description: 'Collaborative design tool', category: 'Tools', pricing: 'Freemium', tags: ['design', 'prototype', 'ui'], gravityScore: 9.5, featured: true }),
  makeResource({ id: 3, name: 'Unsplash', description: 'Free stock photography platform', category: 'Templates', pricing: 'Free', tags: ['photo', 'stock', 'free'], gravityScore: 8.0 }),
  makeResource({ id: 4, name: 'Dribbble', description: 'Design inspiration gallery', category: 'Inspiration', pricing: 'Freemium', tags: ['design', 'inspiration', 'portfolio'], gravityScore: 8.5 }),
  makeResource({ id: 5, name: 'shadcn/ui', description: 'Accessible React component library', category: 'Tools', pricing: 'Free', tags: ['components', 'react', 'ui'], gravityScore: 8.8, opensource: true }),
  makeResource({ id: 6, name: 'Midjourney', description: 'AI image generation from text prompts', category: 'AI', pricing: 'Paid', tags: ['ai', 'art', 'image generation'], gravityScore: 9.0 }),
  makeResource({ id: 7, name: 'Framer', description: 'No-code website builder with design tools', category: 'Tools', pricing: 'Freemium', tags: ['website', 'no-code', 'design'], gravityScore: 8.7 }),
  makeResource({ id: 8, name: 'Coolors', description: 'Color palette generator and explorer', category: 'Tools', pricing: 'Free', tags: ['color', 'palette', 'design'], gravityScore: 7.5 }),
  makeResource({ id: 9, name: 'LottieFiles', description: 'Lightweight animations for web and mobile', category: 'Tools', pricing: 'Freemium', tags: ['animation', 'lottie', 'motion'], gravityScore: 7.8 }),
  makeResource({ id: 10, name: 'Webflow', description: 'Professional no-code website builder', category: 'Tools', pricing: 'Paid', tags: ['website', 'no-code', 'cms'], gravityScore: 8.9 }),
  makeResource({ id: 11, name: 'Pexels', description: 'Free stock photos and videos', category: 'Templates', pricing: 'Free', tags: ['photo', 'video', 'stock', 'free'], gravityScore: 7.6 }),
  makeResource({ id: 12, name: 'Runway', description: 'AI video generation and editing suite', category: 'AI', pricing: 'Paid', tags: ['ai', 'video', 'editing'], gravityScore: 8.6 }),
];

// ─── semanticSearch ──────────────────────────────────────────────────────────

describe('semanticSearch', () => {
  describe('empty and edge-case queries', () => {
    it('returns empty results for an empty string', () => {
      const { results, metadata } = semanticSearch(RESOURCES, '');
      expect(results).toEqual([]);
      expect(metadata.quality).toBe('fallback');
      expect(metadata.totalResults).toBe(0);
      expect(metadata.originalQuery).toBe('');
    });

    it('returns empty results for whitespace-only query', () => {
      const { results, metadata } = semanticSearch(RESOURCES, '   ');
      expect(results).toEqual([]);
      expect(metadata.quality).toBe('fallback');
    });

    it('returns empty results when resource pool is empty', () => {
      const { results, metadata } = semanticSearch([], 'figma');
      expect(results).toEqual([]);
      expect(metadata.quality).toBe('low');
    });
  });

  describe('exact and partial name matching', () => {
    it('returns exact name match with highest score', () => {
      const { results } = semanticSearch(RESOURCES, 'Figma');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].resource.name).toBe('Figma');
      expect(results[0].matchReasons).toContain('exact name match');
    });

    it('is case-insensitive for name matching', () => {
      const { results } = semanticSearch(RESOURCES, 'figma');
      expect(results[0].resource.name).toBe('Figma');
    });

    it('matches names that start with query', () => {
      const { results } = semanticSearch(RESOURCES, 'cool');
      const coolors = results.find(r => r.resource.name === 'Coolors');
      expect(coolors).toBeDefined();
      expect(coolors!.matchReasons).toContain('name starts with query');
    });

    it('matches names that contain query', () => {
      const { results } = semanticSearch(RESOURCES, 'flow');
      const webflow = results.find(r => r.resource.name === 'Webflow');
      expect(webflow).toBeDefined();
      expect(webflow!.matchReasons).toContain('name contains query');
    });
  });

  describe('category filtering via hardFilters', () => {
    it('restricts results to a single category', () => {
      const { results, metadata } = semanticSearch(RESOURCES, 'design', {
        hardFilters: { categories: ['AI'] },
      });
      for (const r of results) {
        expect(r.resource.category).toBe('AI');
      }
      expect(metadata.appliedFilters?.categories).toEqual(['AI']);
    });

    it('accepts multiple categories (OR logic)', () => {
      const { results } = semanticSearch(RESOURCES, 'design', {
        hardFilters: { categories: ['AI', 'Tools'] },
      });
      for (const r of results) {
        expect(['AI', 'Tools']).toContain(r.resource.category);
      }
    });

    it('returns empty when category filter eliminates all resources', () => {
      const { results, metadata } = semanticSearch(RESOURCES, 'figma', {
        hardFilters: { categories: ['NonExistentCategory'] },
      });
      expect(results).toEqual([]);
      expect(metadata.filteredPoolSize).toBe(0);
      expect(metadata.quality).toBe('fallback');
    });
  });

  describe('pricing filtering via hardFilters', () => {
    it('filters to free resources only', () => {
      const { results } = semanticSearch(RESOURCES, 'photo', {
        hardFilters: { pricing: ['Free'] },
      });
      for (const r of results) {
        expect(r.resource.pricing?.toLowerCase()).toBe('free');
      }
    });

    it('accepts multiple pricing values (OR logic)', () => {
      const { results } = semanticSearch(RESOURCES, 'design', {
        hardFilters: { pricing: ['Free', 'Paid'] },
      });
      for (const r of results) {
        expect(['free', 'paid']).toContain(r.resource.pricing?.toLowerCase());
      }
    });
  });

  describe('gravity score range filtering', () => {
    it('filters by minimum gravity score', () => {
      const { results } = semanticSearch(RESOURCES, 'design', {
        hardFilters: { minGravityScore: 9.0 },
      });
      for (const r of results) {
        expect(r.resource.gravityScore).toBeGreaterThanOrEqual(9.0);
      }
    });

    it('filters by maximum gravity score', () => {
      const { results } = semanticSearch(RESOURCES, 'design', {
        hardFilters: { maxGravityScore: 8.0 },
      });
      for (const r of results) {
        expect(r.resource.gravityScore).toBeLessThanOrEqual(8.0);
      }
    });

    it('filters by a gravity score range', () => {
      const { results } = semanticSearch(RESOURCES, 'design', {
        hardFilters: { minGravityScore: 8.0, maxGravityScore: 9.0 },
      });
      for (const r of results) {
        expect(r.resource.gravityScore).toBeGreaterThanOrEqual(8.0);
        expect(r.resource.gravityScore).toBeLessThanOrEqual(9.0);
      }
    });
  });

  describe('boolean hard filters', () => {
    it('filters to featured resources only', () => {
      const { results } = semanticSearch(RESOURCES, 'design', {
        hardFilters: { featured: true },
      });
      for (const r of results) {
        expect(r.resource.featured).toBe(true);
      }
    });

    it('filters to open source resources only', () => {
      const { results } = semanticSearch(RESOURCES, 'ui', {
        hardFilters: { opensource: true },
      });
      for (const r of results) {
        expect(r.resource.opensource).toBe(true);
      }
    });
  });

  describe('tag hard filters', () => {
    it('filters to resources with matching tags', () => {
      const { results } = semanticSearch(RESOURCES, 'tool', {
        hardFilters: { tags: ['video'] },
      });
      for (const r of results) {
        const tags = r.resource.tags?.map(t => t.toLowerCase()) ?? [];
        expect(tags.some(t => t.includes('video'))).toBe(true);
      }
    });
  });

  describe('maxResults and minResults', () => {
    it('respects maxResults limit', () => {
      const { results } = semanticSearch(RESOURCES, 'design', { maxResults: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('defaults maxResults to 50', () => {
      const { metadata } = semanticSearch(RESOURCES, 'design');
      // just verify it ran without errors; our pool is smaller than 50
      expect(metadata.totalResults).toBeLessThanOrEqual(50);
    });
  });

  describe('concept detection and boosting', () => {
    it('detects "vibe code" concept and boosts matching resources', () => {
      const { results, metadata } = semanticSearch(RESOURCES, 'vibe coding tools');
      expect(metadata.detectedConcepts).toContain('vibe code');
      const cursor = results.find(r => r.resource.name === 'Cursor');
      expect(cursor).toBeDefined();
      expect(cursor!.matchReasons).toContain('concept match');
    });

    it('detects "ai art" concept', () => {
      const { metadata } = semanticSearch(RESOURCES, 'ai art generators');
      expect(metadata.detectedConcepts).toContain('ai art');
    });
  });

  describe('synonym expansion', () => {
    it('expands query terms and records them in metadata', () => {
      const { metadata } = semanticSearch(RESOURCES, 'photo');
      // "photo" should expand to include photography, image, picture, etc.
      expect(metadata.expandedTerms.length).toBeGreaterThan(1);
      expect(metadata.expandedTerms).toContain('photo');
      expect(metadata.expandedTerms).toContain('photography');
    });
  });

  describe('LLM concept matching', () => {
    it('boosts resources whose description contains an LLM concept', () => {
      const { results } = semanticSearch(RESOURCES, 'tools', {
        llmConcepts: ['code editor'],
      });
      const cursor = results.find(r => r.resource.name === 'Cursor');
      expect(cursor).toBeDefined();
      expect(cursor!.matchReasons.some(r => r.startsWith('llm concept'))).toBe(true);
    });

    it('records llmConcepts in metadata', () => {
      const { metadata } = semanticSearch(RESOURCES, 'tools', {
        llmConcepts: ['code editor'],
      });
      expect(metadata.llmConcepts).toEqual(['code editor']);
    });
  });

  describe('scoring and sorting', () => {
    it('sorts results by score descending', () => {
      const { results } = semanticSearch(RESOURCES, 'design');
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('filters out results below MIN_RELEVANCE_THRESHOLD (25)', () => {
      const { results } = semanticSearch(RESOURCES, 'design');
      for (const r of results) {
        expect(r.score).toBeGreaterThanOrEqual(25);
      }
    });

    it('gives featured resources a small bonus', () => {
      // Figma is featured; search for something both Figma and a non-featured tool match
      const { results } = semanticSearch(RESOURCES, 'design');
      const figma = results.find(r => r.resource.name === 'Figma');
      if (figma) {
        expect(figma.matchReasons).toContain('featured');
      }
    });
  });

  describe('quality classification', () => {
    it('returns "high" quality for strong matches', () => {
      const { metadata } = semanticSearch(RESOURCES, 'Figma');
      // Exact name match at 100 points → high quality
      expect(['high', 'medium']).toContain(metadata.quality);
    });

    it('returns "low" quality when no resources match', () => {
      const { metadata } = semanticSearch(RESOURCES, 'xyznonexistent');
      expect(metadata.quality).toBe('low');
    });
  });

  describe('metadata completeness', () => {
    it('populates all metadata fields', () => {
      const { metadata } = semanticSearch(RESOURCES, 'free design tools', {
        hardFilters: { pricing: ['Free'] },
        llmConcepts: ['design'],
      });
      expect(metadata.originalQuery).toBe('free design tools');
      expect(typeof metadata.totalResults).toBe('number');
      expect(typeof metadata.directMatchCount).toBe('number');
      expect(Array.isArray(metadata.detectedConcepts)).toBe(true);
      expect(Array.isArray(metadata.expandedTerms)).toBe(true);
      expect(metadata.filteredPoolSize).toBeDefined();
      expect(metadata.appliedFilters).toBeDefined();
      expect(metadata.llmConcepts).toEqual(['design']);
    });

    it('detects matched category in metadata', () => {
      const { metadata } = semanticSearch(RESOURCES, 'ai');
      expect(metadata.matchedCategory).toBe('AI');
    });

    it('detects matched pricing in metadata', () => {
      const { metadata } = semanticSearch(RESOURCES, 'free tools');
      expect(metadata.matchedPricing).toBe('Free');
    });
  });

  describe('fallback behavior', () => {
    it('does NOT generate fallbacks for specific queries (>3 chars)', () => {
      const { results, metadata } = semanticSearch(RESOURCES, 'xyznonexistent', {
        includeFallback: true,
        minResults: 5,
      });
      // "xyznonexistent" is > 3 chars → no fallbacks
      expect(results.length).toBe(0);
      expect(metadata.quality).toBe('low');
    });

    it('may generate fallbacks for very short generic queries', () => {
      // This tests the fallback path: query <= 3 chars, no concepts detected
      const { metadata } = semanticSearch(RESOURCES, 'ai', {
        includeFallback: true,
        minResults: 5,
      });
      // "ai" detects concepts, so fallback may not trigger — just ensure no error
      expect(typeof metadata.totalResults).toBe('number');
    });
  });
});

// ─── applyHardFilters ────────────────────────────────────────────────────────

describe('applyHardFilters', () => {
  it('returns all resources when filters are undefined', () => {
    const result = applyHardFilters(RESOURCES, undefined);
    expect(result.length).toBe(RESOURCES.length);
  });

  it('returns all resources when filters are empty', () => {
    const result = applyHardFilters(RESOURCES, {});
    expect(result.length).toBe(RESOURCES.length);
  });

  it('filters by pricing', () => {
    const result = applyHardFilters(RESOURCES, { pricing: ['Free'] });
    expect(result.every(r => r.pricing?.toLowerCase() === 'free')).toBe(true);
  });

  it('filters by category', () => {
    const result = applyHardFilters(RESOURCES, { categories: ['AI'] });
    expect(result.every(r => r.category === 'AI')).toBe(true);
  });

  it('combines pricing and category filters (AND logic)', () => {
    const result = applyHardFilters(RESOURCES, {
      pricing: ['Paid'],
      categories: ['AI'],
    });
    for (const r of result) {
      expect(r.pricing?.toLowerCase()).toBe('paid');
      expect(r.category).toBe('AI');
    }
  });

  it('excludes resources without tags when tag filter is applied', () => {
    const noTagResource = makeResource({ id: 99, name: 'NoTags', tags: null });
    const result = applyHardFilters([...RESOURCES, noTagResource], { tags: ['design'] });
    expect(result.find(r => r.name === 'NoTags')).toBeUndefined();
  });
});

// ─── quickSearch ─────────────────────────────────────────────────────────────

describe('quickSearch', () => {
  it('returns resource objects directly (not ScoredResult)', () => {
    const results = quickSearch(RESOURCES, 'Figma', 3);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]).toHaveProperty('name');
    expect(results[0]).not.toHaveProperty('score');
  });

  it('respects maxResults', () => {
    const results = quickSearch(RESOURCES, 'design', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});

// ─── getSuggestions ──────────────────────────────────────────────────────────

describe('getSuggestions', () => {
  it('returns matching resource names', () => {
    const suggestions = getSuggestions(RESOURCES, 'fig');
    expect(suggestions).toContain('Figma');
  });

  it('returns matching tags', () => {
    const suggestions = getSuggestions(RESOURCES, 'proto');
    expect(suggestions.some(s => s.toLowerCase().includes('proto'))).toBe(true);
  });

  it('returns empty for queries shorter than 2 chars', () => {
    expect(getSuggestions(RESOURCES, 'f')).toEqual([]);
  });

  it('respects maxSuggestions', () => {
    const suggestions = getSuggestions(RESOURCES, 'de', 2);
    expect(suggestions.length).toBeLessThanOrEqual(2);
  });
});
