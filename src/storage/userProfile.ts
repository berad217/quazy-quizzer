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
 * Skill level for a specific category (Sprint 8)
 */
export interface SkillLevel {
  estimatedLevel: number;      // 1-5, Elo-like rating
  confidence: number;           // 0-1, how sure we are
  lastUpdated: string;          // ISO timestamp
  questionsAttempted: number;
  recentPerformance: number[];  // last 10 attempts (0 or 1)
}

/**
 * Adaptive difficulty preferences (Sprint 8)
 */
export interface AdaptivePreferences {
  enabled: boolean;                // User wants adaptive mode
  targetAccuracy: number;          // 0-1, desired accuracy
  adjustmentSpeed: number;         // 0-1, how fast to adapt
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
  // Sprint 8: Adaptive difficulty
  skillLevels?: {
    [category: string]: SkillLevel;
  };
  adaptivePreferences?: AdaptivePreferences;
}

/**
 * User data file structure
 */
export interface UserData {
  users: UserProfile[];
}
