import { describe, it, expect } from 'vitest';
import { validateQuiz, filterValidQuestions } from './validator.js';
import type { RawQuizData } from './schema.js';

describe('Quiz Validator', () => {
  describe('validateQuiz', () => {
    it('should validate a valid quiz', () => {
      const validQuiz: RawQuizData = {
        id: 'test_quiz',
        title: 'Test Quiz',
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice_single',
            text: 'Test question?',
            choices: ['A', 'B', 'C'],
            correct: [0],
          },
        ],
      };

      const result = validateQuiz(validQuiz);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject quiz without id', () => {
      const invalidQuiz: RawQuizData = {
        title: 'Test Quiz',
        questions: [
          {
            id: 'q1',
            type: 'true_false',
            text: 'Test?',
            correct: true,
          },
        ],
      };

      const result = validateQuiz(invalidQuiz);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'id')).toBe(true);
    });

    it('should reject quiz without title', () => {
      const invalidQuiz: RawQuizData = {
        id: 'test',
        questions: [
          {
            id: 'q1',
            type: 'true_false',
            text: 'Test?',
            correct: true,
          },
        ],
      };

      const result = validateQuiz(invalidQuiz);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('should reject quiz with empty questions array', () => {
      const invalidQuiz: RawQuizData = {
        id: 'test',
        title: 'Test',
        questions: [],
      };

      const result = validateQuiz(invalidQuiz);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'questions')).toBe(true);
    });

    it('should reject quiz without questions array', () => {
      const invalidQuiz: RawQuizData = {
        id: 'test',
        title: 'Test',
      };

      const result = validateQuiz(invalidQuiz);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'questions')).toBe(true);
    });

    it('should detect duplicate question IDs', () => {
      const quizWithDuplicates: RawQuizData = {
        id: 'test',
        title: 'Test',
        questions: [
          {
            id: 'q1',
            type: 'true_false',
            text: 'Test 1?',
            correct: true,
          },
          {
            id: 'q1',
            type: 'true_false',
            text: 'Test 2?',
            correct: false,
          },
        ],
      };

      const result = validateQuiz(quizWithDuplicates);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Duplicate question id'))).toBe(true);
    });

    it('should warn about unknown question types', () => {
      const quizWithUnknownType: RawQuizData = {
        id: 'test',
        title: 'Test',
        questions: [
          {
            id: 'q1',
            type: 'unknown_type',
            text: 'Test?',
          },
        ],
      };

      const result = validateQuiz(quizWithUnknownType);
      expect(result.valid).toBe(false);
      expect(result.warnings.some(w => w.message.includes('Unknown question type'))).toBe(true);
    });

    it('should handle optional fields gracefully', () => {
      const quizWithOptionals: RawQuizData = {
        id: 'test',
        title: 'Test',
        description: 'A test quiz',
        tags: ['test', 'sample'],
        version: 1,
        author: 'tester',
        allowRandomSubset: true,
        defaultQuestionCount: 10,
        questions: [
          {
            id: 'q1',
            type: 'true_false',
            text: 'Test?',
            correct: true,
            explanation: 'Test explanation',
            meta: {
              difficulty: 1,
              category: 'test',
            },
          },
        ],
      };

      const result = validateQuiz(quizWithOptionals);
      expect(result.valid).toBe(true);
    });

    it('should warn about invalid optional field types', () => {
      const quizWithInvalidOptionals: RawQuizData = {
        id: 'test',
        title: 'Test',
        tags: 'not-an-array',
        version: 'not-a-number',
        defaultQuestionCount: 'not-a-number',
        questions: [
          {
            id: 'q1',
            type: 'true_false',
            text: 'Test?',
            correct: true,
          },
        ],
      };

      const result = validateQuiz(quizWithInvalidOptionals);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Choice Single validation', () => {
    it('should validate valid multiple choice single question', () => {
      const quiz: RawQuizData = {
        id: 'test',
        title: 'Test',
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice_single',
            text: 'Pick one',
            choices: ['A', 'B', 'C'],
            correct: [1],
          },
        ],
      };

      const result = validateQuiz(quiz);
      expect(result.valid).toBe(true);
    });

    it('should reject multiple choice without choices', () => {
      const quiz: RawQuizData = {
        id: 'test',
        title: 'Test',
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice_single',
            text: 'Pick one',
            correct: [0],
          },
        ],
      };

      const result = validateQuiz(quiz);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('choices'))).toBe(true);
    });

    it('should reject multiple choice with out-of-range correct index', () => {
      const quiz: RawQuizData = {
        id: 'test',
        title: 'Test',
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice_single',
            text: 'Pick one',
            choices: ['A', 'B'],
            correct: [5],
          },
        ],
      };

      const result = validateQuiz(quiz);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Invalid choice index'))).toBe(true);
    });
  });

  describe('True/False validation', () => {
    it('should validate true/false question with true', () => {
      const quiz: RawQuizData = {
        id: 'test',
        title: 'Test',
        questions: [
          {
            id: 'q1',
            type: 'true_false',
            text: 'Is this true?',
            correct: true,
          },
        ],
      };

      const result = validateQuiz(quiz);
      expect(result.valid).toBe(true);
    });

    it('should validate true/false question with false', () => {
      const quiz: RawQuizData = {
        id: 'test',
        title: 'Test',
        questions: [
          {
            id: 'q1',
            type: 'true_false',
            text: 'Is this false?',
            correct: false,
          },
        ],
      };

      const result = validateQuiz(quiz);
      expect(result.valid).toBe(true);
    });

    it('should reject true/false without boolean correct', () => {
      const quiz: RawQuizData = {
        id: 'test',
        title: 'Test',
        questions: [
          {
            id: 'q1',
            type: 'true_false',
            text: 'Is this?',
            correct: 'yes',
          },
        ],
      };

      const result = validateQuiz(quiz);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('boolean'))).toBe(true);
    });
  });

  describe('Fill in Blank validation', () => {
    it('should validate fill-in-blank with string answers', () => {
      const quiz: RawQuizData = {
        id: 'test',
        title: 'Test',
        questions: [
          {
            id: 'q1',
            type: 'fill_in_blank',
            text: 'Fill in ____',
            acceptableAnswers: ['answer1', 'answer2'],
          },
        ],
      };

      const result = validateQuiz(quiz);
      expect(result.valid).toBe(true);
    });

    it('should validate fill-in-blank with object answers', () => {
      const quiz: RawQuizData = {
        id: 'test',
        title: 'Test',
        questions: [
          {
            id: 'q1',
            type: 'fill_in_blank',
            text: 'Fill in ____',
            acceptableAnswers: [
              'answer1',
              { value: 'answer2', normalize: true },
            ],
          },
        ],
      };

      const result = validateQuiz(quiz);
      expect(result.valid).toBe(true);
    });

    it('should reject fill-in-blank without acceptableAnswers', () => {
      const quiz: RawQuizData = {
        id: 'test',
        title: 'Test',
        questions: [
          {
            id: 'q1',
            type: 'fill_in_blank',
            text: 'Fill in ____',
          },
        ],
      };

      const result = validateQuiz(quiz);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('acceptableAnswers'))).toBe(true);
    });
  });

  describe('Short Answer validation', () => {
    it('should validate short answer with optional correct', () => {
      const quiz: RawQuizData = {
        id: 'test',
        title: 'Test',
        questions: [
          {
            id: 'q1',
            type: 'short_answer',
            text: 'Explain this',
            correct: 'Sample answer',
          },
        ],
      };

      const result = validateQuiz(quiz);
      expect(result.valid).toBe(true);
    });

    it('should validate short answer without correct field', () => {
      const quiz: RawQuizData = {
        id: 'test',
        title: 'Test',
        questions: [
          {
            id: 'q1',
            type: 'short_answer',
            text: 'Explain this',
          },
        ],
      };

      const result = validateQuiz(quiz);
      expect(result.valid).toBe(true);
    });
  });

  describe('filterValidQuestions', () => {
    it('should filter out questions with unknown types', () => {
      const questions = [
        {
          id: 'q1',
          type: 'true_false',
          text: 'Valid?',
          correct: true,
        },
        {
          id: 'q2',
          type: 'unknown_type',
          text: 'Invalid?',
        },
        {
          id: 'q3',
          type: 'multiple_choice_single',
          text: 'Valid?',
          choices: ['A', 'B'],
          correct: [0],
        },
      ];

      const valid = filterValidQuestions(questions);
      expect(valid).toHaveLength(2);
      expect(valid[0].id).toBe('q1');
      expect(valid[1].id).toBe('q3');
    });

    it('should filter out questions with duplicate IDs', () => {
      const questions = [
        {
          id: 'q1',
          type: 'true_false',
          text: 'First?',
          correct: true,
        },
        {
          id: 'q1',
          type: 'true_false',
          text: 'Duplicate?',
          correct: false,
        },
      ];

      const valid = filterValidQuestions(questions);
      expect(valid).toHaveLength(1);
      expect(valid[0].text).toBe('First?');
    });
  });
});
