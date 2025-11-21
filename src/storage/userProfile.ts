/**
 * User Profile Types
 *
 * Based on specification section 5
 */

/**
 * Quiz completion statistics for a user
 */
export interface QuizCompletionStats {
  attempts: number;
  lastScore: number;
  bestScore: number;
  lastCompletedAt: string; // ISO timestamp
}

/**
 * Per-question performance tracking
 */
export interface QuestionPerformance {
  timesSeen: number;
  timesCorrect: number;
  lastAnswer: any;
  lastResult: 'correct' | 'incorrect';
}

/**
 * User-specific settings
 */
export interface UserSettings {
  theme?: string;
  fontScale?: number;
}

/**
 * User Profile
 */
export interface UserProfile {
  id: string;
  name: string;
  createdAt: string; // ISO timestamp
  lastActiveAt: string; // ISO timestamp
  completedSets: {
    [quizId: string]: QuizCompletionStats;
  };
  questionHistory: {
    [compositeKey: string]: QuestionPerformance;
  };
  settings: UserSettings;
}

/**
 * User data file structure
 */
export interface UserData {
  users: UserProfile[];
}
