/**
 * Tests for Adaptive Question Selection
 *
 * Sprint 8 - Adaptive Difficulty
 */

import { describe, it, expect } from 'vitest';
import {
  calculateQuestionWeight,
  selectAdaptiveQuestions,
  getDifficultyDistribution,
  getAverageDifficulty,
  validateQuestionsForAdaptive,
} from './questionSelector';
import { Question } from '../quiz-engine/schema';
import { SkillLevels, createSkillLevel } from './eloRating';

// Helper to create test questions
function createQuestion(id: string, difficulty: number, category: string = 'general'): Question {
  return {
    id,
    type: 'multiple_choice_single',
    text: `Question ${id}`,
    choices: ['A', 'B', 'C', 'D'],
    correct: [0],
    meta: { difficulty, category }
  };
}

describe('Question Selector - calculateQuestionWeight', () => {
  it('should return highest weight for questions matching user skill level', () => {
    const userSkills: SkillLevels = {
      general: createSkillLevel('general', 3.0)
    };

    const exactMatch = createQuestion('q1', 3, 'general');
    const oneLower = createQuestion('q2', 2, 'general');
    const oneHigher = createQuestion('q3', 4, 'general');

    const weightExact = calculateQuestionWeight(exactMatch, userSkills);
    const weightLower = calculateQuestionWeight(oneLower, userSkills);
    const weightHigher = calculateQuestionWeight(oneHigher, userSkills);

    expect(weightExact).toBeGreaterThan(weightLower);
    expect(weightExact).toBeGreaterThan(weightHigher);
  });

  it('should return lower weight for questions far from user skill level', () => {
    const userSkills: SkillLevels = {
      general: createSkillLevel('general', 3.0)
    };

    const veryEasy = createQuestion('q1', 1, 'general');
    const veryHard = createQuestion('q2', 5, 'general');
    const appropriate = createQuestion('q3', 3, 'general');

    const weightEasy = calculateQuestionWeight(veryEasy, userSkills);
    const weightHard = calculateQuestionWeight(veryHard, userSkills);
    const weightAppropriate = calculateQuestionWeight(appropriate, userSkills);

    expect(weightAppropriate).toBeGreaterThan(weightEasy);
    expect(weightAppropriate).toBeGreaterThan(weightHard);
  });

  it('should use default skill level 2.5 for unknown categories', () => {
    const userSkills: SkillLevels = {
      math: createSkillLevel('math', 4.0)
    };

    const scienceQuestion = createQuestion('q1', 2, 'science');
    const weight = calculateQuestionWeight(scienceQuestion, userSkills);

    // Should use default 2.5, so difficulty 2 should have reasonable weight
    expect(weight).toBeGreaterThan(0);
  });

  it('should use default difficulty 3 for questions without metadata', () => {
    const userSkills: SkillLevels = {
      general: createSkillLevel('general', 3.0)
    };

    const questionWithoutDifficulty: Question = {
      id: 'q1',
      type: 'true_false',
      text: 'Test',
      correct: true
    };

    const weight = calculateQuestionWeight(questionWithoutDifficulty, userSkills);
    expect(weight).toBeGreaterThan(0);
  });

  it('should boost easier questions when target accuracy > 0.7', () => {
    const userSkills: SkillLevels = {
      general: createSkillLevel('general', 3.0)
    };

    const easierQuestion = createQuestion('q1', 2, 'general');

    const normalWeight = calculateQuestionWeight(easierQuestion, userSkills, 0.7);
    const boostWeight = calculateQuestionWeight(easierQuestion, userSkills, 0.8);

    expect(boostWeight).toBeGreaterThan(normalWeight);
  });

  it('should boost harder questions when target accuracy < 0.7', () => {
    const userSkills: SkillLevels = {
      general: createSkillLevel('general', 3.0)
    };

    const harderQuestion = createQuestion('q1', 4, 'general');

    const normalWeight = calculateQuestionWeight(harderQuestion, userSkills, 0.7);
    const boostWeight = calculateQuestionWeight(harderQuestion, userSkills, 0.6);

    expect(boostWeight).toBeGreaterThan(normalWeight);
  });
});

describe('Question Selector - selectAdaptiveQuestions', () => {
  it('should select requested number of questions', () => {
    const questions = [
      { question: createQuestion('q1', 1, 'math'), compositeKey: 'quiz::q1' },
      { question: createQuestion('q2', 2, 'math'), compositeKey: 'quiz::q2' },
      { question: createQuestion('q3', 3, 'math'), compositeKey: 'quiz::q3' },
      { question: createQuestion('q4', 4, 'math'), compositeKey: 'quiz::q4' },
      { question: createQuestion('q5', 5, 'math'), compositeKey: 'quiz::q5' },
    ];

    const userSkills: SkillLevels = {
      math: createSkillLevel('math', 3.0)
    };

    const selected = selectAdaptiveQuestions(questions, userSkills, 3);

    expect(selected).toHaveLength(3);
  });

  it('should return all questions if count >= total', () => {
    const questions = [
      { question: createQuestion('q1', 1), compositeKey: 'quiz::q1' },
      { question: createQuestion('q2', 2), compositeKey: 'quiz::q2' },
    ];

    const userSkills: SkillLevels = {
      general: createSkillLevel('general', 3.0)
    };

    const selected = selectAdaptiveQuestions(questions, userSkills, 10);

    expect(selected).toHaveLength(2);
  });

  it('should prefer questions near user skill level', () => {
    // Create 100 questions with varied difficulties
    const questions = [];
    for (let i = 1; i <= 100; i++) {
      const difficulty = ((i - 1) % 5) + 1; // Cycle through 1-5
      questions.push({
        question: createQuestion(`q${i}`, difficulty, 'math'),
        compositeKey: `quiz::q${i}`
      });
    }

    const userSkills: SkillLevels = {
      math: createSkillLevel('math', 3.0)
    };

    const selected = selectAdaptiveQuestions(questions, userSkills, 20, 0.7, false);

    // Count how many are difficulty 3 (at skill level)
    const atLevel = selected.filter(q => q.question.meta?.difficulty === 3).length;

    // Should have more at level 3 than far away levels
    expect(atLevel).toBeGreaterThan(3);
  });

  it('should handle empty question list', () => {
    const selected = selectAdaptiveQuestions([], {}, 10);
    expect(selected).toHaveLength(0);
  });

  it('should randomize order when requested', () => {
    const questions = [
      { question: createQuestion('q1', 3), compositeKey: 'quiz::q1' },
      { question: createQuestion('q2', 3), compositeKey: 'quiz::q2' },
      { question: createQuestion('q3', 3), compositeKey: 'quiz::q3' },
      { question: createQuestion('q4', 3), compositeKey: 'quiz::q4' },
      { question: createQuestion('q5', 3), compositeKey: 'quiz::q5' },
    ];

    const userSkills: SkillLevels = {
      general: createSkillLevel('general', 3.0)
    };

    // Run selection multiple times
    const orders: string[] = [];
    for (let i = 0; i < 10; i++) {
      const selected = selectAdaptiveQuestions(questions, userSkills, 5, 0.7, true);
      orders.push(selected.map(q => q.compositeKey).join(','));
    }

    // Should have multiple different orders (not all the same)
    const uniqueOrders = new Set(orders);
    expect(uniqueOrders.size).toBeGreaterThan(1);
  });

  it('should not have duplicates in selection', () => {
    const questions = Array.from({ length: 20 }, (_, i) => ({
      question: createQuestion(`q${i}`, ((i % 5) + 1), 'general'),
      compositeKey: `quiz::q${i}`
    }));

    const userSkills: SkillLevels = {
      general: createSkillLevel('general', 3.0)
    };

    const selected = selectAdaptiveQuestions(questions, userSkills, 10);

    const keys = selected.map(q => q.compositeKey);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});

describe('Question Selector - getDifficultyDistribution', () => {
  it('should count questions by difficulty level', () => {
    const questions = [
      createQuestion('q1', 1),
      createQuestion('q2', 1),
      createQuestion('q3', 2),
      createQuestion('q4', 3),
      createQuestion('q5', 3),
      createQuestion('q6', 3),
    ];

    const distribution = getDifficultyDistribution(questions);

    expect(distribution.get(1)).toBe(2);
    expect(distribution.get(2)).toBe(1);
    expect(distribution.get(3)).toBe(3);
    expect(distribution.get(4)).toBeUndefined();
  });

  it('should use default difficulty 3 for questions without metadata', () => {
    const questions: Question[] = [
      createQuestion('q1', 1),
      {
        id: 'q2',
        type: 'true_false',
        text: 'Test',
        correct: true
      }
    ];

    const distribution = getDifficultyDistribution(questions);

    expect(distribution.get(1)).toBe(1);
    expect(distribution.get(3)).toBe(1);
  });

  it('should handle empty array', () => {
    const distribution = getDifficultyDistribution([]);
    expect(distribution.size).toBe(0);
  });
});

describe('Question Selector - getAverageDifficulty', () => {
  it('should calculate average difficulty', () => {
    const questions = [
      createQuestion('q1', 2),
      createQuestion('q2', 3),
      createQuestion('q3', 4),
    ];

    const average = getAverageDifficulty(questions);
    expect(average).toBe(3);
  });

  it('should return 3 for empty array', () => {
    const average = getAverageDifficulty([]);
    expect(average).toBe(3);
  });

  it('should use default difficulty 3 for questions without metadata', () => {
    const questions: Question[] = [
      createQuestion('q1', 5),
      {
        id: 'q2',
        type: 'true_false',
        text: 'Test',
        correct: true
      }
    ];

    const average = getAverageDifficulty(questions);
    expect(average).toBe(4); // (5 + 3) / 2
  });
});

describe('Question Selector - validateQuestionsForAdaptive', () => {
  it('should return valid for questions with full metadata', () => {
    const questions = [
      createQuestion('q1', 2, 'math'),
      createQuestion('q2', 3, 'science'),
    ];

    const result = validateQuestionsForAdaptive(questions);

    expect(result.valid).toBe(true);
    expect(result.missingDifficulty).toBe(0);
    expect(result.missingCategory).toBe(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should detect missing difficulty', () => {
    const questions: Question[] = [
      createQuestion('q1', 2, 'math'),
      {
        id: 'q2',
        type: 'true_false',
        text: 'Test',
        correct: true,
        meta: { category: 'science' }
      }
    ];

    const result = validateQuestionsForAdaptive(questions);

    expect(result.missingDifficulty).toBe(1);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('difficulty');
  });

  it('should detect missing category', () => {
    const questions: Question[] = [
      createQuestion('q1', 2, 'math'),
      {
        id: 'q2',
        type: 'true_false',
        text: 'Test',
        correct: true,
        meta: { difficulty: 3 }
      }
    ];

    const result = validateQuestionsForAdaptive(questions);

    expect(result.missingCategory).toBe(1);
    expect(result.warnings.some(w => w.includes('category'))).toBe(true);
  });

  it('should be invalid if ALL questions missing difficulty', () => {
    const questions: Question[] = [
      {
        id: 'q1',
        type: 'true_false',
        text: 'Test 1',
        correct: true
      },
      {
        id: 'q2',
        type: 'true_false',
        text: 'Test 2',
        correct: false
      }
    ];

    const result = validateQuestionsForAdaptive(questions);

    expect(result.valid).toBe(false);
    expect(result.missingDifficulty).toBe(2);
  });

  it('should be valid if at least some questions have difficulty', () => {
    const questions: Question[] = [
      createQuestion('q1', 2, 'math'),
      {
        id: 'q2',
        type: 'true_false',
        text: 'Test',
        correct: true
      }
    ];

    const result = validateQuestionsForAdaptive(questions);

    expect(result.valid).toBe(true);
  });

  it('should handle empty array', () => {
    const result = validateQuestionsForAdaptive([]);

    expect(result.valid).toBe(false);
    expect(result.missingDifficulty).toBe(0);
    expect(result.missingCategory).toBe(0);
  });
});
