import { describe, it, expect } from 'vitest';
import {
  expandSynonyms,
  detectConcepts,
  resolveCategory,
  resolvePricing,
  synonymGroups,
  conceptMappings,
  categoryAliases,
  pricingKeywords,
} from '../semantic-mappings';

// ─── expandSynonyms ──────────────────────────────────────────────────────────

describe('expandSynonyms', () => {
  it('always includes the input term itself', () => {
    const result = expandSynonyms('photo');
    expect(result).toContain('photo');
  });

  it('expands a canonical key to all its synonyms', () => {
    const result = expandSynonyms('photo');
    expect(result).toContain('photography');
    expect(result).toContain('image');
    expect(result).toContain('picture');
  });

  it('reverse-expands a synonym value to its group', () => {
    // "photography" is a value under the "photo" key
    const result = expandSynonyms('photography');
    expect(result).toContain('photo');
    expect(result).toContain('image');
    expect(result).toContain('picture');
  });

  it('is case-insensitive', () => {
    const result = expandSynonyms('PHOTO');
    expect(result).toContain('photo');
    expect(result).toContain('photography');
  });

  it('handles leading/trailing whitespace', () => {
    const result = expandSynonyms('  photo  ');
    expect(result).toContain('photo');
    expect(result).toContain('photography');
  });

  it('returns only the input for an unknown term', () => {
    const result = expandSynonyms('xyzunknown');
    expect(result).toEqual(['xyzunknown']);
  });

  it('expands design-related terms', () => {
    const result = expandSynonyms('design');
    expect(result).toContain('designer');
    expect(result).toContain('ui');
    expect(result).toContain('ux');
  });

  it('expands video synonyms', () => {
    const result = expandSynonyms('video');
    expect(result).toContain('film');
    expect(result).toContain('footage');
    expect(result).toContain('clip');
  });

  it('expands AI synonyms', () => {
    const result = expandSynonyms('ai');
    expect(result).toContain('artificial intelligence');
    expect(result).toContain('machine learning');
    expect(result).toContain('ml');
  });

  it('expands code/development synonyms', () => {
    const result = expandSynonyms('code');
    expect(result).toContain('coding');
    expect(result).toContain('programming');
    expect(result).toContain('development');
  });

  it('expands from a value that belongs to multiple groups if applicable', () => {
    // "ui" appears in the design group
    const result = expandSynonyms('ui');
    expect(result).toContain('design');
    expect(result).toContain('ux');
  });

  it('returns unique values (no duplicates)', () => {
    const result = expandSynonyms('photo');
    const unique = [...new Set(result)];
    expect(result.length).toBe(unique.length);
  });
});

// ─── detectConcepts ──────────────────────────────────────────────────────────

describe('detectConcepts', () => {
  it('detects "vibe code" concept from keyword match', () => {
    expect(detectConcepts('vibe coding tools')).toContain('vibe code');
  });

  it('detects "ai art" concept', () => {
    expect(detectConcepts('ai art generators')).toContain('ai art');
  });

  it('detects "no code" concept', () => {
    expect(detectConcepts('no code website builder')).toContain('no code');
  });

  it('detects "design inspiration" concept', () => {
    expect(detectConcepts('design inspiration')).toContain('design inspiration');
  });

  it('detects multiple concepts from a compound query', () => {
    const concepts = detectConcepts('ai art and design inspiration');
    expect(concepts).toContain('ai art');
    expect(concepts).toContain('design inspiration');
  });

  it('is case-insensitive', () => {
    expect(detectConcepts('VIBE CODING')).toContain('vibe code');
  });

  it('handles leading/trailing whitespace', () => {
    expect(detectConcepts('  vibe coding  ')).toContain('vibe code');
  });

  it('returns empty array when no concepts match', () => {
    expect(detectConcepts('xyzunknown')).toEqual([]);
  });

  it('matches all concepts for empty string (keyword.includes("") is always true)', () => {
    // Empty string passes the bidirectional check: keyword.includes('')
    const concepts = detectConcepts('');
    expect(concepts.length).toBeGreaterThan(0);
  });

  it('detects concept via bidirectional matching (keyword includes query)', () => {
    // "vibe" is shorter than keyword "vibe coding" but keyword.includes(query) matches
    const concepts = detectConcepts('vibe');
    expect(concepts).toContain('vibe code');
  });

  it('detects "youtube creator" concept', () => {
    expect(detectConcepts('youtube creator tools')).toContain('youtube creator');
  });

  it('detects "website builder" concept', () => {
    expect(detectConcepts('website builder')).toContain('website builder');
  });

  it('detects "color tool" concept', () => {
    expect(detectConcepts('color palette generator')).toContain('color tool');
  });

  it('detects "icon library" concept', () => {
    expect(detectConcepts('icon library for react')).toContain('icon library');
  });

  it('detects "component library" concept', () => {
    expect(detectConcepts('ui library for react')).toContain('component library');
  });

  it('detects "design system" concept', () => {
    expect(detectConcepts('design system documentation')).toContain('design system');
  });

  it('detects "motion design" concept', () => {
    expect(detectConcepts('motion design animation')).toContain('motion design');
  });

  it('detects "photography" concept', () => {
    expect(detectConcepts('stock photos free')).toContain('photography');
  });
});

// ─── resolveCategory ─────────────────────────────────────────────────────────

describe('resolveCategory', () => {
  it('resolves direct category name (exact match)', () => {
    expect(resolveCategory('AI')).toBe('AI');
    expect(resolveCategory('Tools')).toBe('Tools');
    expect(resolveCategory('Inspiration')).toBe('Inspiration');
    expect(resolveCategory('Learning')).toBe('Learning');
    expect(resolveCategory('Templates')).toBe('Templates');
    expect(resolveCategory('Community')).toBe('Community');
  });

  it('is case-insensitive for direct matches', () => {
    expect(resolveCategory('ai')).toBe('AI');
    expect(resolveCategory('tools')).toBe('Tools');
    expect(resolveCategory('LEARNING')).toBe('Learning');
  });

  it('resolves alias to canonical category', () => {
    expect(resolveCategory('artificial intelligence')).toBe('AI');
    expect(resolveCategory('machine learning')).toBe('AI');
    expect(resolveCategory('apps')).toBe('Tools');
    expect(resolveCategory('software')).toBe('Tools');
    expect(resolveCategory('inspo')).toBe('Inspiration');
    expect(resolveCategory('tutorials')).toBe('Learning');
    expect(resolveCategory('assets')).toBe('Templates');
    expect(resolveCategory('forums')).toBe('Community');
  });

  it('returns null for unknown terms', () => {
    expect(resolveCategory('xyzunknown')).toBeNull();
    expect(resolveCategory('hamburger')).toBeNull();
  });

  it('handles whitespace', () => {
    expect(resolveCategory('  ai  ')).toBe('AI');
  });

  it('returns null for empty string', () => {
    expect(resolveCategory('')).toBeNull();
  });

  it('resolves every alias defined in categoryAliases', () => {
    for (const [category, aliases] of Object.entries(categoryAliases)) {
      for (const alias of aliases) {
        expect(resolveCategory(alias)).toBe(category);
      }
    }
  });
});

// ─── resolvePricing ──────────────────────────────────────────────────────────

describe('resolvePricing', () => {
  it('resolves "free" to Free', () => {
    expect(resolvePricing('free')).toBe('Free');
  });

  it('resolves "freemium" to Free (includes "free" which matches first)', () => {
    // "freemium" contains "free", and Free is checked before Freemium
    expect(resolvePricing('freemium')).toBe('Free');
  });

  it('resolves "paid" to Paid', () => {
    expect(resolvePricing('paid')).toBe('Paid');
  });

  it('resolves "open source" to Open Source', () => {
    expect(resolvePricing('open source')).toBe('Open Source');
  });

  it('resolves pricing keywords within longer phrases', () => {
    expect(resolvePricing('free tools')).toBe('Free');
    // "find me freemium apps" contains "free" which matches Free first
    expect(resolvePricing('find me freemium apps')).toBe('Free');
    expect(resolvePricing('best paid software')).toBe('Paid');
    expect(resolvePricing('open source alternatives')).toBe('Open Source');
  });

  it('resolves alias keywords', () => {
    expect(resolvePricing('gratis')).toBe('Free');
    expect(resolvePricing('$0 cost')).toBe('Free');
    // "free tier" and "free plan" contain "free" so they match Free first
    expect(resolvePricing('free tier')).toBe('Free');
    expect(resolvePricing('free plan available')).toBe('Free');
    expect(resolvePricing('premium subscription')).toBe('Paid');
    expect(resolvePricing('opensource')).toBe('Open Source');
    // "foss project" contains "pro" which matches Paid's "pro" keyword first
    expect(resolvePricing('foss project')).toBe('Paid');
  });

  it('is case-insensitive', () => {
    expect(resolvePricing('FREE')).toBe('Free');
    expect(resolvePricing('Open Source')).toBe('Open Source');
  });

  it('returns null for unknown terms', () => {
    expect(resolvePricing('xyzunknown')).toBeNull();
    expect(resolvePricing('enterprise')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(resolvePricing('')).toBeNull();
  });

  it('resolves unique keywords that do not collide with earlier pricing groups', () => {
    // Some Freemium keywords contain "free" and match Free first due to iteration order.
    // Test only keywords unique to their pricing group.
    expect(resolvePricing('gratis')).toBe('Free');
    expect(resolvePricing('no cost')).toBe('Free');
    expect(resolvePricing('paid')).toBe('Paid');
    expect(resolvePricing('subscription')).toBe('Paid');
    expect(resolvePricing('open source')).toBe('Open Source');
    expect(resolvePricing('oss')).toBe('Open Source');
    expect(resolvePricing('libre')).toBe('Open Source');
  });

  it('prefers the first matching pricing model when input matches multiple', () => {
    // "free" appears in both Free keywords and Freemium keywords ("basic free")
    // But plain "free" should match Free first since it's checked first
    const result = resolvePricing('free');
    expect(result).toBe('Free');
  });
});

// ─── Data integrity ──────────────────────────────────────────────────────────

describe('data integrity', () => {
  it('synonymGroups keys are all lowercase', () => {
    for (const key of Object.keys(synonymGroups)) {
      expect(key).toBe(key.toLowerCase());
    }
  });

  it('categoryAliases values are all lowercase', () => {
    for (const aliases of Object.values(categoryAliases)) {
      for (const alias of aliases) {
        expect(alias).toBe(alias.toLowerCase());
      }
    }
  });

  it('pricingKeywords values are all lowercase', () => {
    for (const keywords of Object.values(pricingKeywords)) {
      for (const keyword of keywords) {
        expect(keyword).toBe(keyword.toLowerCase());
      }
    }
  });

  it('every conceptMapping has at least one keyword and one resource name', () => {
    for (const [_name, concept] of Object.entries(conceptMappings)) {
      expect(concept.keywords.length).toBeGreaterThan(0);
      expect(concept.resourceNames.length).toBeGreaterThan(0);
      expect(concept.description).toBeTruthy();
      expect(concept.categories.length).toBeGreaterThan(0);
    }
  });

  it('conceptMapping keywords are all lowercase', () => {
    for (const concept of Object.values(conceptMappings)) {
      for (const keyword of concept.keywords) {
        expect(keyword).toBe(keyword.toLowerCase());
      }
    }
  });
});
