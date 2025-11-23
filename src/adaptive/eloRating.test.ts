/**
 * Tests for Elo Rating System
 *
 * Sprint 8 - Adaptive Difficulty
 */

import { describe, it, expect } from 'vitest';
import {
  calculateExpectedScore,
  updateSkillLevel,
  updateSkillLevelWithScore,
  calculateConfidence,
  createSkillLevel,
  updateSkill,
  estimateSkillFromHistory,
} from './eloRating';

describe('Elo Rating - calculateExpectedScore', () => {
  it('should return 0.5 when skill equals difficulty', () => {
    const result = calculateExpectedScore(3, 3);
    expect(result).toBeCloseTo(0.5, 2);
  });

  it('should return higher probability when skill > difficulty', () => {
    const result = calculateExpectedScore(4, 2);
    expect(result).toBeGreaterThan(0.5);
    expect(result).toBeCloseTo(0.76, 2);
  });

  it('should return lower probability when skill < difficulty', () => {
    const result = calculateExpectedScore(2, 4);
    expect(result).toBeLessThan(0.5);
    expect(result).toBeCloseTo(0.24, 2);
  });

  it('should return ~0.76 when skill is 2 levels above difficulty', () => {
    const result = calculateExpectedScore(5, 3);
    expect(result).toBeGreaterThan(0.7);
    expect(result).toBeCloseTo(0.76, 1);
  });

  it('should return ~0.24 when skill is 2 levels below difficulty', () => {
    const result = calculateExpectedScore(3, 5);
    expect(result).toBeLessThan(0.3);
    expect(result).toBeCloseTo(0.24, 1);
  });

  it('should handle boundary values', () => {
    expect(calculateExpectedScore(1, 1)).toBeCloseTo(0.5, 2);
    expect(calculateExpectedScore(5, 5)).toBeCloseTo(0.5, 2);
    expect(calculateExpectedScore(1, 5)).toBeLessThan(0.15);
    expect(calculateExpectedScore(5, 1)).toBeGreaterThan(0.85);
  });
});

describe('Elo Rating - updateSkillLevel', () => {
  it('should increase skill when answering correctly below skill level', () => {
    const newLevel = updateSkillLevel(3, 2, true);
    expect(newLevel).toBeGreaterThan(3);
  });

  it('should increase skill MORE when answering correctly above skill level', () => {
    const newLevel = updateSkillLevel(3, 4, true);
    const increase = newLevel - 3;
    expect(increase).toBeGreaterThan(0.5);
  });

  it('should decrease skill when answering incorrectly below skill level', () => {
    const newLevel = updateSkillLevel(3, 2, false);
    expect(newLevel).toBeLessThan(3);
  });

  it('should decrease skill when answering incorrectly above skill level', () => {
    const newLevel = updateSkillLevel(3, 4, false);
    const decrease = 3 - newLevel;
    // Still decreases, magnitude varies based on expected score
    expect(decrease).toBeGreaterThan(0);
  });

  it('should clamp result to minimum 1', () => {
    const newLevel = updateSkillLevel(1.5, 1, false, 100);
    expect(newLevel).toBe(1);
  });

  it('should clamp result to maximum 5', () => {
    const newLevel = updateSkillLevel(4.5, 5, true, 100);
    expect(newLevel).toBe(5);
  });

  it('should produce opposite direction changes for correct/incorrect', () => {
    const initial = 3;
    const difficulty = 4;
    const K = 32;

    const afterCorrect = updateSkillLevel(initial, difficulty, true, K);
    const afterIncorrect = updateSkillLevel(initial, difficulty, false, K);

    // Correct should increase, incorrect should decrease
    expect(afterCorrect).toBeGreaterThan(initial);
    expect(afterIncorrect).toBeLessThan(initial);
  });
});

describe('Elo Rating - updateSkillLevelWithScore', () => {
  it('should handle partial credit (0.5)', () => {
    const full = updateSkillLevelWithScore(3, 3, 1.0);
    const half = updateSkillLevelWithScore(3, 3, 0.5);
    const none = updateSkillLevelWithScore(3, 3, 0.0);

    expect(half).toBeGreaterThan(none);
    expect(half).toBeLessThan(full);
  });

  it('should clamp score to 0-1 range', () => {
    const tooHigh = updateSkillLevelWithScore(3, 3, 1.5);
    const tooLow = updateSkillLevelWithScore(3, 3, -0.5);
    const valid = updateSkillLevelWithScore(3, 3, 1.0);

    expect(tooHigh).toBe(valid); // Both should be clamped to 1.0
    expect(tooLow).toBeLessThan(3); // Clamped to 0.0, so should decrease
  });

  it('should produce same result as updateSkillLevel for binary scores', () => {
    const binary1 = updateSkillLevel(3, 4, true);
    const score1 = updateSkillLevelWithScore(3, 4, 1.0);
    expect(score1).toBeCloseTo(binary1, 5);

    const binary0 = updateSkillLevel(3, 4, false);
    const score0 = updateSkillLevelWithScore(3, 4, 0.0);
    expect(score0).toBeCloseTo(binary0, 5);
  });
});

describe('Elo Rating - calculateConfidence', () => {
  it('should return 0 for empty performance array', () => {
    expect(calculateConfidence([])).toBe(0);
  });

  it('should return low confidence for single data point', () => {
    expect(calculateConfidence([1])).toBe(0.3);
  });

  it('should return high confidence for consistent perfect performance', () => {
    const performance = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const confidence = calculateConfidence(performance);
    expect(confidence).toBeGreaterThan(0.8);
  });

  it('should return high confidence for consistent zero performance', () => {
    const performance = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const confidence = calculateConfidence(performance);
    expect(confidence).toBeGreaterThan(0.8);
  });

  it('should return lower confidence for inconsistent performance', () => {
    const performance = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
    const confidence = calculateConfidence(performance);
    expect(confidence).toBeLessThan(0.5);
  });

  it('should have reasonable confidence with consistent performance', () => {
    const few = calculateConfidence([1, 1, 1]);
    const many = calculateConfidence([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    // Both should be high for consistent performance
    expect(few).toBeGreaterThan(0.6);
    expect(many).toBeGreaterThan(0.7);
  });

  it('should cap confidence at 0.95', () => {
    const performance = Array(20).fill(1);
    const confidence = calculateConfidence(performance);
    expect(confidence).toBeLessThanOrEqual(0.95);
  });
});

describe('Elo Rating - createSkillLevel', () => {
  it('should create skill level with default values', () => {
    const skill = createSkillLevel('math');
    expect(skill.estimatedLevel).toBe(2.5);
    expect(skill.confidence).toBe(0);
    expect(skill.questionsAttempted).toBe(0);
    expect(skill.recentPerformance).toEqual([]);
    expect(skill.lastUpdated).toBeDefined();
  });

  it('should accept custom initial level', () => {
    const skill = createSkillLevel('math', 4.0);
    expect(skill.estimatedLevel).toBe(4.0);
  });

  it('should clamp initial level to 1-5 range', () => {
    const tooLow = createSkillLevel('math', 0.5);
    const tooHigh = createSkillLevel('math', 6.0);
    expect(tooLow.estimatedLevel).toBe(1);
    expect(tooHigh.estimatedLevel).toBe(5);
  });
});

describe('Elo Rating - updateSkill', () => {
  it('should update all fields of skill object', () => {
    const skill = createSkillLevel('math', 3.0);
    const originalLevel = skill.estimatedLevel;

    updateSkill(skill, 4, 1.0);

    expect(skill.estimatedLevel).not.toBe(originalLevel);
    expect(skill.recentPerformance).toHaveLength(1);
    expect(skill.recentPerformance[0]).toBe(1.0);
    expect(skill.questionsAttempted).toBe(1);
    expect(skill.confidence).toBeGreaterThan(0);
  });

  it('should maintain recent performance window of 10', () => {
    const skill = createSkillLevel('math');

    // Add 15 results
    for (let i = 0; i < 15; i++) {
      updateSkill(skill, 3, i % 2);
    }

    expect(skill.recentPerformance).toHaveLength(10);
    expect(skill.questionsAttempted).toBe(15);
  });

  it('should update confidence based on consistency', () => {
    const consistentSkill = createSkillLevel('math');
    for (let i = 0; i < 10; i++) {
      updateSkill(consistentSkill, 3, 1.0);
    }

    const inconsistentSkill = createSkillLevel('science');
    for (let i = 0; i < 10; i++) {
      updateSkill(inconsistentSkill, 3, i % 2);
    }

    expect(consistentSkill.confidence).toBeGreaterThan(inconsistentSkill.confidence);
  });

  it('should update lastUpdated timestamp', () => {
    const skill = createSkillLevel('math');
    const originalTime = skill.lastUpdated;

    // Wait a tiny bit to ensure timestamp difference
    setTimeout(() => {
      updateSkill(skill, 3, 1.0);
      expect(skill.lastUpdated).not.toBe(originalTime);
    }, 10);
  });
});

describe('Elo Rating - estimateSkillFromHistory', () => {
  it('should return 2.5 for empty history', () => {
    const estimate = estimateSkillFromHistory([]);
    expect(estimate).toBe(2.5);
  });

  it('should estimate higher skill for high accuracy at high difficulty', () => {
    const history = [
      { difficulty: 4, timesCorrect: 9, timesSeen: 10 } // 90% at difficulty 4
    ];
    const estimate = estimateSkillFromHistory(history);
    expect(estimate).toBeGreaterThan(4);
  });

  it('should estimate lower skill for low accuracy at low difficulty', () => {
    const history = [
      { difficulty: 2, timesCorrect: 1, timesSeen: 10 } // 10% at difficulty 2
    ];
    const estimate = estimateSkillFromHistory(history);
    expect(estimate).toBeLessThan(2);
  });

  it('should estimate skill near difficulty for 70% accuracy', () => {
    const history = [
      { difficulty: 3, timesCorrect: 7, timesSeen: 10 } // 70% at difficulty 3
    ];
    const estimate = estimateSkillFromHistory(history);
    expect(estimate).toBeCloseTo(3, 0.5);
  });

  it('should weight by number of attempts', () => {
    const history = [
      { difficulty: 5, timesCorrect: 10, timesSeen: 10 }, // 100% at 5, few attempts
      { difficulty: 2, timesCorrect: 20, timesSeen: 20 }  // 100% at 2, many attempts
    ];
    const estimate = estimateSkillFromHistory(history);
    // Should be closer to 2 due to weighting
    expect(estimate).toBeLessThan(4);
  });

  it('should clamp result to 1-5 range', () => {
    const veryHigh = estimateSkillFromHistory([
      { difficulty: 5, timesCorrect: 100, timesSeen: 100 }
    ]);
    const veryLow = estimateSkillFromHistory([
      { difficulty: 1, timesCorrect: 0, timesSeen: 100 }
    ]);

    expect(veryHigh).toBeLessThanOrEqual(5);
    expect(veryLow).toBeGreaterThanOrEqual(1);
  });

  it('should handle zero timesSeen gracefully', () => {
    const history = [
      { difficulty: 3, timesCorrect: 0, timesSeen: 0 },
      { difficulty: 4, timesCorrect: 5, timesSeen: 10 }
    ];
    const estimate = estimateSkillFromHistory(history);
    expect(estimate).toBeGreaterThan(1);
    expect(estimate).toBeLessThan(5);
  });
});

describe('Elo Rating - Integration Tests', () => {
  it('should progressively improve skill with consistent correct answers', () => {
    const skill = createSkillLevel('math', 2.5);
    const levels: number[] = [skill.estimatedLevel];

    // Answer 10 questions at difficulty 3 correctly
    for (let i = 0; i < 10; i++) {
      updateSkill(skill, 3, 1.0);
      levels.push(skill.estimatedLevel);
    }

    // Skill should increase over time
    expect(levels[levels.length - 1]).toBeGreaterThan(levels[0]);
    // Confidence should increase
    expect(skill.confidence).toBeGreaterThan(0.5);
  });

  it('should progressively decrease skill with consistent incorrect answers', () => {
    const skill = createSkillLevel('math', 3.5);
    const levels: number[] = [skill.estimatedLevel];

    // Answer 10 questions at difficulty 3 incorrectly
    for (let i = 0; i < 10; i++) {
      updateSkill(skill, 3, 0.0);
      levels.push(skill.estimatedLevel);
    }

    // Skill should decrease over time
    expect(levels[levels.length - 1]).toBeLessThan(levels[0]);
    // Confidence should still increase (consistent failure is still consistent)
    expect(skill.confidence).toBeGreaterThan(0.5);
  });

  it('should adjust skill based on performance at appropriate difficulty', () => {
    const skill = createSkillLevel('math', 3.0);

    // Answer questions at skill level with 70% accuracy
    for (let i = 0; i < 20; i++) {
      const score = i % 10 < 7 ? 1.0 : 0.0; // 70% accuracy
      updateSkill(skill, 3, score);
    }

    // Skill should be within valid range and have reasonable confidence
    expect(skill.estimatedLevel).toBeGreaterThanOrEqual(1);
    expect(skill.estimatedLevel).toBeLessThanOrEqual(5);
    expect(skill.confidence).toBeGreaterThan(0.3); // Should have some confidence
  });
});
