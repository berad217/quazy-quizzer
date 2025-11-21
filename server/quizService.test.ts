import { describe, it, expect, beforeAll } from 'vitest';
import { loadQuizzes, getQuizById, getQuizzesByTags } from './quizService.js';
import type { QuizRegistry } from '../src/quiz-engine/schema.js';

describe('Quiz Service', () => {
  let registry: QuizRegistry;

  beforeAll(async () => {
    // Load quizzes from the actual quizzes folder
    registry = await loadQuizzes('./quizzes');
  });

  describe('loadQuizzes', () => {
    it('should load quizzes from the quizzes folder', () => {
      expect(registry).toBeDefined();
      expect(registry.all).toBeInstanceOf(Array);
      expect(registry.byId).toBeInstanceOf(Object);
    });

    it('should load at least one quiz', () => {
      // We created sample_basics.v1.json and programming_basics.v1.json
      expect(registry.all.length).toBeGreaterThan(0);
    });

    it('should create registry with byId lookup', () => {
      expect(Object.keys(registry.byId).length).toBeGreaterThan(0);
    });

    it('should have matching counts in all and byId', () => {
      expect(registry.all.length).toBe(Object.keys(registry.byId).length);
    });

    it('should load sample_basics quiz', () => {
      const quiz = registry.byId['sample_basics_v1'];
      expect(quiz).toBeDefined();
      expect(quiz.id).toBe('sample_basics_v1');
      expect(quiz.title).toBe('Sample Quiz - Basics');
    });

    it('should load programming_basics quiz', () => {
      const quiz = registry.byId['programming_basics_v1'];
      expect(quiz).toBeDefined();
      expect(quiz.id).toBe('programming_basics_v1');
      expect(quiz.title).toBe('Programming Basics');
    });

    it('should load questions for each quiz', () => {
      registry.all.forEach(quiz => {
        expect(quiz.questions).toBeDefined();
        expect(quiz.questions.length).toBeGreaterThan(0);
      });
    });

    it('should include all question types in sample_basics', () => {
      const quiz = registry.byId['sample_basics_v1'];
      expect(quiz).toBeDefined();

      const types = quiz.questions.map(q => q.type);
      expect(types).toContain('multiple_choice_single');
      expect(types).toContain('multiple_choice_multi');
      expect(types).toContain('true_false');
      expect(types).toContain('fill_in_blank');
      expect(types).toContain('short_answer');
    });

    it('should preserve quiz metadata', () => {
      const quiz = registry.byId['sample_basics_v1'];
      expect(quiz.tags).toContain('sample');
      expect(quiz.version).toBe(1);
      expect(quiz.author).toBe('local');
    });

    it('should handle non-existent quiz folder gracefully', async () => {
      const emptyRegistry = await loadQuizzes('./nonexistent-folder');
      expect(emptyRegistry.all).toHaveLength(0);
      expect(Object.keys(emptyRegistry.byId)).toHaveLength(0);
    });
  });

  describe('getQuizById', () => {
    it('should return quiz when found', () => {
      const quiz = getQuizById(registry, 'sample_basics_v1');
      expect(quiz).toBeDefined();
      expect(quiz?.id).toBe('sample_basics_v1');
    });

    it('should return undefined when not found', () => {
      const quiz = getQuizById(registry, 'nonexistent_quiz');
      expect(quiz).toBeUndefined();
    });
  });

  describe('getQuizzesByTags', () => {
    it('should return quizzes with matching tags', () => {
      const quizzes = getQuizzesByTags(registry, ['sample']);
      expect(quizzes.length).toBeGreaterThan(0);
      expect(quizzes[0].tags).toContain('sample');
    });

    it('should return empty array when no matches', () => {
      const quizzes = getQuizzesByTags(registry, ['nonexistent-tag']);
      expect(quizzes).toHaveLength(0);
    });

    it('should match any of the provided tags', () => {
      const quizzes = getQuizzesByTags(registry, ['sample', 'programming']);
      expect(quizzes.length).toBeGreaterThan(0);
    });

    it('should not return quizzes without tags', () => {
      const allQuizzes = registry.all;
      const quizzesWithoutTags = allQuizzes.filter(q => !q.tags || q.tags.length === 0);

      if (quizzesWithoutTags.length > 0) {
        const quizzes = getQuizzesByTags(registry, ['sample']);
        quizzesWithoutTags.forEach(quizWithoutTag => {
          expect(quizzes).not.toContain(quizWithoutTag);
        });
      }
    });
  });

  describe('Question structure validation', () => {
    it('should have valid multiple_choice_single questions', () => {
      const quiz = registry.byId['sample_basics_v1'];
      const mcQuestion = quiz.questions.find(q => q.type === 'multiple_choice_single');

      expect(mcQuestion).toBeDefined();
      if (mcQuestion && mcQuestion.type === 'multiple_choice_single') {
        expect(mcQuestion.choices).toBeInstanceOf(Array);
        expect(mcQuestion.choices.length).toBeGreaterThan(0);
        expect(mcQuestion.correct).toBeInstanceOf(Array);
        expect(mcQuestion.correct.length).toBeGreaterThan(0);
      }
    });

    it('should have valid true_false questions', () => {
      const quiz = registry.byId['sample_basics_v1'];
      const tfQuestion = quiz.questions.find(q => q.type === 'true_false');

      expect(tfQuestion).toBeDefined();
      if (tfQuestion && tfQuestion.type === 'true_false') {
        expect(typeof tfQuestion.correct).toBe('boolean');
      }
    });

    it('should have valid fill_in_blank questions', () => {
      const quiz = registry.byId['sample_basics_v1'];
      const fibQuestion = quiz.questions.find(q => q.type === 'fill_in_blank');

      expect(fibQuestion).toBeDefined();
      if (fibQuestion && fibQuestion.type === 'fill_in_blank') {
        expect(fibQuestion.acceptableAnswers).toBeInstanceOf(Array);
        expect(fibQuestion.acceptableAnswers.length).toBeGreaterThan(0);
      }
    });

    it('should have valid question metadata', () => {
      const quiz = registry.byId['sample_basics_v1'];
      quiz.questions.forEach(question => {
        expect(question.id).toBeDefined();
        expect(typeof question.id).toBe('string');
        expect(question.type).toBeDefined();
        expect(question.text).toBeDefined();
        expect(typeof question.text).toBe('string');
      });
    });
  });
});
