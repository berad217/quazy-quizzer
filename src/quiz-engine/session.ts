/**
 * Session Engine
 *
 * Handles quiz session creation, answer storage, and grading.
 * Based on specification section 6.2, 6.4.
 */

import { Question, QuizRegistry } from './schema';
import { randomUUID } from 'crypto';

/**
 * SessionQuestion wraps a question with session context
 * Uses composite key format: quizId::questionId
 */
export interface SessionQuestion {
  quizId: string;
  questionId: string;
  compositeKey: string; // format: "quizId::questionId"
  index: number; // position in this session
  question: Question;
}

/**
 * Answer value can be different types based on question type:
 * - multiple_choice_single: number (index)
 * - multiple_choice_multi: number[] (indices)
 * - true_false: boolean
 * - fill_in_blank: string
 * - short_answer: string
 */
export type AnswerValue = number | number[] | boolean | string;

/**
 * Stored answer for a question in a session
 */
export interface SessionAnswer {
  value: AnswerValue;
  isCorrect?: boolean; // undefined until graded
  answeredAt?: string; // ISO timestamp
}

/**
 * A quiz session for a specific user
 */
export interface Session {
  id: string;
  userId: string;
  quizIds: string[]; // which quiz sets were selected
  questions: SessionQuestion[];
  answers: {
    [compositeKey: string]: SessionAnswer;
  };
  createdAt: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
}

/**
 * Options for creating a new session
 */
export interface CreateSessionOptions {
  userId: string;
  selectedQuizIds: string[];
  randomize?: boolean; // default from config if not provided
  limit?: number; // cap total questions
}

/**
 * Result from grading a session
 */
export interface GradingResult {
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalUnanswered: number;
  score: number; // percentage 0-100
  perQuestion: {
    [compositeKey: string]: {
      isCorrect: boolean;
      userAnswer: AnswerValue;
      correctAnswer?: any;
    };
  };
}

/**
 * Creates a new quiz session
 *
 * Process:
 * 1. Collect all questions from selected quiz sets
 * 2. Tag each with quizId and composite key (quizId::questionId)
 * 3. Deduplicate by composite key (keeps first occurrence)
 * 4. Optionally shuffle if randomize is true
 * 5. Apply limit if provided
 */
export function createSession(
  registry: QuizRegistry,
  options: CreateSessionOptions
): Session {
  const { userId, selectedQuizIds, randomize = false, limit } = options;

  // Validate selected quiz IDs exist
  for (const quizId of selectedQuizIds) {
    if (!registry.byId[quizId]) {
      throw new Error(`Quiz not found: ${quizId}`);
    }
  }

  // Collect all questions from selected quizzes
  const collectedQuestions: SessionQuestion[] = [];
  const seenKeys = new Set<string>();

  for (const quizId of selectedQuizIds) {
    const quiz = registry.byId[quizId];

    for (const question of quiz.questions) {
      const compositeKey = `${quizId}::${question.id}`;

      // Deduplicate by composite key (keep first occurrence)
      if (seenKeys.has(compositeKey)) {
        continue;
      }

      seenKeys.add(compositeKey);
      collectedQuestions.push({
        quizId,
        questionId: question.id,
        compositeKey,
        index: collectedQuestions.length, // temporary, will be reassigned
        question,
      });
    }
  }

  // Shuffle if requested
  let finalQuestions = [...collectedQuestions];
  if (randomize) {
    finalQuestions = shuffleArray(finalQuestions);
  }

  // Apply limit if provided
  if (limit !== undefined && limit > 0) {
    finalQuestions = finalQuestions.slice(0, limit);
  }

  // Reassign indices to final order
  finalQuestions.forEach((q, idx) => {
    q.index = idx;
  });

  // Create session
  const session: Session = {
    id: randomUUID(),
    userId,
    quizIds: selectedQuizIds,
    questions: finalQuestions,
    answers: {},
    createdAt: new Date().toISOString(),
  };

  return session;
}

/**
 * Updates an answer in a session
 * Does not validate answer format - caller should ensure correct type
 */
export function updateAnswer(
  session: Session,
  compositeKey: string,
  value: AnswerValue
): void {
  // Verify the question exists in this session
  const questionExists = session.questions.some(
    (q) => q.compositeKey === compositeKey
  );

  if (!questionExists) {
    throw new Error(
      `Question ${compositeKey} not found in session ${session.id}`
    );
  }

  session.answers[compositeKey] = {
    value,
    answeredAt: new Date().toISOString(),
  };
}

/**
 * Grades all answers in a session
 * Updates the session.answers[].isCorrect fields
 * Returns grading summary
 */
export function gradeSession(session: Session): GradingResult {
  const result: GradingResult = {
    totalQuestions: session.questions.length,
    totalCorrect: 0,
    totalIncorrect: 0,
    totalUnanswered: 0,
    score: 0,
    perQuestion: {},
  };

  for (const sessionQuestion of session.questions) {
    const { compositeKey, question } = sessionQuestion;
    const answer = session.answers[compositeKey];

    if (!answer) {
      result.totalUnanswered++;
      continue;
    }

    const isCorrect = gradeAnswer(question, answer.value);

    // Update the answer with grading result
    answer.isCorrect = isCorrect;

    // Track in result
    if (isCorrect) {
      result.totalCorrect++;
    } else {
      result.totalIncorrect++;
    }

    // Build per-question result
    result.perQuestion[compositeKey] = {
      isCorrect,
      userAnswer: answer.value,
      correctAnswer: getCorrectAnswer(question),
    };
  }

  // Calculate percentage score (only from answered questions)
  const answeredCount =
    result.totalQuestions - result.totalUnanswered;
  result.score =
    answeredCount > 0 ? (result.totalCorrect / answeredCount) * 100 : 0;

  return result;
}

/**
 * Grades a single answer against a question
 * Returns true if correct, false otherwise
 */
function gradeAnswer(question: Question, userAnswer: AnswerValue): boolean {
  switch (question.type) {
    case 'multiple_choice_single': {
      // User answer should be a number (index)
      if (typeof userAnswer !== 'number') return false;
      // Correct answer is an array of indices, typically 1 item
      return question.correct.includes(userAnswer);
    }

    case 'multiple_choice_multi': {
      // User answer should be an array of numbers
      if (!Array.isArray(userAnswer)) return false;
      // Must match exactly (same indices, order doesn't matter)
      const userSet = new Set(userAnswer);
      const correctSet = new Set(question.correct);
      if (userSet.size !== correctSet.size) return false;
      for (const idx of userSet) {
        if (!correctSet.has(idx)) return false;
      }
      return true;
    }

    case 'true_false': {
      // User answer should be a boolean
      if (typeof userAnswer !== 'boolean') return false;
      return userAnswer === question.correct;
    }

    case 'fill_in_blank': {
      // User answer should be a string
      if (typeof userAnswer !== 'string') return false;

      // Check against acceptable answers
      for (const acceptable of question.acceptableAnswers) {
        if (typeof acceptable === 'string') {
          // Exact match (case-sensitive)
          if (userAnswer === acceptable) return true;
        } else {
          // Object with normalization hint
          const expected = acceptable.value;
          if (acceptable.normalize) {
            // Apply normalization to both
            if (normalizeText(userAnswer) === normalizeText(expected)) {
              return true;
            }
          } else {
            // Exact match
            if (userAnswer === expected) return true;
          }
        }
      }

      return false;
    }

    case 'short_answer': {
      // User answer should be a string
      if (typeof userAnswer !== 'string') return false;

      // If no correct answer provided, cannot auto-grade
      if (!question.correct) {
        // Return undefined to indicate manual grading needed
        // For now, treat as incorrect (needs manual review)
        return false;
      }

      // Simple exact match (case-insensitive with trimming)
      // This is a basic implementation - may want to add fuzzy matching later
      return (
        normalizeText(userAnswer) === normalizeText(question.correct)
      );
    }

    default:
      // Unknown question type
      return false;
  }
}

/**
 * Text normalization for answer comparison
 * - Lowercase
 * - Trim whitespace
 * - Remove extra spaces
 * - Remove common articles (a, an, the)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .replace(/\b(a|an|the)\b/g, '') // remove articles
    .replace(/\s+/g, ' ') // collapse again after article removal
    .trim();
}

/**
 * Extracts the correct answer from a question for display purposes
 */
function getCorrectAnswer(question: Question): any {
  switch (question.type) {
    case 'multiple_choice_single':
    case 'multiple_choice_multi':
      return question.correct;
    case 'true_false':
      return question.correct;
    case 'fill_in_blank':
      return question.acceptableAnswers;
    case 'short_answer':
      return question.correct || 'Manual grading required';
    default:
      return undefined;
  }
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Marks a session as completed
 */
export function completeSession(session: Session): void {
  session.completedAt = new Date().toISOString();
}

/**
 * Gets the current progress of a session
 */
export function getSessionProgress(session: Session): {
  answered: number;
  total: number;
  percentComplete: number;
} {
  const answered = Object.keys(session.answers).length;
  const total = session.questions.length;
  const percentComplete = total > 0 ? (answered / total) * 100 : 0;

  return { answered, total, percentComplete };
}
