/**
 * Tests for Session Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSession,
  updateAnswer,
  gradeSession,
  completeSession,
  getSessionProgress,
  Session,
} from './session';
import {
  QuizRegistry,
  QuizSet,
  MultipleChoiceSingleQuestion,
  MultipleChoiceMultiQuestion,
  TrueFalseQuestion,
  FillInBlankQuestion,
  ShortAnswerQuestion,
} from './schema';
import { GradingConfig } from '../config/types';

// Default grading config for tests
const testGradingConfig: GradingConfig = {
  enableFuzzyMatching: true,
  fuzzyMatchThreshold: 0.8,
  enablePartialCredit: false,
  partialCreditThreshold: 0.6,
  partialCreditValue: 0.5,
};

describe('Session Engine', () => {
  let registry: QuizRegistry;

  beforeEach(() => {
    // Create test quiz sets
    const quiz1: QuizSet = {
      id: 'test_quiz_1',
      title: 'Test Quiz 1',
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice_single',
          text: 'What is 2+2?',
          choices: ['3', '4', '5'],
          correct: [1], // index 1 = "4"
        } as MultipleChoiceSingleQuestion,
        {
          id: 'q2',
          type: 'true_false',
          text: 'The sky is blue.',
          correct: true,
        } as TrueFalseQuestion,
        {
          id: 'q3',
          type: 'fill_in_blank',
          text: 'The capital of France is ________.',
          acceptableAnswers: ['Paris', 'paris'],
        } as FillInBlankQuestion,
      ],
    };

    const quiz2: QuizSet = {
      id: 'test_quiz_2',
      title: 'Test Quiz 2',
      questions: [
        {
          id: 'q4',
          type: 'multiple_choice_multi',
          text: 'Select all prime numbers:',
          choices: ['2', '3', '4', '5'],
          correct: [0, 1, 3], // 2, 3, 5
        } as MultipleChoiceMultiQuestion,
        {
          id: 'q5',
          type: 'short_answer',
          text: 'What is photosynthesis?',
          correct: 'Process where plants make food using sunlight',
        } as ShortAnswerQuestion,
        // Duplicate question ID from quiz1
        {
          id: 'q1',
          type: 'true_false',
          text: 'This is a different q1.',
          correct: false,
        } as TrueFalseQuestion,
      ],
    };

    registry = {
      byId: {
        test_quiz_1: quiz1,
        test_quiz_2: quiz2,
      },
      all: [quiz1, quiz2],
    };
  });

  describe('createSession', () => {
    it('should create a session with questions from a single quiz', () => {
      const session = createSession(registry, {
        userId: 'user1',
        selectedQuizIds: ['test_quiz_1'],
      });

      expect(session.id).toBeDefined();
      expect(session.userId).toBe('user1');
      expect(session.quizIds).toEqual(['test_quiz_1']);
      expect(session.questions).toHaveLength(3);
      expect(session.answers).toEqual({});
      expect(session.createdAt).toBeDefined();
      expect(session.completedAt).toBeUndefined();
    });

    it('should create a session with questions from multiple quizzes', () => {
      const session = createSession(registry, {
        userId: 'user1',
        selectedQuizIds: ['test_quiz_1', 'test_quiz_2'],
      });

      expect(session.questions).toHaveLength(6); // 3 from quiz1 + 3 from quiz2
      expect(session.quizIds).toEqual(['test_quiz_1', 'test_quiz_2']);
    });

    it('should create composite keys for questions', () => {
      const session = createSession(registry, {
        userId: 'user1',
        selectedQuizIds: ['test_quiz_1'],
      });

      expect(session.questions[0].compositeKey).toBe('test_quiz_1::q1');
      expect(session.questions[1].compositeKey).toBe('test_quiz_1::q2');
      expect(session.questions[2].compositeKey).toBe('test_quiz_1::q3');
    });

    it('should deduplicate questions with same composite key', () => {
      const session = createSession(registry, {
        userId: 'user1',
        selectedQuizIds: ['test_quiz_1', 'test_quiz_2'],
      });

      // Both quizzes have a question with id "q1"
      // Should only include the first one (from test_quiz_1)
      const q1Questions = session.questions.filter(
        (q) => q.questionId === 'q1'
      );
      expect(q1Questions).toHaveLength(2); // One from each quiz (different composite keys)

      // Verify composite keys are unique
      const keys = session.questions.map((q) => q.compositeKey);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);

      // Verify the q1 from test_quiz_1 comes before q1 from test_quiz_2
      const quiz1Q1Index = session.questions.findIndex(
        (q) => q.compositeKey === 'test_quiz_1::q1'
      );
      const quiz2Q1Index = session.questions.findIndex(
        (q) => q.compositeKey === 'test_quiz_2::q1'
      );
      expect(quiz1Q1Index).toBeLessThan(quiz2Q1Index);
    });

    it('should assign sequential indices to questions', () => {
      const session = createSession(registry, {
        userId: 'user1',
        selectedQuizIds: ['test_quiz_1', 'test_quiz_2'],
      });

      session.questions.forEach((q, idx) => {
        expect(q.index).toBe(idx);
      });
    });

    it('should shuffle questions when randomize is true', () => {
      // Create multiple sessions and check if at least one has different order
      const sessions = Array.from({ length: 10 }, () =>
        createSession(registry, {
          userId: 'user1',
          selectedQuizIds: ['test_quiz_1', 'test_quiz_2'],
          randomize: true,
        })
      );

      // Check that not all sessions have the same order
      const firstOrder = sessions[0].questions.map((q) => q.compositeKey).join(',');
      const hasDifferentOrder = sessions.some(
        (s) => s.questions.map((q) => q.compositeKey).join(',') !== firstOrder
      );

      // With 6 questions and 10 attempts, very unlikely to have same order every time
      expect(hasDifferentOrder).toBe(true);
    });

    it('should not shuffle when randomize is false', () => {
      const session1 = createSession(registry, {
        userId: 'user1',
        selectedQuizIds: ['test_quiz_1', 'test_quiz_2'],
        randomize: false,
      });

      const session2 = createSession(registry, {
        userId: 'user1',
        selectedQuizIds: ['test_quiz_1', 'test_quiz_2'],
        randomize: false,
      });

      const keys1 = session1.questions.map((q) => q.compositeKey);
      const keys2 = session2.questions.map((q) => q.compositeKey);

      expect(keys1).toEqual(keys2);
    });

    it('should limit questions when limit is provided', () => {
      const session = createSession(registry, {
        userId: 'user1',
        selectedQuizIds: ['test_quiz_1', 'test_quiz_2'],
        limit: 3,
      });

      expect(session.questions).toHaveLength(3);
    });

    it('should handle limit larger than available questions', () => {
      const session = createSession(registry, {
        userId: 'user1',
        selectedQuizIds: ['test_quiz_1'],
        limit: 100,
      });

      expect(session.questions).toHaveLength(3); // Only 3 questions available
    });

    it('should throw error for non-existent quiz', () => {
      expect(() =>
        createSession(registry, {
          userId: 'user1',
          selectedQuizIds: ['non_existent_quiz'],
        })
      ).toThrow('Quiz not found: non_existent_quiz');
    });
  });

  describe('updateAnswer', () => {
    let session: Session;

    beforeEach(() => {
      session = createSession(registry, {
        userId: 'user1',
        selectedQuizIds: ['test_quiz_1'],
      });
    });

    it('should store an answer for a question', () => {
      const compositeKey = 'test_quiz_1::q1';
      updateAnswer(session, compositeKey, 1);

      expect(session.answers[compositeKey]).toBeDefined();
      expect(session.answers[compositeKey].value).toBe(1);
      expect(session.answers[compositeKey].answeredAt).toBeDefined();
    });

    it('should update an existing answer', () => {
      const compositeKey = 'test_quiz_1::q1';
      updateAnswer(session, compositeKey, 0);
      const firstValue = session.answers[compositeKey].value;

      // Update again with different value
      updateAnswer(session, compositeKey, 1);
      const secondValue = session.answers[compositeKey].value;

      expect(firstValue).toBe(0);
      expect(secondValue).toBe(1);
      expect(session.answers[compositeKey].answeredAt).toBeDefined();
    });

    it('should throw error for non-existent question in session', () => {
      expect(() =>
        updateAnswer(session, 'invalid::key', 1)
      ).toThrow('Question invalid::key not found in session');
    });
  });

  describe('gradeSession', () => {
    let session: Session;

    beforeEach(() => {
      session = createSession(registry, {
        userId: 'user1',
        selectedQuizIds: ['test_quiz_1', 'test_quiz_2'],
      });
    });

    it('should grade multiple choice single correctly', () => {
      const compositeKey = 'test_quiz_1::q1';
      updateAnswer(session, compositeKey, 1); // Correct answer

      const result = gradeSession(session, testGradingConfig);

      expect(result.perQuestion[compositeKey].isCorrect).toBe(true);
      expect(session.answers[compositeKey].isCorrect).toBe(true);
    });

    it('should grade multiple choice single incorrectly', () => {
      const compositeKey = 'test_quiz_1::q1';
      updateAnswer(session, compositeKey, 0); // Wrong answer

      const result = gradeSession(session, testGradingConfig);

      expect(result.perQuestion[compositeKey].isCorrect).toBe(false);
      expect(session.answers[compositeKey].isCorrect).toBe(false);
    });

    it('should grade true/false correctly', () => {
      const compositeKey = 'test_quiz_1::q2';
      updateAnswer(session, compositeKey, true); // Correct

      const result = gradeSession(session, testGradingConfig);

      expect(result.perQuestion[compositeKey].isCorrect).toBe(true);
    });

    it('should grade true/false incorrectly', () => {
      const compositeKey = 'test_quiz_1::q2';
      updateAnswer(session, compositeKey, false); // Wrong

      const result = gradeSession(session, testGradingConfig);

      expect(result.perQuestion[compositeKey].isCorrect).toBe(false);
    });

    it('should grade fill in blank with exact match', () => {
      const compositeKey = 'test_quiz_1::q3';
      updateAnswer(session, compositeKey, 'Paris'); // Exact match

      const result = gradeSession(session, testGradingConfig);

      expect(result.perQuestion[compositeKey].isCorrect).toBe(true);
    });

    it('should grade fill in blank case-insensitive', () => {
      const compositeKey = 'test_quiz_1::q3';
      updateAnswer(session, compositeKey, 'paris'); // Lowercase

      const result = gradeSession(session, testGradingConfig);

      expect(result.perQuestion[compositeKey].isCorrect).toBe(true);
    });

    it('should grade multiple choice multi correctly', () => {
      const compositeKey = 'test_quiz_2::q4';
      updateAnswer(session, compositeKey, [0, 1, 3]); // Correct indices

      const result = gradeSession(session, testGradingConfig);

      expect(result.perQuestion[compositeKey].isCorrect).toBe(true);
    });

    it('should grade multiple choice multi with different order', () => {
      const compositeKey = 'test_quiz_2::q4';
      updateAnswer(session, compositeKey, [3, 0, 1]); // Different order, same values

      const result = gradeSession(session, testGradingConfig);

      expect(result.perQuestion[compositeKey].isCorrect).toBe(true);
    });

    it('should grade multiple choice multi incorrectly when partial', () => {
      const compositeKey = 'test_quiz_2::q4';
      updateAnswer(session, compositeKey, [0, 1]); // Missing index 3

      const result = gradeSession(session, testGradingConfig);

      expect(result.perQuestion[compositeKey].isCorrect).toBe(false);
    });

    it('should grade multiple choice multi incorrectly when extra', () => {
      const compositeKey = 'test_quiz_2::q4';
      updateAnswer(session, compositeKey, [0, 1, 2, 3]); // Extra index 2

      const result = gradeSession(session, testGradingConfig);

      expect(result.perQuestion[compositeKey].isCorrect).toBe(false);
    });

    it('should grade short answer with normalization', () => {
      const compositeKey = 'test_quiz_2::q5';
      // Answer with extra spaces and articles
      updateAnswer(
        session,
        compositeKey,
        '  Process  where  the  plants  make  food  using  sunlight  '
      );

      const result = gradeSession(session, testGradingConfig);

      expect(result.perQuestion[compositeKey].isCorrect).toBe(true);
    });

    it('should calculate correct totals', () => {
      // Answer 3 correctly, 1 incorrectly, leave 2 unanswered
      updateAnswer(session, 'test_quiz_1::q1', 1); // Correct
      updateAnswer(session, 'test_quiz_1::q2', true); // Correct
      updateAnswer(session, 'test_quiz_1::q3', 'Paris'); // Correct
      updateAnswer(session, 'test_quiz_2::q4', [0, 1]); // Incorrect (missing 3)
      // q5 and test_quiz_2::q1 unanswered

      const result = gradeSession(session, testGradingConfig);

      expect(result.totalQuestions).toBe(6);
      expect(result.totalCorrect).toBe(3);
      expect(result.totalIncorrect).toBe(1);
      expect(result.totalUnanswered).toBe(2);
      expect(result.score).toBe(75); // 3/4 answered = 75%
    });

    it('should handle all questions unanswered', () => {
      const result = gradeSession(session, testGradingConfig);

      expect(result.totalQuestions).toBe(6);
      expect(result.totalCorrect).toBe(0);
      expect(result.totalIncorrect).toBe(0);
      expect(result.totalUnanswered).toBe(6);
      expect(result.score).toBe(0);
    });

    it('should handle all questions correct', () => {
      updateAnswer(session, 'test_quiz_1::q1', 1);
      updateAnswer(session, 'test_quiz_1::q2', true);
      updateAnswer(session, 'test_quiz_1::q3', 'Paris');
      updateAnswer(session, 'test_quiz_2::q4', [0, 1, 3]);
      updateAnswer(
        session,
        'test_quiz_2::q5',
        'Process where plants make food using sunlight'
      );
      updateAnswer(session, 'test_quiz_2::q1', false);

      const result = gradeSession(session, testGradingConfig);

      expect(result.totalQuestions).toBe(6);
      expect(result.totalCorrect).toBe(6);
      expect(result.totalIncorrect).toBe(0);
      expect(result.totalUnanswered).toBe(0);
      expect(result.score).toBe(100);
    });
  });

  describe('Text normalization', () => {
    let session: Session;
    let quiz: QuizSet;

    beforeEach(() => {
      // Create a quiz with normalization examples
      quiz = {
        id: 'normalize_test',
        title: 'Normalization Test',
        questions: [
          {
            id: 'q1',
            type: 'fill_in_blank',
            text: 'What is the answer?',
            acceptableAnswers: [
              { value: 'the answer', normalize: true },
              { value: 'an answer', normalize: true },
              'exact match required',
            ],
          } as FillInBlankQuestion,
        ],
      };

      registry.byId['normalize_test'] = quiz;
      registry.all.push(quiz);

      session = createSession(registry, {
        userId: 'user1',
        selectedQuizIds: ['normalize_test'],
      });
    });

    it('should normalize by removing articles', () => {
      updateAnswer(session, 'normalize_test::q1', 'answer'); // "the" removed

      const result = gradeSession(session, testGradingConfig);
      expect(result.perQuestion['normalize_test::q1'].isCorrect).toBe(true);
    });

    it('should normalize by trimming and lowercasing', () => {
      updateAnswer(session, 'normalize_test::q1', '  THE ANSWER  ');

      const result = gradeSession(session, testGradingConfig);
      expect(result.perQuestion['normalize_test::q1'].isCorrect).toBe(true);
    });

    it('should normalize by collapsing spaces', () => {
      updateAnswer(session, 'normalize_test::q1', 'the    answer');

      const result = gradeSession(session, testGradingConfig);
      expect(result.perQuestion['normalize_test::q1'].isCorrect).toBe(true);
    });

    it('should not normalize when normalize flag is false', () => {
      updateAnswer(session, 'normalize_test::q1', 'EXACT MATCH REQUIRED'); // Wrong case

      // Disable fuzzy matching for this test to test exact match behavior
      const exactMatchConfig: GradingConfig = {
        ...testGradingConfig,
        enableFuzzyMatching: false,
      };
      const result = gradeSession(session, exactMatchConfig);
      expect(result.perQuestion['normalize_test::q1'].isCorrect).toBe(false);
    });

    it('should match exact string when normalize flag is false', () => {
      updateAnswer(session, 'normalize_test::q1', 'exact match required');

      const result = gradeSession(session, testGradingConfig);
      expect(result.perQuestion['normalize_test::q1'].isCorrect).toBe(true);
    });
  });

  describe('completeSession', () => {
    it('should set completedAt timestamp', () => {
      const session = createSession(registry, {
        userId: 'user1',
        selectedQuizIds: ['test_quiz_1'],
      });

      expect(session.completedAt).toBeUndefined();

      completeSession(session);

      expect(session.completedAt).toBeDefined();
      expect(new Date(session.completedAt!).getTime()).toBeGreaterThanOrEqual(
        new Date(session.createdAt).getTime()
      );
    });
  });

  describe('getSessionProgress', () => {
    let session: Session;

    beforeEach(() => {
      session = createSession(registry, {
        userId: 'user1',
        selectedQuizIds: ['test_quiz_1'],
      });
    });

    it('should return 0% when no questions answered', () => {
      const progress = getSessionProgress(session);

      expect(progress.answered).toBe(0);
      expect(progress.total).toBe(3);
      expect(progress.percentComplete).toBe(0);
    });

    it('should calculate progress correctly', () => {
      updateAnswer(session, 'test_quiz_1::q1', 1);
      updateAnswer(session, 'test_quiz_1::q2', true);

      const progress = getSessionProgress(session);

      expect(progress.answered).toBe(2);
      expect(progress.total).toBe(3);
      expect(progress.percentComplete).toBeCloseTo(66.67, 1);
    });

    it('should return 100% when all questions answered', () => {
      updateAnswer(session, 'test_quiz_1::q1', 1);
      updateAnswer(session, 'test_quiz_1::q2', true);
      updateAnswer(session, 'test_quiz_1::q3', 'Paris');

      const progress = getSessionProgress(session);

      expect(progress.answered).toBe(3);
      expect(progress.total).toBe(3);
      expect(progress.percentComplete).toBe(100);
    });
  });
});
