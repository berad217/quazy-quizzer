/**
 * Quiz Schema Type Definitions
 *
 * Defines the TypeScript types for quiz files, questions, and validation results.
 * Based on specification section 4.
 */

// Base question interface that all question types extend
export interface BaseQuestion {
  id: string;
  type: string;
  text: string;
  explanation?: string;
  meta?: {
    difficulty?: number;
    category?: string;
    [key: string]: any;
  };
}

// Multiple choice single answer (select one)
export interface MultipleChoiceSingleQuestion extends BaseQuestion {
  type: 'multiple_choice_single';
  choices: string[];
  correct: number[]; // Array of indices, typically 1 item
}

// Multiple choice multiple answers (select many)
export interface MultipleChoiceMultiQuestion extends BaseQuestion {
  type: 'multiple_choice_multi';
  choices: string[];
  correct: number[]; // Array of indices, can be multiple
}

// True/False question
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  correct: boolean;
}

// Fill in the blank question
export interface FillInBlankQuestion extends BaseQuestion {
  type: 'fill_in_blank';
  acceptableAnswers: (string | { value: string; normalize?: boolean })[];
}

// Short answer question (optional correct answer for reference)
export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer';
  correct?: string;
}

// Union type of all supported question types
export type Question =
  | MultipleChoiceSingleQuestion
  | MultipleChoiceMultiQuestion
  | TrueFalseQuestion
  | FillInBlankQuestion
  | ShortAnswerQuestion;

// Quiz Set - represents a single quiz file
export interface QuizSet {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  version?: number;
  author?: string;
  allowRandomSubset?: boolean;
  defaultQuestionCount?: number;
  questions: Question[];
}

// Quiz Registry - collection of all loaded quizzes
export interface QuizRegistry {
  byId: { [quizId: string]: QuizSet };
  all: QuizSet[];
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: any;
}

// Raw quiz data before validation (used for parsing JSON)
export interface RawQuizData {
  id?: string;
  title?: string;
  description?: string;
  tags?: any;
  version?: any;
  author?: string;
  allowRandomSubset?: any;
  defaultQuestionCount?: any;
  questions?: any[];
}

// Supported question types
export const SUPPORTED_QUESTION_TYPES = [
  'multiple_choice_single',
  'multiple_choice_multi',
  'true_false',
  'fill_in_blank',
  'short_answer',
] as const;

export type QuestionType = typeof SUPPORTED_QUESTION_TYPES[number];
