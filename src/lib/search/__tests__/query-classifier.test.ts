import { describe, it, expect } from 'vitest';
import {
  classifyQueryComplexity,
  isSimpleQuery,
  isComplexQuery,
} from '../query-classifier';

describe('classifyQueryComplexity', () => {
  describe('simple queries', () => {
    it('classifies empty queries as simple', () => {
      expect(classifyQueryComplexity('')).toMatchObject({ isComplex: false });
      expect(classifyQueryComplexity(' ')).toMatchObject({ isComplex: false });
    });

    it('classifies very short queries as simple', () => {
      expect(classifyQueryComplexity('ai')).toMatchObject({ isComplex: false });
      expect(classifyQueryComplexity('ux')).toMatchObject({ isComplex: false });
    });

    it('classifies known tool names as simple', () => {
      expect(classifyQueryComplexity('figma')).toMatchObject({
        isComplex: false,
        reasons: ['known tool name'],
      });
      expect(classifyQueryComplexity('Figma')).toMatchObject({ isComplex: false });
      expect(classifyQueryComplexity('framer')).toMatchObject({ isComplex: false });
      expect(classifyQueryComplexity('notion')).toMatchObject({ isComplex: false });
    });
  });

  describe('complex queries - rating operators', () => {
    it('detects rating operators', () => {
      const result = classifyQueryComplexity('tools with rating over 80');
      expect(result.isComplex).toBe(true);
      expect(result.reasons).toContain('contains rating operator');
    });

    it('detects rating keywords', () => {
      const result = classifyQueryComplexity('top rated design tools');
      expect(result.isComplex).toBe(true);
      expect(result.reasons).toContain('contains rating keyword');
    });
  });

  describe('complex queries - pricing', () => {
    it('detects pricing keywords', () => {
      expect(classifyQueryComplexity('free design tools').isComplex).toBe(true);
      expect(classifyQueryComplexity('open source alternatives').isComplex).toBe(true);
      expect(classifyQueryComplexity('freemium apps').isComplex).toBe(true);
    });
  });

  describe('complex queries - comparisons', () => {
    it('detects comparison queries', () => {
      const result = classifyQueryComplexity('alternatives to figma');
      expect(result.isComplex).toBe(true);
      expect(result.reasons).toContain('comparison query');
      expect(result.suggestedIntent).toBe('compare');
    });

    it('detects similar to queries', () => {
      expect(classifyQueryComplexity('similar to notion').isComplex).toBe(true);
    });
  });

  describe('complex queries - filter language', () => {
    it('detects explicit filter language', () => {
      expect(classifyQueryComplexity('show me design tools').isComplex).toBe(true);
      expect(classifyQueryComplexity('only free tools').isComplex).toBe(true);
    });
  });

  describe('complex queries - feature queries', () => {
    it('detects feature-based queries', () => {
      const result = classifyQueryComplexity('tools for wireframing');
      expect(result.isComplex).toBe(true);
      expect(result.suggestedIntent).toBe('find');
    });
  });

  describe('complex queries - multi-word', () => {
    it('classifies 3+ word queries as complex', () => {
      expect(classifyQueryComplexity('mood board tools').isComplex).toBe(true);
    });

    it('keeps 2 word queries simple if no other indicators', () => {
      // "design tools" matches categoryPlusModifier pattern, so use different example
      expect(classifyQueryComplexity('color picker').isComplex).toBe(false);
    });
  });

  describe('suggested intent', () => {
    it('suggests filter intent for rating queries', () => {
      expect(classifyQueryComplexity('best rated tools').suggestedIntent).toBe('filter');
    });

    it('suggests compare intent for alternative queries', () => {
      expect(classifyQueryComplexity('figma alternatives').suggestedIntent).toBe('compare');
    });

    it('suggests find intent for feature queries', () => {
      expect(classifyQueryComplexity('tools for prototyping').suggestedIntent).toBe('find');
    });
  });
});

describe('isSimpleQuery', () => {
  it('returns true for simple queries', () => {
    expect(isSimpleQuery('figma')).toBe(true);
    expect(isSimpleQuery('ux')).toBe(true);
  });

  it('returns false for complex queries', () => {
    expect(isSimpleQuery('free design tools')).toBe(false);
    expect(isSimpleQuery('alternatives to figma')).toBe(false);
  });
});

describe('isComplexQuery', () => {
  it('returns false for simple queries', () => {
    expect(isComplexQuery('figma')).toBe(false);
  });

  it('returns true for complex queries', () => {
    expect(isComplexQuery('top rated design tools')).toBe(true);
  });
});
