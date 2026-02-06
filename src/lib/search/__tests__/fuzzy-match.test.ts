import { describe, it, expect } from 'vitest';
import {
  levenshteinDistance,
  similarityRatio,
  isFuzzyMatch,
  getFuzzyScore,
  findBestMatch,
  tokenize,
} from '../fuzzy-match';

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('figma', 'figma')).toBe(0);
    expect(levenshteinDistance('Figma', 'figma')).toBe(0); // case insensitive
  });

  it('returns correct distance for single character changes', () => {
    expect(levenshteinDistance('figma', 'fgma')).toBe(1); // deletion
    expect(levenshteinDistance('figma', 'figmaa')).toBe(1); // insertion
    expect(levenshteinDistance('figma', 'figmo')).toBe(1); // substitution
  });

  it('handles empty strings', () => {
    expect(levenshteinDistance('', '')).toBe(0);
    expect(levenshteinDistance('figma', '')).toBe(5);
    expect(levenshteinDistance('', 'figma')).toBe(5);
  });

  it('handles common typos', () => {
    expect(levenshteinDistance('figma', 'fimga')).toBe(2); // transposition
    expect(levenshteinDistance('webflow', 'wbflow')).toBe(1);
    expect(levenshteinDistance('framer', 'framr')).toBe(1);
  });
});

describe('similarityRatio', () => {
  it('returns 1 for identical strings', () => {
    expect(similarityRatio('figma', 'figma')).toBe(1);
  });

  it('returns 0 for completely different strings', () => {
    expect(similarityRatio('abc', 'xyz')).toBe(0);
  });

  it('returns expected ratio for partial matches', () => {
    // "figma" vs "fgma" = 1 edit, max length 5, so 1 - 1/5 = 0.8
    expect(similarityRatio('figma', 'fgma')).toBe(0.8);
  });

  it('handles empty strings', () => {
    expect(similarityRatio('', '')).toBe(1);
  });
});

describe('isFuzzyMatch', () => {
  it('returns true for similar strings above threshold', () => {
    expect(isFuzzyMatch('figma', 'fgma', 0.7)).toBe(true); // 0.8 similarity
  });

  it('returns false for dissimilar strings', () => {
    expect(isFuzzyMatch('figma', 'notion', 0.7)).toBe(false);
  });

  it('returns false for very short queries', () => {
    expect(isFuzzyMatch('fi', 'figma', 0.7)).toBe(false);
  });

  it('uses default threshold of 0.7', () => {
    expect(isFuzzyMatch('figma', 'fgma')).toBe(true);
    expect(isFuzzyMatch('figma', 'fgm')).toBe(false);
  });
});

describe('getFuzzyScore', () => {
  it('returns 0 for strings below threshold', () => {
    expect(getFuzzyScore('abc', 'xyz', 0.6)).toBe(0);
  });

  it('returns 1 for identical strings', () => {
    expect(getFuzzyScore('figma', 'figma', 0.6)).toBe(1);
  });

  it('returns scaled score between 0 and 1', () => {
    const score = getFuzzyScore('figma', 'fgma', 0.6);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe('findBestMatch', () => {
  const candidates = ['figma', 'framer', 'webflow', 'notion'];

  it('finds exact match', () => {
    const result = findBestMatch('figma', candidates);
    expect(result?.match).toBe('figma');
    expect(result?.similarity).toBe(1);
  });

  it('finds fuzzy match for typo', () => {
    const result = findBestMatch('fgma', candidates, 0.7);
    expect(result?.match).toBe('figma');
  });

  it('returns null when no match meets threshold', () => {
    const result = findBestMatch('xyz', candidates, 0.7);
    expect(result).toBeNull();
  });
});

describe('tokenize', () => {
  it('splits on whitespace', () => {
    expect(tokenize('design tools')).toEqual(['design', 'tools']);
  });

  it('splits on common delimiters', () => {
    expect(tokenize('ai-powered')).toEqual(['ai', 'powered']);
    expect(tokenize('user_interface')).toEqual(['user', 'interface']);
  });

  it('converts to lowercase', () => {
    expect(tokenize('Design Tools')).toEqual(['design', 'tools']);
  });

  it('filters empty tokens', () => {
    expect(tokenize('  design   tools  ')).toEqual(['design', 'tools']);
  });
});
