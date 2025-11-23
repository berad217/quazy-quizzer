/**
 * Adaptive Question Selection
 *
 * Selects questions based on user skill level to optimize learning.
 * Uses weighted sampling to prefer questions near user's skill level.
 *
 * Sprint 8 - Adaptive Difficulty
 */

import { Question } from '../quiz-engine/schema';
import { SkillLevel } from './eloRating';

/**
 * User skill levels by category
 */
export interface SkillLevels {
  [category: string]: SkillLevel;
}

/**
 * Question with selection weight
 */
interface WeightedQuestion {
  question: Question;
  weight: number;
  compositeKey: string;
}

/**
 * Calculate selection weight for a question based on user skill
 *
 * Weight is highest for questions near user's skill level,
 * decreases exponentially with distance.
 *
 * @param question - Question to weight
 * @param userSkills - User's skill levels by category
 * @param targetAccuracy - Desired accuracy (0-1), default 0.7
 * @returns Selection weight (0-1+)
 */
export function calculateQuestionWeight(
  question: Question,
  userSkills: SkillLevels,
  targetAccuracy: number = 0.7
): number {
  // Get question metadata
  const difficulty = question.meta?.difficulty || 3;
  const category = question.meta?.category || 'general';

  // Get user skill for this category (default to 2.5 if unknown)
  const userSkill = userSkills[category];
  const userLevel = userSkill?.estimatedLevel || 2.5;

  // Calculate difficulty gap
  const difficultyGap = Math.abs(userLevel - difficulty);

  // Base weight: exponential decay with distance
  // Peak at exact match, 60% at ±0.5, 36% at ±1, etc.
  const baseWeight = Math.exp(-difficultyGap * 0.7);

  // Adjust for target accuracy
  // Higher target accuracy = prefer easier questions
  // Lower target accuracy = allow harder questions
  let accuracyAdjustment = 1.0;

  if (targetAccuracy > 0.7) {
    // Want easier questions: boost weight for questions below user level
    if (difficulty < userLevel) {
      const easierBoost = (targetAccuracy - 0.7) * 2; // 0-0.6
      accuracyAdjustment = 1 + easierBoost;
    } else if (difficulty > userLevel) {
      // Penalize harder questions
      const harderPenalty = (targetAccuracy - 0.7) * 1.5;
      accuracyAdjustment = 1 - harderPenalty;
    }
  } else if (targetAccuracy < 0.7) {
    // Want harder questions: boost weight for questions above user level
    if (difficulty > userLevel) {
      const harderBoost = (0.7 - targetAccuracy) * 2; // 0-1.4
      accuracyAdjustment = 1 + harderBoost;
    }
  }

  // Ensure adjustment is positive
  accuracyAdjustment = Math.max(0.1, accuracyAdjustment);

  return baseWeight * accuracyAdjustment;
}

/**
 * Weighted random sampling
 *
 * Selects items randomly with probability proportional to their weights
 *
 * @param items - Array of weighted items
 * @param count - Number of items to select
 * @returns Selected items (without duplicates)
 */
function weightedSample<T extends { weight: number }>(
  items: T[],
  count: number
): T[] {
  if (items.length === 0) return [];
  if (count >= items.length) return [...items];

  const selected: T[] = [];
  const remaining = [...items];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    // Calculate total weight
    const totalWeight = remaining.reduce((sum, item) => sum + item.weight, 0);

    if (totalWeight === 0) {
      // All weights are zero, just pick randomly
      const idx = Math.floor(Math.random() * remaining.length);
      selected.push(remaining[idx]);
      remaining.splice(idx, 1);
      continue;
    }

    // Pick random value in [0, totalWeight)
    const rand = Math.random() * totalWeight;

    // Find item corresponding to this weight
    let cumulative = 0;
    let selectedIdx = 0;

    for (let j = 0; j < remaining.length; j++) {
      cumulative += remaining[j].weight;
      if (rand < cumulative) {
        selectedIdx = j;
        break;
      }
    }

    // Add to selected and remove from remaining
    selected.push(remaining[selectedIdx]);
    remaining.splice(selectedIdx, 1);
  }

  return selected;
}

/**
 * Select questions adaptively based on user skill
 *
 * @param questions - Available questions with composite keys
 * @param userSkills - User's skill levels by category
 * @param count - Number of questions to select
 * @param targetAccuracy - Desired accuracy (0-1), default 0.7
 * @param randomize - Whether to randomize final order (default: true)
 * @returns Selected questions with composite keys
 */
export function selectAdaptiveQuestions(
  questions: Array<{ question: Question; compositeKey: string }>,
  userSkills: SkillLevels,
  count: number,
  targetAccuracy: number = 0.7,
  randomize: boolean = true
): Array<{ question: Question; compositeKey: string }> {
  // Calculate weights for all questions
  const weighted: WeightedQuestion[] = questions.map(({ question, compositeKey }) => ({
    question,
    compositeKey,
    weight: calculateQuestionWeight(question, userSkills, targetAccuracy)
  }));

  // Select using weighted sampling
  const selected = weightedSample(weighted, count);

  // Convert back to original format
  const result = selected.map(({ question, compositeKey }) => ({
    question,
    compositeKey
  }));

  // Randomize order if requested
  if (randomize) {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
  }

  return result;
}

/**
 * Get distribution of questions by difficulty level
 *
 * Useful for analytics and debugging
 *
 * @param questions - Questions to analyze
 * @returns Map of difficulty -> count
 */
export function getDifficultyDistribution(
  questions: Question[]
): Map<number, number> {
  const distribution = new Map<number, number>();

  for (const question of questions) {
    const difficulty = question.meta?.difficulty || 3;
    distribution.set(difficulty, (distribution.get(difficulty) || 0) + 1);
  }

  return distribution;
}

/**
 * Calculate average difficulty of a set of questions
 *
 * @param questions - Questions to analyze
 * @returns Average difficulty (1-5), or 3 if no questions
 */
export function getAverageDifficulty(questions: Question[]): number {
  if (questions.length === 0) return 3;

  const total = questions.reduce((sum, q) => {
    return sum + (q.meta?.difficulty || 3);
  }, 0);

  return total / questions.length;
}

/**
 * Validate that questions have sufficient difficulty metadata
 *
 * @param questions - Questions to validate
 * @returns Validation result with warnings
 */
export function validateQuestionsForAdaptive(
  questions: Question[]
): {
  valid: boolean;
  warnings: string[];
  missingDifficulty: number;
  missingCategory: number;
} {
  let missingDifficulty = 0;
  let missingCategory = 0;
  const warnings: string[] = [];

  for (const question of questions) {
    if (!question.meta?.difficulty) {
      missingDifficulty++;
    }
    if (!question.meta?.category) {
      missingCategory++;
    }
  }

  if (missingDifficulty > 0) {
    warnings.push(
      `${missingDifficulty} questions missing difficulty rating (will default to 3)`
    );
  }

  if (missingCategory > 0) {
    warnings.push(
      `${missingCategory} questions missing category (will use "general")`
    );
  }

  // Valid if at least some questions have metadata
  const valid = missingDifficulty < questions.length;

  return {
    valid,
    warnings,
    missingDifficulty,
    missingCategory
  };
}
