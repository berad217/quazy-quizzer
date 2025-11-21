/**
 * Quiz Service
 *
 * Loads quiz files from the file system and builds a quiz registry.
 * Handles quiz discovery, validation, and registry management.
 */

import fs from 'fs/promises';
import path from 'path';
import { QuizSet, QuizRegistry, RawQuizData } from '../src/quiz-engine/schema.js';
import { validateQuiz, filterValidQuestions } from '../src/quiz-engine/validator.js';

/**
 * Discover and load all quiz files from a directory
 */
export async function loadQuizzes(quizFolder: string): Promise<QuizRegistry> {
  const registry: QuizRegistry = {
    byId: {},
    all: [],
  };

  const quizPath = path.join(process.cwd(), quizFolder);

  try {
    // Check if quiz folder exists
    try {
      await fs.access(quizPath);
    } catch {
      console.warn(`Quiz folder not found: ${quizPath}`);
      console.log('Creating quiz folder...');
      await fs.mkdir(quizPath, { recursive: true });
      return registry;
    }

    // Read all files in the quiz folder
    const files = await fs.readdir(quizPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    if (jsonFiles.length === 0) {
      console.warn(`No quiz files found in ${quizPath}`);
      return registry;
    }

    console.log(`Found ${jsonFiles.length} quiz file(s) in ${quizPath}`);

    // Load and validate each quiz file
    for (const file of jsonFiles) {
      const filePath = path.join(quizPath, file);
      try {
        const quizSet = await loadQuizFile(filePath, file);
        if (quizSet) {
          // Check for duplicate quiz IDs
          if (registry.byId[quizSet.id]) {
            console.error(
              `[Quiz Loader] Duplicate quiz ID "${quizSet.id}" in file ${file}, skipping`
            );
            continue;
          }

          registry.byId[quizSet.id] = quizSet;
          registry.all.push(quizSet);
          console.log(`✓ Loaded quiz: ${quizSet.id} (${quizSet.questions.length} questions)`);
        }
      } catch (error) {
        console.error(`[Quiz Loader] Failed to load ${file}:`, error);
        // Continue processing other files
      }
    }

    console.log(`✓ Quiz registry built with ${registry.all.length} quiz set(s)`);
  } catch (error) {
    console.error('[Quiz Loader] Error loading quizzes:', error);
  }

  return registry;
}

/**
 * Load and validate a single quiz file
 */
async function loadQuizFile(filePath: string, fileName: string): Promise<QuizSet | null> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const rawData = JSON.parse(fileContent) as RawQuizData;

    // Validate the quiz
    const validationResult = validateQuiz(rawData);

    // Log warnings
    if (validationResult.warnings.length > 0) {
      console.warn(`[Quiz Validation] Warnings in ${fileName}:`);
      validationResult.warnings.forEach(w => {
        console.warn(`  - ${w.field}: ${w.message}`);
      });
    }

    // If invalid, log errors and skip
    if (!validationResult.valid) {
      console.error(`[Quiz Validation] Invalid quiz file ${fileName}:`);
      validationResult.errors.forEach(e => {
        console.error(`  - ${e.field}: ${e.message}`);
      });
      return null;
    }

    // Filter out invalid questions (with warnings logged)
    const validQuestions = filterValidQuestions(rawData.questions || []);

    if (validQuestions.length === 0) {
      console.error(`[Quiz Validation] No valid questions in ${fileName}, skipping`);
      return null;
    }

    // Build the QuizSet
    const quizSet: QuizSet = {
      id: rawData.id!,
      title: rawData.title!,
      description: rawData.description,
      tags: Array.isArray(rawData.tags) ? rawData.tags : undefined,
      version: typeof rawData.version === 'number' ? rawData.version : undefined,
      author: rawData.author,
      allowRandomSubset:
        typeof rawData.allowRandomSubset === 'boolean' ? rawData.allowRandomSubset : undefined,
      defaultQuestionCount:
        typeof rawData.defaultQuestionCount === 'number'
          ? rawData.defaultQuestionCount
          : undefined,
      questions: validQuestions,
    };

    return quizSet;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`[Quiz Loader] Invalid JSON in ${fileName}`);
    } else {
      console.error(`[Quiz Loader] Error loading ${fileName}:`, error);
    }
    return null;
  }
}

/**
 * Reload quizzes from disk (useful for development)
 */
export async function reloadQuizzes(quizFolder: string): Promise<QuizRegistry> {
  console.log('Reloading quizzes...');
  return loadQuizzes(quizFolder);
}

/**
 * Get a quiz by ID from the registry
 */
export function getQuizById(registry: QuizRegistry, quizId: string): QuizSet | undefined {
  return registry.byId[quizId];
}

/**
 * Get all quizzes with specific tags
 */
export function getQuizzesByTags(registry: QuizRegistry, tags: string[]): QuizSet[] {
  return registry.all.filter(quiz => {
    if (!quiz.tags) return false;
    return tags.some(tag => quiz.tags!.includes(tag));
  });
}
