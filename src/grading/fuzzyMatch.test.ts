/**
 * Tests for fuzzy matching module
 */

import { describe, it, expect } from 'vitest';
import {
  levenshteinDistance,
  calculateSimilarity,
  normalizeText,
  findBestMatch,
  gradeTextAnswer,
  type GradingConfig,
  type AcceptableAnswer,
} from './fuzzyMatch';

describe('Fuzzy Matching Module', () => {
  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
      expect(levenshteinDistance('', '')).toBe(0);
    });

    it('should calculate distance for single character differences', () => {
      expect(levenshteinDistance('cat', 'hat')).toBe(1); // substitution
      expect(levenshteinDistance('cat', 'cats')).toBe(1); // insertion
      expect(levenshteinDistance('cats', 'cat')).toBe(1); // deletion
    });

    it('should calculate distance for multiple character differences', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(levenshteinDistance('saturday', 'sunday')).toBe(3);
    });

    it('should handle empty strings', () => {
      expect(levenshteinDistance('hello', '')).toBe(5);
      expect(levenshteinDistance('', 'world')).toBe(5);
    });

    it('should be symmetric', () => {
      expect(levenshteinDistance('abc', 'def')).toBe(levenshteinDistance('def', 'abc'));
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1.0 for identical strings', () => {
      expect(calculateSimilarity('hello', 'hello')).toBe(1.0);
      expect(calculateSimilarity('', '')).toBe(1.0);
    });

    it('should return 0.0 for completely different strings', () => {
      const similarity = calculateSimilarity('abc', 'xyz');
      expect(similarity).toBe(0.0);
    });

    it('should return high similarity for minor typos', () => {
      // "photosynthesis" vs "photosynthesiss" (one extra 's')
      const similarity = calculateSimilarity('photosynthesis', 'photosynthesiss');
      expect(similarity).toBeGreaterThan(0.9);
    });

    it('should return medium similarity for moderate differences', () => {
      const similarity = calculateSimilarity('hello', 'helo');
      expect(similarity).toBeGreaterThan(0.5);
      expect(similarity).toBeLessThan(1.0);
    });

    it('should handle empty strings', () => {
      expect(calculateSimilarity('hello', '')).toBe(0.0);
      expect(calculateSimilarity('', 'world')).toBe(0.0);
    });
  });

  describe('normalizeText', () => {
    it('should trim whitespace', () => {
      expect(normalizeText('  hello  ')).toBe('hello');
    });

    it('should convert to lowercase by default', () => {
      expect(normalizeText('HELLO')).toBe('hello');
      expect(normalizeText('HeLLo')).toBe('hello');
    });

    it('should preserve case when caseSensitive is true', () => {
      expect(normalizeText('HELLO', true)).toBe('HELLO');
      expect(normalizeText('HeLLo', true)).toBe('HeLLo');
    });

    it('should remove leading articles', () => {
      expect(normalizeText('the answer')).toBe('answer');
      expect(normalizeText('an answer')).toBe('answer');
      expect(normalizeText('a answer')).toBe('answer');
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeText('hello    world')).toBe('hello world');
      expect(normalizeText('multiple   spaces   here')).toBe('multiple spaces here');
    });

    it('should remove common punctuation', () => {
      expect(normalizeText('hello, world!')).toBe('hello world');
      expect(normalizeText('yes?')).toBe('yes');
      expect(normalizeText('"quoted"')).toBe('quoted');
    });

    it('should handle complex normalization', () => {
      expect(normalizeText('  The ANSWER,  is  "42"!  ')).toBe('answer is 42');
    });
  });

  describe('findBestMatch', () => {
    const enabledConfig: GradingConfig = {
      enableFuzzyMatching: true,
      fuzzyMatchThreshold: 0.8,
      enablePartialCredit: false,
      partialCreditThreshold: 0.6,
      partialCreditValue: 0.5,
    };

    const disabledConfig: GradingConfig = {
      enableFuzzyMatching: false,
      fuzzyMatchThreshold: 0.8,
      enablePartialCredit: false,
      partialCreditThreshold: 0.6,
      partialCreditValue: 0.5,
    };

    it('should find exact match with simple string', () => {
      const result = findBestMatch('photosynthesis', ['photosynthesis'], enabledConfig);
      expect(result.matched).toBe(true);
      expect(result.matchType).toBe('exact');
      expect(result.score).toBe(1.0);
      expect(result.similarity).toBe(1.0);
    });

    it('should find exact match with normalization', () => {
      const result = findBestMatch('  THE ANSWER  ', ['the answer'], enabledConfig);
      expect(result.matched).toBe(true);
      expect(result.matchType).toBe('exact');
      expect(result.score).toBe(1.0);
    });

    it('should find fuzzy match for minor typo', () => {
      const result = findBestMatch('photosynthesiss', ['photosynthesis'], enabledConfig);
      expect(result.matched).toBe(true);
      expect(result.matchType).toBe('fuzzy');
      expect(result.score).toBe(1.0);
      expect(result.similarity).toBeGreaterThan(0.8);
    });

    it('should not match when fuzzy matching is disabled', () => {
      const result = findBestMatch('PHOTOSYNTHESIS', ['photosynthesis'], disabledConfig);
      expect(result.matched).toBe(false);
      expect(result.matchType).toBe('none');
      expect(result.score).toBe(0);
    });

    it('should match exact case when fuzzy matching is disabled', () => {
      const result = findBestMatch('photosynthesis', ['photosynthesis'], disabledConfig);
      expect(result.matched).toBe(true);
      expect(result.matchType).toBe('exact');
      expect(result.score).toBe(1.0);
    });

    it('should try multiple acceptable answers', () => {
      const answers: AcceptableAnswer[] = ['answer1', 'answer2', 'correct'];
      const result = findBestMatch('correct', answers, enabledConfig);
      expect(result.matched).toBe(true);
      expect(result.matchedAnswer).toBe('correct');
    });

    it('should return best match when multiple answers are close', () => {
      const answers: AcceptableAnswer[] = ['hello', 'helo', 'hllo'];
      const result = findBestMatch('hello', answers, enabledConfig);
      expect(result.matchedAnswer).toBe('hello');
      expect(result.matchType).toBe('exact');
    });

    it('should respect normalize flag on answer variants', () => {
      const answers: AcceptableAnswer[] = [
        { value: 'exact match', normalize: false },
      ];
      const result = findBestMatch('EXACT MATCH', answers, enabledConfig);
      expect(result.matched).toBe(false); // normalize: false means case-sensitive
    });

    it('should respect caseSensitive flag on answer variants', () => {
      const answers: AcceptableAnswer[] = [
        { value: 'CaseSensitive', caseSensitive: true },
      ];
      const result = findBestMatch('casesensitive', answers, enabledConfig);
      expect(result.matched).toBe(false);
    });

    it('should handle exactMatch flag on answer variants', () => {
      const answers: AcceptableAnswer[] = [
        { value: 'exact only', exactMatch: true },
      ];
      // Close but not exact - should not match
      const result = findBestMatch('exact onlyy', answers, enabledConfig);
      expect(result.matched).toBe(false);
    });

    it('should support partial credit when enabled', () => {
      const partialConfig: GradingConfig = {
        enableFuzzyMatching: true,
        fuzzyMatchThreshold: 0.8,
        enablePartialCredit: true,
        partialCreditThreshold: 0.6,
        partialCreditValue: 0.5,
      };

      // Similarity between "hello" and "helo" is ~80%, so won't get full credit
      // but should get partial credit since it's > 60%
      const result = findBestMatch('helo', ['hello'], partialConfig);

      // With similarity ~80%, it should match as fuzzy
      expect(result.matched).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should apply custom partial credit value from answer variant', () => {
      const answers: AcceptableAnswer[] = [
        { value: 'answer', partialCredit: 0.75 },
      ];
      const result = findBestMatch('answer', answers, enabledConfig);
      expect(result.matched).toBe(true);
      expect(result.score).toBe(0.75);
    });

    it('should include custom feedback from answer variant', () => {
      const answers: AcceptableAnswer[] = [
        { value: 'answer', feedback: 'Custom feedback message' },
      ];
      const result = findBestMatch('answer', answers, enabledConfig);
      expect(result.matched).toBe(true);
      expect(result.feedback).toBe('Custom feedback message');
    });

    it('should not match when similarity is below threshold', () => {
      const result = findBestMatch('completely different', ['photosynthesis'], enabledConfig);
      expect(result.matched).toBe(false);
      expect(result.matchType).toBe('none');
      expect(result.score).toBe(0);
    });
  });

  describe('gradeTextAnswer', () => {
    const config: GradingConfig = {
      enableFuzzyMatching: true,
      fuzzyMatchThreshold: 0.8,
      enablePartialCredit: false,
      partialCreditThreshold: 0.6,
      partialCreditValue: 0.5,
    };

    it('should return no match for empty answer', () => {
      const result = gradeTextAnswer('', ['answer'], config);
      expect(result.matched).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should return no match for whitespace-only answer', () => {
      const result = gradeTextAnswer('   ', ['answer'], config);
      expect(result.matched).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should grade correct answer', () => {
      const result = gradeTextAnswer('photosynthesis', ['photosynthesis'], config);
      expect(result.matched).toBe(true);
      expect(result.matchType).toBe('exact');
      expect(result.score).toBe(1.0);
    });

    it('should grade answer with minor typo as fuzzy match', () => {
      const result = gradeTextAnswer('photosynthesiss', ['photosynthesis'], config);
      expect(result.matched).toBe(true);
      expect(result.matchType).toBe('fuzzy');
      expect(result.score).toBe(1.0);
    });

    it('should grade with multiple acceptable answers', () => {
      const answers: AcceptableAnswer[] = [
        'mitosis',
        'cell division',
        'cellular division',
      ];
      const result = gradeTextAnswer('cell division', answers, config);
      expect(result.matched).toBe(true);
      expect(result.matchedAnswer).toBe('cell division');
    });

    it('should handle answer variants with different options', () => {
      const answers: AcceptableAnswer[] = [
        { value: 'exact', normalize: true },
        { value: 'CaseSensitive', caseSensitive: true },
        'flexible',
      ];

      // Should match 'flexible' with normalization
      const result = gradeTextAnswer('FLEXIBLE', answers, config);
      expect(result.matched).toBe(true);
      expect(result.matchedAnswer).toBe('flexible');
    });
  });
});
