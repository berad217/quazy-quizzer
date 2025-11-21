/**
 * Quiz Validator
 *
 * Validates quiz data against the schema specification.
 * Rules (from spec section 4):
 * - `id` must be unique within a quiz file
 * - Unknown `type` => skip with warning
 * - Empty `questions` => file is invalid
 * - Invalid files are logged and skipped, no crash
 */

import {
  RawQuizData,
  QuizSet,
  Question,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SUPPORTED_QUESTION_TYPES,
} from './schema.js';

/**
 * Validate a raw quiz data object
 */
export function validateQuiz(data: RawQuizData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  if (!data.id || typeof data.id !== 'string' || data.id.trim() === '') {
    errors.push({
      field: 'id',
      message: 'Quiz must have a non-empty string id',
      value: data.id,
    });
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push({
      field: 'title',
      message: 'Quiz must have a non-empty string title',
      value: data.title,
    });
  }

  // Questions array
  if (!Array.isArray(data.questions)) {
    errors.push({
      field: 'questions',
      message: 'Quiz must have a questions array',
      value: data.questions,
    });
    // Can't continue validation without questions array
    return { valid: false, errors, warnings };
  }

  if (data.questions.length === 0) {
    errors.push({
      field: 'questions',
      message: 'Quiz must have at least one question',
      value: data.questions,
    });
    return { valid: false, errors, warnings };
  }

  // Validate questions and check for duplicate IDs
  const questionIds = new Set<string>();
  const validQuestions: Question[] = [];

  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    const questionResult = validateQuestion(q, i);

    // Add errors and warnings from question validation
    errors.push(...questionResult.errors);
    warnings.push(...questionResult.warnings);

    // Check for duplicate IDs
    if (q.id && typeof q.id === 'string') {
      if (questionIds.has(q.id)) {
        errors.push({
          field: `questions[${i}].id`,
          message: `Duplicate question id: ${q.id}`,
          value: q.id,
        });
      } else {
        questionIds.add(q.id);
      }
    }

    // If question is valid (despite warnings), add to valid questions
    if (questionResult.valid) {
      validQuestions.push(q as Question);
    }
  }

  // If all questions were invalid, the quiz is invalid
  if (validQuestions.length === 0) {
    errors.push({
      field: 'questions',
      message: 'Quiz has no valid questions after validation',
      value: data.questions.length,
    });
  }

  // Optional fields validation
  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    warnings.push({
      field: 'tags',
      message: 'tags should be an array, ignoring',
      value: data.tags,
    });
  }

  if (data.version !== undefined && typeof data.version !== 'number') {
    warnings.push({
      field: 'version',
      message: 'version should be a number, ignoring',
      value: data.version,
    });
  }

  if (data.defaultQuestionCount !== undefined && typeof data.defaultQuestionCount !== 'number') {
    warnings.push({
      field: 'defaultQuestionCount',
      message: 'defaultQuestionCount should be a number, ignoring',
      value: data.defaultQuestionCount,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a single question
 */
function validateQuestion(q: any, index: number): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const prefix = `questions[${index}]`;

  // Required base fields
  if (!q.id || typeof q.id !== 'string' || q.id.trim() === '') {
    errors.push({
      field: `${prefix}.id`,
      message: 'Question must have a non-empty string id',
      value: q.id,
    });
  }

  if (!q.type || typeof q.type !== 'string') {
    errors.push({
      field: `${prefix}.type`,
      message: 'Question must have a string type',
      value: q.type,
    });
    return { valid: false, errors, warnings };
  }

  // Check if type is supported
  if (!SUPPORTED_QUESTION_TYPES.includes(q.type as any)) {
    warnings.push({
      field: `${prefix}.type`,
      message: `Unknown question type: ${q.type}, skipping question`,
      value: q.type,
    });
    return { valid: false, errors, warnings };
  }

  if (!q.text || typeof q.text !== 'string' || q.text.trim() === '') {
    errors.push({
      field: `${prefix}.text`,
      message: 'Question must have non-empty text',
      value: q.text,
    });
  }

  // Type-specific validation
  switch (q.type) {
    case 'multiple_choice_single':
    case 'multiple_choice_multi':
      if (!Array.isArray(q.choices) || q.choices.length === 0) {
        errors.push({
          field: `${prefix}.choices`,
          message: 'Multiple choice question must have a non-empty choices array',
          value: q.choices,
        });
      }
      if (!Array.isArray(q.correct) || q.correct.length === 0) {
        errors.push({
          field: `${prefix}.correct`,
          message: 'Multiple choice question must have a non-empty correct array',
          value: q.correct,
        });
      } else {
        // Validate indices
        const maxIndex = Array.isArray(q.choices) ? q.choices.length - 1 : -1;
        for (const idx of q.correct) {
          if (typeof idx !== 'number' || idx < 0 || idx > maxIndex) {
            errors.push({
              field: `${prefix}.correct`,
              message: `Invalid choice index: ${idx} (must be 0-${maxIndex})`,
              value: idx,
            });
          }
        }
      }
      break;

    case 'true_false':
      if (typeof q.correct !== 'boolean') {
        errors.push({
          field: `${prefix}.correct`,
          message: 'True/false question must have a boolean correct value',
          value: q.correct,
        });
      }
      break;

    case 'fill_in_blank':
      if (!Array.isArray(q.acceptableAnswers) || q.acceptableAnswers.length === 0) {
        errors.push({
          field: `${prefix}.acceptableAnswers`,
          message: 'Fill-in-blank question must have non-empty acceptableAnswers array',
          value: q.acceptableAnswers,
        });
      } else {
        // Validate each acceptable answer
        q.acceptableAnswers.forEach((ans: any, i: number) => {
          if (typeof ans === 'string') {
            // Simple string answer is valid
          } else if (typeof ans === 'object' && ans !== null) {
            if (!ans.value || typeof ans.value !== 'string') {
              errors.push({
                field: `${prefix}.acceptableAnswers[${i}]`,
                message: 'Answer object must have a string value',
                value: ans,
              });
            }
          } else {
            errors.push({
              field: `${prefix}.acceptableAnswers[${i}]`,
              message: 'Answer must be a string or object with value',
              value: ans,
            });
          }
        });
      }
      break;

    case 'short_answer':
      // Optional correct field
      if (q.correct !== undefined && typeof q.correct !== 'string') {
        warnings.push({
          field: `${prefix}.correct`,
          message: 'Short answer correct field should be a string if provided',
          value: q.correct,
        });
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Filter valid questions from a quiz, logging warnings for skipped questions
 */
export function filterValidQuestions(questions: any[]): Question[] {
  const validQuestions: Question[] = [];
  const questionIds = new Set<string>();

  questions.forEach((q, i) => {
    const result = validateQuestion(q, i);

    // Log warnings
    result.warnings.forEach(w => {
      console.warn(`[Quiz Validation] ${w.message}`, w.value);
    });

    // Skip if invalid
    if (!result.valid) {
      if (result.errors.length > 0) {
        console.warn(`[Quiz Validation] Skipping question ${i}:`, result.errors[0].message);
      }
      return;
    }

    // Skip duplicates
    if (questionIds.has(q.id)) {
      console.warn(`[Quiz Validation] Skipping duplicate question id: ${q.id}`);
      return;
    }

    questionIds.add(q.id);
    validQuestions.push(q as Question);
  });

  return validQuestions;
}
