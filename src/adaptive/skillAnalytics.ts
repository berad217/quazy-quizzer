/**
 * Skill Analytics
 *
 * Provides analytics and insights about user skill progression
 *
 * Sprint 8 - Adaptive Difficulty
 */

import { SkillLevel, SkillLevels } from './eloRating';

/**
 * Skill progression data point
 */
export interface SkillDataPoint {
  timestamp: string;
  level: number;
  confidence: number;
}

/**
 * Category performance summary
 */
export interface CategorySummary {
  category: string;
  currentLevel: number;
  confidence: number;
  questionsAttempted: number;
  recentAccuracy: number; // 0-1
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
}

/**
 * Overall skill summary
 */
export interface SkillSummary {
  overallLevel: number; // Weighted average across categories
  totalQuestionsAttempted: number;
  categorySummaries: CategorySummary[];
  strongestCategory?: string;
  weakestCategory?: string;
}

/**
 * Calculate recent accuracy from performance array
 *
 * @param recentPerformance - Array of recent scores (0-1)
 * @returns Accuracy as decimal (0-1)
 */
export function calculateRecentAccuracy(recentPerformance: number[]): number {
  if (recentPerformance.length === 0) return 0;

  const sum = recentPerformance.reduce((acc, score) => acc + score, 0);
  return sum / recentPerformance.length;
}

/**
 * Determine skill trend based on recent performance
 *
 * @param recentPerformance - Array of recent scores (0-1)
 * @returns Trend classification
 */
export function determineSkillTrend(
  recentPerformance: number[]
): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
  if (recentPerformance.length < 3) {
    return 'insufficient_data';
  }

  // Split into first half and second half
  const midpoint = Math.floor(recentPerformance.length / 2);
  const firstHalf = recentPerformance.slice(0, midpoint);
  const secondHalf = recentPerformance.slice(midpoint);

  // Calculate averages
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

  // Determine trend based on difference
  const difference = secondAvg - firstAvg;

  if (difference > 0.15) return 'improving';
  if (difference < -0.15) return 'declining';
  return 'stable';
}

/**
 * Generate category summary
 *
 * @param category - Category name
 * @param skill - Skill level data
 * @returns Category summary
 */
export function generateCategorySummary(
  category: string,
  skill: SkillLevel
): CategorySummary {
  return {
    category,
    currentLevel: skill.estimatedLevel,
    confidence: skill.confidence,
    questionsAttempted: skill.questionsAttempted,
    recentAccuracy: calculateRecentAccuracy(skill.recentPerformance),
    trend: determineSkillTrend(skill.recentPerformance)
  };
}

/**
 * Generate overall skill summary
 *
 * @param skillLevels - User's skill levels by category
 * @returns Overall skill summary
 */
export function generateSkillSummary(skillLevels: SkillLevels): SkillSummary {
  const categories = Object.keys(skillLevels);

  if (categories.length === 0) {
    return {
      overallLevel: 2.5,
      totalQuestionsAttempted: 0,
      categorySummaries: []
    };
  }

  // Generate summaries for each category
  const categorySummaries = categories.map(category =>
    generateCategorySummary(category, skillLevels[category])
  );

  // Calculate weighted average skill level
  // Weight by confidence * questions attempted
  let totalWeight = 0;
  let weightedSum = 0;
  let totalQuestions = 0;

  for (const summary of categorySummaries) {
    const weight = summary.confidence * summary.questionsAttempted;
    weightedSum += summary.currentLevel * weight;
    totalWeight += weight;
    totalQuestions += summary.questionsAttempted;
  }

  const overallLevel = totalWeight > 0 ? weightedSum / totalWeight : 2.5;

  // Find strongest and weakest categories (minimum 5 questions attempted)
  const qualifiedCategories = categorySummaries.filter(s => s.questionsAttempted >= 5);

  let strongestCategory: string | undefined;
  let weakestCategory: string | undefined;

  if (qualifiedCategories.length > 0) {
    // Sort by level
    const sorted = [...qualifiedCategories].sort((a, b) => b.currentLevel - a.currentLevel);
    strongestCategory = sorted[0].category;
    weakestCategory = sorted[sorted.length - 1].category;
  }

  return {
    overallLevel,
    totalQuestionsAttempted: totalQuestions,
    categorySummaries,
    strongestCategory,
    weakestCategory
  };
}

/**
 * Get recommended difficulty for next questions
 *
 * @param skillLevel - User's skill level
 * @param targetAccuracy - Desired accuracy (0-1)
 * @returns Recommended difficulty range
 */
export function getRecommendedDifficulty(
  skillLevel: number,
  targetAccuracy: number = 0.7
): { min: number; max: number; optimal: number } {
  // For 70% target accuracy, questions at user's level are optimal
  // For higher accuracy, recommend easier questions
  // For lower accuracy, recommend harder questions

  const offset = (0.7 - targetAccuracy) * 2;
  const optimal = Math.max(1, Math.min(5, skillLevel + offset));

  // Range is ±1 from optimal
  const min = Math.max(1, optimal - 1);
  const max = Math.min(5, optimal + 1);

  return {
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    optimal: Math.round(optimal * 10) / 10
  };
}

/**
 * Calculate skill growth rate
 *
 * @param recentPerformance - Array of recent scores
 * @returns Growth rate estimate (-1 to 1, 0 = stable)
 */
export function calculateGrowthRate(recentPerformance: number[]): number {
  if (recentPerformance.length < 3) return 0;

  // Simple linear regression to find slope
  const n = recentPerformance.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  const sumX = indices.reduce((sum, x) => sum + x, 0);
  const sumY = recentPerformance.reduce((sum, y) => sum + y, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * recentPerformance[i], 0);
  const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Normalize slope to -1 to 1 range
  // A slope of ±0.1 per question is significant growth/decline
  return Math.max(-1, Math.min(1, slope * 10));
}

/**
 * Generate performance insights
 *
 * @param summary - Skill summary
 * @returns Array of insight messages
 */
export function generateInsights(summary: SkillSummary): string[] {
  const insights: string[] = [];

  // Overall level insight
  if (summary.overallLevel < 2) {
    insights.push('You\'re just getting started. Keep practicing!');
  } else if (summary.overallLevel < 3) {
    insights.push('You\'re building a solid foundation.');
  } else if (summary.overallLevel < 4) {
    insights.push('You\'re developing strong skills!');
  } else if (summary.overallLevel < 4.5) {
    insights.push('You\'re approaching expert level!');
  } else {
    insights.push('Outstanding performance! You\'re a master!');
  }

  // Category-specific insights
  const improving = summary.categorySummaries.filter(s => s.trend === 'improving');
  const declining = summary.categorySummaries.filter(s => s.trend === 'declining');

  if (improving.length > 0) {
    const categories = improving.map(s => s.category).join(', ');
    insights.push(`Strong improvement in: ${categories}`);
  }

  if (declining.length > 0) {
    const categories = declining.map(s => s.category).join(', ');
    insights.push(`Consider reviewing: ${categories}`);
  }

  // Strongest/weakest insights
  if (summary.strongestCategory && summary.weakestCategory) {
    if (summary.strongestCategory !== summary.weakestCategory) {
      insights.push(`Strongest area: ${summary.strongestCategory}`);
      insights.push(`Focus area: ${summary.weakestCategory}`);
    }
  }

  // Activity level
  if (summary.totalQuestionsAttempted < 10) {
    insights.push('Complete more questions for better skill estimates.');
  }

  return insights;
}
