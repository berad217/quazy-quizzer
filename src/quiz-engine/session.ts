/**
 * Session Engine
 *
 * Handles quiz session creation, answer storage, and grading.
 * Based on specification section 6.2, 6.4.
 */

import { Question, QuizRegistry } from './schema';
import { randomUUID } from 'crypto';
import { GradingConfig } from '../config/types';
import {
  gradeTextAnswer,
  AcceptableAnswer,
  MatchResult,
} from '../grading/fuzzyMatch';
import { SkillLevels } from '../adaptive/eloRating';
import { selectAdaptiveQuestions } from '../adaptive/questionSelector';

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
  // Sprint 7: Enhanced grading metadata
  score?: number;                    // 0-1, supports partial credit
  matchType?: 'exact' | 'fuzzy' | 'partial' | 'none';
  similarity?: number;               // 0-1, for fuzzy matches
  matchedAnswer?: string;            // which acceptable answer matched
  feedback?: string;                 // custom feedback
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
  adaptive?: boolean; // use adaptive difficulty (Sprint 8)
  targetAccuracy?: number; // target accuracy for adaptive mode (0-1)
  userSkills?: SkillLevels; // user skill levels for adaptive mode
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
  totalScore: number; // Sum of scores (0-totalQuestions, supports partial credit)
  perQuestion: {
    [compositeKey: string]: {
      isCorrect: boolean;
      userAnswer: AnswerValue;
      correctAnswer?: any;
      score?: number; // 0-1, supports partial credit
      matchType?: 'exact' | 'fuzzy' | 'partial' | 'none';
      similarity?: number; // 0-1, for fuzzy matches
      feedback?: string; // custom feedback
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
 * 4. Use adaptive selection if enabled, otherwise shuffle if randomize is true
 * 5. Apply limit if provided
 */
export function createSession(
  registry: QuizRegistry,
  options: CreateSessionOptions
): Session {
  const {
    userId,
    selectedQuizIds,
    randomize = false,
    limit,
    adaptive = false,
    targetAccuracy = 0.7,
    userSkills = {}
  } = options;

  // Validate selected quiz IDs exist
  for (const quizId of selectedQuizIds) {
    if (!registry.byId[quizId]) {
      throw new Error(`Quiz not found: ${quizId}`);
    }
  }

  // Collect all questions from selected quizzes
  const collectedQuestions: Array<{ question: Question; compositeKey: string }> = [];
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
        question,
        compositeKey
      });
    }
  }

  // Select questions: adaptive or random/sequential
  let selectedQuestions: Array<{ question: Question; compositeKey: string }>;

  if (adaptive && userSkills && Object.keys(userSkills).length > 0) {
    // Use adaptive selection
    const count = limit && limit > 0 ? limit : collectedQuestions.length;
    selectedQuestions = selectAdaptiveQuestions(
      collectedQuestions,
      userSkills,
      count,
      targetAccuracy,
      randomize
    );
  } else {
    // Use traditional selection
    selectedQuestions = [...collectedQuestions];

    // Shuffle if requested
    if (randomize) {
      selectedQuestions = shuffleArray(selectedQuestions);
    }

    // Apply limit if provided
    if (limit !== undefined && limit > 0) {
      selectedQuestions = selectedQuestions.slice(0, limit);
    }
  }

  // Convert to SessionQuestion format with proper indices
  const finalQuestions: SessionQuestion[] = selectedQuestions.map(({ question, compositeKey }, idx) => {
    const [quizId, questionId] = compositeKey.split('::');
    return {
      quizId,
      questionId,
      compositeKey,
      index: idx,
      question
    };
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
 * Updates the session.answers[] fields with grading metadata
 * Returns grading summary
 */
export function gradeSession(session: Session, gradingConfig: GradingConfig): GradingResult {
  const result: GradingResult = {
    totalQuestions: session.questions.length,
    totalCorrect: 0,
    totalIncorrect: 0,
    totalUnanswered: 0,
    score: 0,
    totalScore: 0,
    perQuestion: {},
  };

  for (const sessionQuestion of session.questions) {
    const { compositeKey, question } = sessionQuestion;
    const answer = session.answers[compositeKey];

    if (!answer) {
      result.totalUnanswered++;
      continue;
    }

    // Grade with enhanced grading (returns detailed match info)
    const gradingDetails = gradeAnswer(question, answer.value, gradingConfig);

    // Update the answer with full grading metadata
    answer.isCorrect = gradingDetails.isCorrect;
    answer.score = gradingDetails.score;
    answer.matchType = gradingDetails.matchType;
    answer.similarity = gradingDetails.similarity;
    answer.matchedAnswer = gradingDetails.matchedAnswer;
    answer.feedback = gradingDetails.feedback;

    // Track in result with weighted scores
    result.totalScore += gradingDetails.score;
    if (gradingDetails.score >= 1.0) {
      result.totalCorrect++;
    } else if (gradingDetails.score > 0) {
      // Partial credit counts as partial correct
      result.totalCorrect += gradingDetails.score;
      result.totalIncorrect += (1 - gradingDetails.score);
    } else {
      result.totalIncorrect++;
    }

    // Build per-question result
    result.perQuestion[compositeKey] = {
      isCorrect: gradingDetails.isCorrect,
      userAnswer: answer.value,
      correctAnswer: getCorrectAnswer(question),
      score: gradingDetails.score,
      matchType: gradingDetails.matchType,
      similarity: gradingDetails.similarity,
      feedback: gradingDetails.feedback,
    };
  }

  // Calculate percentage score based on weighted scores
  const answeredCount = result.totalQuestions - result.totalUnanswered;
  result.score =
    answeredCount > 0 ? (result.totalScore / answeredCount) * 100 : 0;

  return result;
}

/**
 * Detailed grading result for a single answer
 */
interface DetailedGradingResult {
  isCorrect: boolean;
  score: number; // 0-1
  matchType?: 'exact' | 'fuzzy' | 'partial' | 'none';
  similarity?: number;
  matchedAnswer?: string;
  feedback?: string;
}

/**
 * Grades a single answer against a question
 * Returns detailed grading information including score and match type
 */
function gradeAnswer(
  question: Question,
  userAnswer: AnswerValue,
  gradingConfig: GradingConfig
): DetailedGradingResult {
  switch (question.type) {
    case 'multiple_choice_single': {
      // User answer should be a number (index)
      if (typeof userAnswer !== 'number') {
        return { isCorrect: false, score: 0, matchType: 'none' };
      }
      // Correct answer is an array of indices, typically 1 item
      const isCorrect = question.correct.includes(userAnswer);
      return {
        isCorrect,
        score: isCorrect ? 1 : 0,
        matchType: isCorrect ? 'exact' : 'none',
      };
    }

    case 'multiple_choice_multi': {
      // User answer should be an array of numbers
      if (!Array.isArray(userAnswer)) {
        return { isCorrect: false, score: 0, matchType: 'none' };
      }
      // Must match exactly (same indices, order doesn't matter)
      const userSet = new Set(userAnswer);
      const correctSet = new Set(question.correct);
      let isCorrect = true;
      if (userSet.size !== correctSet.size) {
        isCorrect = false;
      } else {
        for (const idx of userSet) {
          if (!correctSet.has(idx)) {
            isCorrect = false;
            break;
          }
        }
      }
      return {
        isCorrect,
        score: isCorrect ? 1 : 0,
        matchType: isCorrect ? 'exact' : 'none',
      };
    }

    case 'true_false': {
      // User answer should be a boolean
      if (typeof userAnswer !== 'boolean') {
        return { isCorrect: false, score: 0, matchType: 'none' };
      }
      const isCorrect = userAnswer === question.correct;
      return {
        isCorrect,
        score: isCorrect ? 1 : 0,
        matchType: isCorrect ? 'exact' : 'none',
      };
    }

    case 'fill_in_blank': {
      // User answer should be a string
      if (typeof userAnswer !== 'string') {
        return { isCorrect: false, score: 0, matchType: 'none' };
      }

      // Use fuzzy matching for text answers
      const matchResult = gradeTextAnswer(
        userAnswer,
        question.acceptableAnswers as AcceptableAnswer[],
        gradingConfig
      );

      return {
        isCorrect: matchResult.matched,
        score: matchResult.score,
        matchType: matchResult.matchType,
        similarity: matchResult.similarity,
        matchedAnswer: matchResult.matchedAnswer,
        feedback: matchResult.feedback,
      };
    }

    case 'short_answer': {
      // User answer should be a string
      if (typeof userAnswer !== 'string') {
        return { isCorrect: false, score: 0, matchType: 'none' };
      }

      // If no correct answer provided, cannot auto-grade
      if (!question.correct) {
        // Return undefined to indicate manual grading needed
        // For now, treat as incorrect (needs manual review)
        return { isCorrect: false, score: 0, matchType: 'none' };
      }

      // Use fuzzy matching for short answer
      // Convert single correct answer to array format for gradeTextAnswer
      const acceptableAnswers: AcceptableAnswer[] = [question.correct];
      const matchResult = gradeTextAnswer(
        userAnswer,
        acceptableAnswers,
        gradingConfig
      );

      return {
        isCorrect: matchResult.matched,
        score: matchResult.score,
        matchType: matchResult.matchType,
        similarity: matchResult.similarity,
        matchedAnswer: matchResult.matchedAnswer,
        feedback: matchResult.feedback,
      };
    }

    default:
      // Unknown question type
      return { isCorrect: false, score: 0, matchType: 'none' };
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
