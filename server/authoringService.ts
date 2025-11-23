/**
 * Authoring Service
 *
 * Handles quiz authoring operations: create, read, update, delete quizzes.
 * Manages draft files, backups, and file operations for the quiz authoring UI.
 */

import fs from 'fs/promises';
import path from 'path';
import { QuizSet, RawQuizData } from '../src/quiz-engine/schema.js';
import { validateQuiz } from '../src/quiz-engine/validator.js';

export interface AuthoringConfig {
  enabled: boolean;
  requireAuth: boolean;
  autoSaveDrafts: boolean;
  keepBackups: boolean;
  maxBackupsPerQuiz: number;
}

export interface QuizMetadata {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  author?: string;
  version?: number;
  questionCount: number;
  lastModified: string;
  isDraft: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ severity: 'error' | 'warning' | 'info'; field: string; message: string }>;
}

const QUIZ_FOLDER = 'quizzes';
const DRAFT_FOLDER = 'quizzes/.drafts';
const BACKUP_FOLDER = 'quizzes/.backups';

/**
 * Initialize authoring directories
 */
export async function initializeAuthoringFolders(): Promise<void> {
  const folders = [QUIZ_FOLDER, DRAFT_FOLDER, BACKUP_FOLDER];

  for (const folder of folders) {
    const folderPath = path.join(process.cwd(), folder);
    try {
      await fs.access(folderPath);
    } catch {
      await fs.mkdir(folderPath, { recursive: true });
      console.log(`Created authoring folder: ${folder}`);
    }
  }
}

/**
 * List all quizzes (published and drafts)
 */
export async function listQuizzes(includeDrafts = true): Promise<QuizMetadata[]> {
  const quizzes: QuizMetadata[] = [];

  // Load published quizzes
  const publishedPath = path.join(process.cwd(), QUIZ_FOLDER);
  try {
    const files = await fs.readdir(publishedPath);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('.'));

    for (const file of jsonFiles) {
      const filePath = path.join(publishedPath, file);
      const metadata = await getQuizMetadata(filePath, false);
      if (metadata) quizzes.push(metadata);
    }
  } catch (error) {
    console.error('Error listing published quizzes:', error);
  }

  // Load drafts
  if (includeDrafts) {
    const draftPath = path.join(process.cwd(), DRAFT_FOLDER);
    try {
      const files = await fs.readdir(draftPath);
      const jsonFiles = files.filter(f => f.endsWith('.draft.json'));

      for (const file of jsonFiles) {
        const filePath = path.join(draftPath, file);
        const metadata = await getQuizMetadata(filePath, true);
        if (metadata) quizzes.push(metadata);
      }
    } catch (error) {
      // Draft folder might not exist yet
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Error listing draft quizzes:', error);
      }
    }
  }

  return quizzes.sort((a, b) =>
    new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );
}

/**
 * Get metadata for a single quiz file
 */
async function getQuizMetadata(filePath: string, isDraft: boolean): Promise<QuizMetadata | null> {
  try {
    const stats = await fs.stat(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    const quiz = JSON.parse(content) as RawQuizData;

    return {
      id: quiz.id || 'unknown',
      title: quiz.title || 'Untitled Quiz',
      description: quiz.description,
      tags: quiz.tags,
      author: quiz.author,
      version: quiz.version,
      questionCount: quiz.questions?.length || 0,
      lastModified: stats.mtime.toISOString(),
      isDraft,
    };
  } catch (error) {
    console.error(`Error reading quiz metadata from ${filePath}:`, error);
    return null;
  }
}

/**
 * Get a quiz by ID for editing (checks both published and drafts)
 */
export async function getQuizForEditing(quizId: string): Promise<RawQuizData | null> {
  // Try draft first
  const draftPath = path.join(process.cwd(), DRAFT_FOLDER, `${quizId}.draft.json`);
  try {
    const content = await fs.readFile(draftPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    // Not in drafts, try published
  }

  // Try published
  const publishedFiles = await fs.readdir(path.join(process.cwd(), QUIZ_FOLDER));
  const quizFile = publishedFiles.find(f => f.startsWith(quizId) && f.endsWith('.json'));

  if (quizFile) {
    const filePath = path.join(process.cwd(), QUIZ_FOLDER, quizFile);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  return null;
}

/**
 * Create a new quiz
 */
export async function createQuiz(quiz: RawQuizData, saveAsDraft = true): Promise<void> {
  const folder = saveAsDraft ? DRAFT_FOLDER : QUIZ_FOLDER;
  const fileName = saveAsDraft ? `${quiz.id}.draft.json` : `${quiz.id}.v${quiz.version || 1}.json`;
  const filePath = path.join(process.cwd(), folder, fileName);

  // Check if quiz already exists
  try {
    await fs.access(filePath);
    throw new Error(`Quiz with ID "${quiz.id}" already exists`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  // Ensure folders exist
  await initializeAuthoringFolders();

  // Write quiz file
  await fs.writeFile(filePath, JSON.stringify(quiz, null, 2), 'utf-8');
  console.log(`Created quiz: ${filePath}`);
}

/**
 * Update an existing quiz
 */
export async function updateQuiz(
  quizId: string,
  quiz: RawQuizData,
  saveAsDraft = true,
  createBackup = true
): Promise<void> {
  // Create backup of current version if requested
  if (createBackup) {
    await createQuizBackup(quizId);
  }

  const folder = saveAsDraft ? DRAFT_FOLDER : QUIZ_FOLDER;
  const fileName = saveAsDraft ? `${quiz.id}.draft.json` : `${quiz.id}.v${quiz.version || 1}.json`;
  const filePath = path.join(process.cwd(), folder, fileName);

  // Ensure folders exist
  await initializeAuthoringFolders();

  // Write quiz file
  await fs.writeFile(filePath, JSON.stringify(quiz, null, 2), 'utf-8');
  console.log(`Updated quiz: ${filePath}`);
}

/**
 * Publish a draft quiz (move from drafts to published)
 */
export async function publishQuiz(quizId: string): Promise<void> {
  const draftPath = path.join(process.cwd(), DRAFT_FOLDER, `${quizId}.draft.json`);

  // Read draft
  const content = await fs.readFile(draftPath, 'utf-8');
  const quiz = JSON.parse(content) as RawQuizData;

  // Validate before publishing
  const validation = await validateQuizData(quiz);
  if (!validation.valid) {
    const errors = validation.errors.filter(e => e.severity === 'error');
    throw new Error(`Cannot publish quiz with validation errors: ${errors.map(e => e.message).join(', ')}`);
  }

  // Create backup of existing published version if it exists
  await createQuizBackup(quizId);

  // Write to published folder
  const version = quiz.version || 1;
  const publishedPath = path.join(process.cwd(), QUIZ_FOLDER, `${quizId}.v${version}.json`);
  await fs.writeFile(publishedPath, JSON.stringify(quiz, null, 2), 'utf-8');

  // Remove draft
  await fs.unlink(draftPath);

  console.log(`Published quiz: ${quizId} (v${version})`);
}

/**
 * Delete a quiz
 */
export async function deleteQuiz(quizId: string, deleteDraft = true): Promise<void> {
  const deleted: string[] = [];

  // Delete draft if exists
  if (deleteDraft) {
    const draftPath = path.join(process.cwd(), DRAFT_FOLDER, `${quizId}.draft.json`);
    try {
      await fs.unlink(draftPath);
      deleted.push('draft');
    } catch {
      // Draft doesn't exist
    }
  }

  // Delete published versions
  const publishedPath = path.join(process.cwd(), QUIZ_FOLDER);
  const files = await fs.readdir(publishedPath);
  const quizFiles = files.filter(f => f.startsWith(quizId) && f.endsWith('.json'));

  for (const file of quizFiles) {
    await fs.unlink(path.join(publishedPath, file));
    deleted.push(file);
  }

  if (deleted.length === 0) {
    throw new Error(`Quiz "${quizId}" not found`);
  }

  console.log(`Deleted quiz "${quizId}": ${deleted.join(', ')}`);
}

/**
 * Create a backup of a quiz
 */
async function createQuizBackup(quizId: string): Promise<void> {
  // Find the current published version
  const publishedPath = path.join(process.cwd(), QUIZ_FOLDER);
  try {
    const files = await fs.readdir(publishedPath);
    const quizFile = files.find(f => f.startsWith(quizId) && f.endsWith('.json'));

    if (!quizFile) return; // No published version to backup

    const sourcePath = path.join(publishedPath, quizFile);
    const content = await fs.readFile(sourcePath, 'utf-8');

    // Create backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(
      process.cwd(),
      BACKUP_FOLDER,
      `${quizId}.${timestamp}.backup.json`
    );

    await fs.writeFile(backupPath, content, 'utf-8');
    console.log(`Created backup: ${backupPath}`);

    // Clean up old backups (keep only maxBackups)
    await cleanupOldBackups(quizId, 5);
  } catch (error) {
    console.error(`Error creating backup for ${quizId}:`, error);
  }
}

/**
 * Clean up old backups, keeping only the most recent N
 */
async function cleanupOldBackups(quizId: string, maxBackups: number): Promise<void> {
  try {
    const backupPath = path.join(process.cwd(), BACKUP_FOLDER);
    const files = await fs.readdir(backupPath);
    const backupFiles = files
      .filter(f => f.startsWith(quizId) && f.endsWith('.backup.json'))
      .map(async f => {
        const stats = await fs.stat(path.join(backupPath, f));
        return { name: f, mtime: stats.mtime };
      });

    const filesWithStats = await Promise.all(backupFiles);
    const sorted = filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Delete old backups beyond maxBackups
    for (let i = maxBackups; i < sorted.length; i++) {
      await fs.unlink(path.join(backupPath, sorted[i].name));
      console.log(`Deleted old backup: ${sorted[i].name}`);
    }
  } catch (error) {
    console.error(`Error cleaning up backups for ${quizId}:`, error);
  }
}

/**
 * Validate a quiz and return detailed errors/warnings
 */
export async function validateQuizData(quiz: RawQuizData): Promise<ValidationResult> {
  const result = validateQuiz(quiz);

  const errors: Array<{ severity: 'error' | 'warning' | 'info'; field: string; message: string }> = [];

  // Add errors
  result.errors.forEach(e => {
    errors.push({ severity: 'error', field: e.field, message: e.message });
  });

  // Add warnings
  result.warnings.forEach(w => {
    errors.push({ severity: 'warning', field: w.field, message: w.message });
  });

  // Add info messages for missing adaptive features
  if (quiz.questions) {
    quiz.questions.forEach((q, idx) => {
      if (!q.meta?.difficulty) {
        errors.push({
          severity: 'info',
          field: `questions[${idx}].meta.difficulty`,
          message: `Question ${idx + 1}: Difficulty not set (needed for adaptive mode)`,
        });
      }
      if (!q.meta?.category) {
        errors.push({
          severity: 'info',
          field: `questions[${idx}].meta.category`,
          message: `Question ${idx + 1}: Category not set (defaults to "general")`,
        });
      }
    });
  }

  return {
    valid: result.valid,
    errors,
  };
}

/**
 * Duplicate a quiz with a new ID
 */
export async function duplicateQuiz(sourceQuizId: string, newQuizId: string): Promise<void> {
  const sourceQuiz = await getQuizForEditing(sourceQuizId);
  if (!sourceQuiz) {
    throw new Error(`Source quiz "${sourceQuizId}" not found`);
  }

  // Create new quiz with updated ID and title
  const newQuiz: RawQuizData = {
    ...sourceQuiz,
    id: newQuizId,
    title: `${sourceQuiz.title} (Copy)`,
    version: 1,
  };

  await createQuiz(newQuiz, true);
}

/**
 * Import a quiz from JSON string
 */
export async function importQuiz(jsonString: string, saveAsDraft = true): Promise<string> {
  const quiz = JSON.parse(jsonString) as RawQuizData;

  if (!quiz.id) {
    throw new Error('Imported quiz must have an ID');
  }

  // Check if quiz already exists
  const existing = await getQuizForEditing(quiz.id);
  if (existing) {
    // Generate new ID with suffix
    const timestamp = Date.now();
    quiz.id = `${quiz.id}_${timestamp}`;
  }

  await createQuiz(quiz, saveAsDraft);
  return quiz.id;
}

/**
 * Export a quiz as JSON string
 */
export async function exportQuiz(quizId: string): Promise<string> {
  const quiz = await getQuizForEditing(quizId);
  if (!quiz) {
    throw new Error(`Quiz "${quizId}" not found`);
  }

  return JSON.stringify(quiz, null, 2);
}
