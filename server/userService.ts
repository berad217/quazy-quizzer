/**
 * User Service
 *
 * Handles user profile persistence to users.json file
 */

import { promises as fs } from 'fs';
import path from 'path';
import { UserProfile, UserData, QuizCompletionStats, QuestionPerformance } from '../src/storage/userProfile.js';

const USERS_FILE = path.join(process.cwd(), 'users', 'users.json');

/**
 * Ensures users directory and file exist
 */
async function ensureUsersFile(): Promise<void> {
  const usersDir = path.dirname(USERS_FILE);

  try {
    await fs.access(usersDir);
  } catch {
    console.log('Creating users directory...');
    await fs.mkdir(usersDir, { recursive: true });
  }

  try {
    await fs.access(USERS_FILE);
  } catch {
    console.log('Creating users.json file...');
    const initialData: UserData = { users: [] };
    await fs.writeFile(USERS_FILE, JSON.stringify(initialData, null, 2));
  }
}

/**
 * Loads all user profiles from disk
 */
export async function loadUsers(): Promise<UserProfile[]> {
  await ensureUsersFile();

  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    const userData: UserData = JSON.parse(data);
    return userData.users || [];
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
}

/**
 * Saves all user profiles to disk
 */
async function saveUsers(users: UserProfile[]): Promise<void> {
  await ensureUsersFile();

  const userData: UserData = { users };
  await fs.writeFile(USERS_FILE, JSON.stringify(userData, null, 2));
}

/**
 * Gets a user by ID
 */
export async function getUser(userId: string): Promise<UserProfile | null> {
  const users = await loadUsers();
  return users.find((u) => u.id === userId) || null;
}

/**
 * Creates a new user profile
 */
export async function createUser(id: string, name: string): Promise<UserProfile> {
  const users = await loadUsers();

  // Check if user already exists
  const existing = users.find((u) => u.id === id);
  if (existing) {
    throw new Error(`User with id "${id}" already exists`);
  }

  const newUser: UserProfile = {
    id,
    name,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    completedSets: {},
    questionHistory: {},
    settings: {},
  };

  users.push(newUser);
  await saveUsers(users);

  return newUser;
}

/**
 * Updates a user's last active timestamp
 */
export async function updateUserActivity(userId: string): Promise<void> {
  const users = await loadUsers();
  const user = users.find((u) => u.id === userId);

  if (user) {
    user.lastActiveAt = new Date().toISOString();
    await saveUsers(users);
  }
}

/**
 * Records a completed quiz session for a user
 */
export async function recordQuizCompletion(
  userId: string,
  quizIds: string[],
  score: number,
  totalQuestions: number,
  questionResults: {
    [compositeKey: string]: {
      isCorrect: boolean;
      userAnswer: any;
    };
  }
): Promise<void> {
  const users = await loadUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Update activity timestamp
  user.lastActiveAt = new Date().toISOString();

  // Update completion stats for each quiz
  for (const quizId of quizIds) {
    const existing = user.completedSets[quizId];

    if (existing) {
      user.completedSets[quizId] = {
        attempts: existing.attempts + 1,
        lastScore: score,
        bestScore: Math.max(existing.bestScore, score),
        lastCompletedAt: new Date().toISOString(),
      };
    } else {
      user.completedSets[quizId] = {
        attempts: 1,
        lastScore: score,
        bestScore: score,
        lastCompletedAt: new Date().toISOString(),
      };
    }
  }

  // Update per-question history
  for (const [compositeKey, result] of Object.entries(questionResults)) {
    const existing = user.questionHistory[compositeKey];

    if (existing) {
      user.questionHistory[compositeKey] = {
        timesSeen: existing.timesSeen + 1,
        timesCorrect: existing.timesCorrect + (result.isCorrect ? 1 : 0),
        lastAnswer: result.userAnswer,
        lastResult: result.isCorrect ? 'correct' : 'incorrect',
      };
    } else {
      user.questionHistory[compositeKey] = {
        timesSeen: 1,
        timesCorrect: result.isCorrect ? 1 : 0,
        lastAnswer: result.userAnswer,
        lastResult: result.isCorrect ? 'correct' : 'incorrect',
      };
    }
  }

  await saveUsers(users);
}

/**
 * Updates user settings
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<{ theme: string; fontScale: number }>
): Promise<void> {
  const users = await loadUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  user.settings = { ...user.settings, ...settings };
  await saveUsers(users);
}

/**
 * Deletes a user profile
 */
export async function deleteUser(userId: string): Promise<boolean> {
  const users = await loadUsers();
  const index = users.findIndex((u) => u.id === userId);

  if (index === -1) {
    return false;
  }

  users.splice(index, 1);
  await saveUsers(users);
  return true;
}
