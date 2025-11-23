/**
 * Elo Rating System for Adaptive Difficulty
 *
 * Uses Elo-style skill rating to estimate user skill level and
 * update it based on performance on questions of varying difficulty.
 *
 * Sprint 8 - Adaptive Difficulty
 */

/**
 * Skill level for a specific category
 */
export interface SkillLevel {
  estimatedLevel: number;      // 1-5, Elo-like rating
  confidence: number;           // 0-1, how sure we are
  lastUpdated: string;          // ISO timestamp
  questionsAttempted: number;
  recentPerformance: number[];  // last 10 attempts (0 or 1)
}

/**
 * Calculate expected probability of answering correctly
 * based on user skill level vs question difficulty
 *
 * Uses logistic function similar to Elo rating system
 *
 * @param userLevel - User's skill level (1-5)
 * @param questionDifficulty - Question difficulty (1-5)
 * @returns Expected probability of correct answer (0-1)
 */
export function calculateExpectedScore(
  userLevel: number,
  questionDifficulty: number
): number {
  // Logistic function: P = 1 / (1 + 10^((difficulty - skill) / 4))
  // Division by 4 scales the 1-5 range appropriately
  const exponent = (questionDifficulty - userLevel) / 4;
  return 1 / (1 + Math.pow(10, exponent));
}

/**
 * Update user skill level based on answer performance
 *
 * @param currentLevel - Current skill level (1-5)
 * @param questionDifficulty - Question difficulty (1-5)
 * @param isCorrect - Whether answer was correct
 * @param K - Adjustment speed (default: 32, higher = faster adaptation)
 * @returns Updated skill level (clamped to 1-5)
 */
export function updateSkillLevel(
  currentLevel: number,
  questionDifficulty: number,
  isCorrect: boolean,
  K: number = 32
): number {
  // Calculate expected score
  const expected = calculateExpectedScore(currentLevel, questionDifficulty);

  // Actual score: 1 for correct, 0 for incorrect
  const actual = isCorrect ? 1 : 0;

  // Calculate rating change: K * (actual - expected)
  const delta = K * (actual - expected);

  // Update level and clamp to valid range (1-5)
  const newLevel = currentLevel + delta;
  return Math.max(1, Math.min(5, newLevel));
}

/**
 * Update skill level with partial credit support
 *
 * @param currentLevel - Current skill level (1-5)
 * @param questionDifficulty - Question difficulty (1-5)
 * @param score - Answer score (0-1, supports partial credit)
 * @param K - Adjustment speed (default: 32)
 * @returns Updated skill level (clamped to 1-5)
 */
export function updateSkillLevelWithScore(
  currentLevel: number,
  questionDifficulty: number,
  score: number,
  K: number = 32
): number {
  // Calculate expected score
  const expected = calculateExpectedScore(currentLevel, questionDifficulty);

  // Clamp score to 0-1 range
  const actualScore = Math.max(0, Math.min(1, score));

  // Calculate rating change
  const delta = K * (actualScore - expected);

  // Update level and clamp to valid range
  const newLevel = currentLevel + delta;
  return Math.max(1, Math.min(5, newLevel));
}

/**
 * Calculate confidence based on performance consistency
 *
 * Higher variance in recent performance = lower confidence
 *
 * @param recentPerformance - Array of recent scores (0-1)
 * @returns Confidence score (0-1)
 */
export function calculateConfidence(recentPerformance: number[]): number {
  if (recentPerformance.length === 0) {
    return 0; // No data = no confidence
  }

  if (recentPerformance.length === 1) {
    return 0.3; // Single data point = low confidence
  }

  // Calculate mean
  const mean = recentPerformance.reduce((sum, val) => sum + val, 0) / recentPerformance.length;

  // Calculate variance
  const variance = recentPerformance.reduce((sum, val) => {
    const diff = val - mean;
    return sum + (diff * diff);
  }, 0) / recentPerformance.length;

  // Convert variance to confidence
  // High variance (up to 0.25 for binary outcomes) = low confidence
  // Low variance (close to 0) = high confidence
  const maxVariance = 0.25; // Maximum variance for binary outcomes
  const normalizedVariance = Math.min(variance, maxVariance) / maxVariance;

  // Confidence is inverse of variance, scaled to 0.3-1.0 range
  // Even with perfect consistency, we cap at 0.95 to account for growth
  const baseConfidence = 1 - normalizedVariance;
  const scaledConfidence = 0.3 + (baseConfidence * 0.65);

  // Boost confidence for more data points (up to 10)
  const dataBonus = Math.min(recentPerformance.length / 10, 1) * 0.05;

  return Math.min(0.95, scaledConfidence + dataBonus);
}

/**
 * Create a new skill level with default values
 *
 * @param category - Category name
 * @param initialLevel - Initial skill level (default: 2.5, middle)
 * @returns New SkillLevel object
 */
export function createSkillLevel(
  category: string,
  initialLevel: number = 2.5
): SkillLevel {
  return {
    estimatedLevel: Math.max(1, Math.min(5, initialLevel)),
    confidence: 0,
    lastUpdated: new Date().toISOString(),
    questionsAttempted: 0,
    recentPerformance: []
  };
}

/**
 * Update skill level with a new answer result
 *
 * @param skill - Current skill level object
 * @param questionDifficulty - Question difficulty (1-5)
 * @param score - Answer score (0-1)
 * @param adjustmentSpeed - K factor for Elo (default: 32)
 * @returns Updated skill level object (mutates original)
 */
export function updateSkill(
  skill: SkillLevel,
  questionDifficulty: number,
  score: number,
  adjustmentSpeed: number = 32
): SkillLevel {
  // Update skill level using Elo
  skill.estimatedLevel = updateSkillLevelWithScore(
    skill.estimatedLevel,
    questionDifficulty,
    score,
    adjustmentSpeed
  );

  // Add to recent performance history (keep last 10)
  skill.recentPerformance.push(score);
  if (skill.recentPerformance.length > 10) {
    skill.recentPerformance.shift();
  }

  // Update confidence based on consistency
  skill.confidence = calculateConfidence(skill.recentPerformance);

  // Update metadata
  skill.questionsAttempted += 1;
  skill.lastUpdated = new Date().toISOString();

  return skill;
}

/**
 * Estimate initial skill level from historical question performance
 *
 * @param questionHistory - Map of question performance data
 * @param getQuestionDifficulty - Function to get difficulty for a question
 * @returns Estimated skill level (1-5)
 */
export function estimateSkillFromHistory(
  questionHistory: Array<{
    difficulty: number;
    timesCorrect: number;
    timesSeen: number;
  }>
): number {
  if (questionHistory.length === 0) {
    return 2.5; // Default to middle if no history
  }

  // Calculate weighted average of performance at each difficulty
  let totalWeight = 0;
  let weightedSum = 0;

  for (const { difficulty, timesCorrect, timesSeen } of questionHistory) {
    if (timesSeen === 0) continue;

    const accuracy = timesCorrect / timesSeen;
    const weight = timesSeen; // Weight by number of attempts

    // If user gets 70% right at difficulty X, estimate skill near X
    // If user gets 100% right at difficulty X, estimate skill above X
    // If user gets 0% right at difficulty X, estimate skill below X
    const estimatedLevel = difficulty + (accuracy - 0.7) * 2;

    weightedSum += estimatedLevel * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return 2.5;
  }

  const estimated = weightedSum / totalWeight;
  return Math.max(1, Math.min(5, estimated));
}
