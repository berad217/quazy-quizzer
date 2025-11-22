/**
 * Fuzzy Matching Module
 *
 * Implements fuzzy string matching using Levenshtein distance
 * for accepting answers with minor typos and variations.
 */

/**
 * Answer variant with metadata for advanced matching
 */
export interface AnswerVariant {
  value: string;
  normalize?: boolean;         // legacy: enable normalization (default: true)
  caseSensitive?: boolean;     // override normalization
  exactMatch?: boolean;        // skip fuzzy matching
  partialCredit?: number;      // 0-1, specific credit amount
  feedback?: string;           // custom feedback for this variant
}

/**
 * Acceptable answer can be a simple string or variant object
 */
export type AcceptableAnswer = string | AnswerVariant;

/**
 * Configuration for grading behavior
 */
export interface GradingConfig {
  enableFuzzyMatching: boolean;        // default: true
  fuzzyMatchThreshold: number;         // 0-1, default: 0.8 (80%)
  enablePartialCredit: boolean;        // default: false
  partialCreditThreshold: number;      // 0-1, default: 0.6 (60%)
  partialCreditValue: number;          // 0-1, default: 0.5 (50%)
}

/**
 * Result of matching attempt
 */
export interface MatchResult {
  matched: boolean;
  score: number;                       // 0-1
  matchType: 'exact' | 'fuzzy' | 'partial' | 'none';
  similarity: number;                  // 0-1
  matchedAnswer: string;
  feedback?: string;
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits (insertions, deletions, substitutions)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first column and row
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1)
 * 1.0 = identical, 0.0 = completely different
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 && str2.length === 0) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);

  // Similarity = 1 - (distance / max_length)
  return Math.max(0, 1 - (distance / maxLen));
}

/**
 * Normalize text for comparison
 * Removes extra whitespace, converts to lowercase, removes common punctuation
 */
export function normalizeText(text: string, caseSensitive: boolean = false): string {
  let normalized = text.trim();

  // Remove articles (a, an, the) at the start
  normalized = normalized.replace(/^(a|an|the)\s+/i, '');

  // Remove common punctuation
  normalized = normalized.replace(/[.,!?;:'"()]/g, '');

  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Convert to lowercase unless case sensitive
  if (!caseSensitive) {
    normalized = normalized.toLowerCase();
  }

  return normalized;
}

/**
 * Extract answer value from AcceptableAnswer
 */
function getAnswerValue(answer: AcceptableAnswer): string {
  return typeof answer === 'string' ? answer : answer.value;
}

/**
 * Check if answer should be normalized
 * Handles both legacy normalize property and new caseSensitive property
 */
function shouldNormalizeAnswer(answer: AcceptableAnswer): boolean {
  if (typeof answer === 'string') {
    return true; // Simple strings are normalized by default
  }

  // Legacy normalize property (normalize: false means case-sensitive)
  if (answer.normalize !== undefined) {
    return answer.normalize;
  }

  // New caseSensitive property (caseSensitive: true means don't normalize)
  if (answer.caseSensitive !== undefined) {
    return !answer.caseSensitive;
  }

  // Default: normalize
  return true;
}

/**
 * Get case sensitivity setting from AcceptableAnswer
 */
function isCaseSensitive(answer: AcceptableAnswer): boolean {
  return typeof answer === 'string' ? false : (answer.caseSensitive || false);
}

/**
 * Check if exact match is required for this answer
 */
function requiresExactMatch(answer: AcceptableAnswer): boolean {
  return typeof answer === 'string' ? false : (answer.exactMatch || false);
}

/**
 * Get partial credit value for this answer (if specified)
 */
function getPartialCredit(answer: AcceptableAnswer): number | undefined {
  return typeof answer === 'string' ? undefined : answer.partialCredit;
}

/**
 * Get feedback for this answer (if specified)
 */
function getFeedback(answer: AcceptableAnswer): string | undefined {
  return typeof answer === 'string' ? undefined : answer.feedback;
}

/**
 * Find the best matching answer from a list of acceptable answers
 */
export function findBestMatch(
  userAnswer: string,
  acceptableAnswers: AcceptableAnswer[],
  config: GradingConfig
): MatchResult {
  let bestMatch: MatchResult = {
    matched: false,
    score: 0,
    matchType: 'none',
    similarity: 0,
    matchedAnswer: '',
  };

  for (const answer of acceptableAnswers) {
    const answerValue = getAnswerValue(answer);
    const exactOnly = requiresExactMatch(answer);

    // Determine if we should normalize for this answer
    // When fuzzy matching is enabled, respect per-answer normalize settings (default: normalize)
    // When fuzzy matching is disabled, don't normalize (strict exact match)
    const answerWantsNormalization = shouldNormalizeAnswer(answer);
    const shouldNormalize = config.enableFuzzyMatching && answerWantsNormalization;

    // Normalize both strings (or use as-is if normalization is disabled)
    const normalizedUser = shouldNormalize ? normalizeText(userAnswer, false) : userAnswer;
    const normalizedAnswer = shouldNormalize ? normalizeText(answerValue, false) : answerValue;

    // Check for exact match
    if (normalizedUser === normalizedAnswer) {
      const partialCreditValue = getPartialCredit(answer);
      return {
        matched: true,
        score: partialCreditValue !== undefined ? partialCreditValue : 1.0,
        matchType: 'exact',
        similarity: 1.0,
        matchedAnswer: answerValue,
        feedback: getFeedback(answer),
      };
    }

    // Skip fuzzy matching if:
    // - exact match is required
    // - fuzzy matching is disabled globally
    // - answer requires case-sensitive matching (implies exact match only)
    if (exactOnly || !config.enableFuzzyMatching || !answerWantsNormalization) {
      continue;
    }

    // Calculate similarity
    const similarity = calculateSimilarity(normalizedUser, normalizedAnswer);

    // Check if this is the best match so far
    if (similarity > bestMatch.similarity) {
      let matchType: 'exact' | 'fuzzy' | 'partial' | 'none' = 'none';
      let score = 0;
      let matched = false;

      if (similarity >= config.fuzzyMatchThreshold) {
        // Fuzzy match - close enough to accept as correct
        matchType = 'fuzzy';
        score = 1.0;
        matched = true;
      } else if (config.enablePartialCredit && similarity >= config.partialCreditThreshold) {
        // Partial credit - somewhat close
        matchType = 'partial';
        score = config.partialCreditValue;
        matched = true;
      }

      if (similarity > bestMatch.similarity) {
        bestMatch = {
          matched,
          score,
          matchType,
          similarity,
          matchedAnswer: answerValue,
          feedback: getFeedback(answer),
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Grade a text answer against acceptable answers
 */
export function gradeTextAnswer(
  userAnswer: string,
  acceptableAnswers: AcceptableAnswer[],
  config: GradingConfig
): MatchResult {
  if (!userAnswer || userAnswer.trim().length === 0) {
    return {
      matched: false,
      score: 0,
      matchType: 'none',
      similarity: 0,
      matchedAnswer: '',
    };
  }

  return findBestMatch(userAnswer, acceptableAnswers, config);
}
