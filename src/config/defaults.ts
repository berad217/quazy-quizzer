import { AppConfig } from './types';

/**
 * Default configuration values
 * Used when config file is missing or has missing keys
 */
export const DEFAULT_CONFIG: AppConfig = {
  appName: 'Local Quiz Hub',
  defaultTheme: 'dark',
  themes: {
    dark: {
      background: '#0f172a',
      panel: '#111827',
      accent: '#22c55e',
      text: '#e5e7eb',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      questionTextSize: 16,
      sidebarWidth: 260,
    },
    light: {
      background: '#f9fafb',
      panel: '#ffffff',
      accent: '#2563eb',
      text: '#111827',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      questionTextSize: 16,
      sidebarWidth: 260,
    },
  },
  quizFolder: './quizzes',
  userDataFile: './users/users.json',
  features: {
    allowQuestionJump: true,
    allowReviewMode: true,
    randomizeOrderByDefault: true,
    showQuestionProgress: true,
    allowMultipleProfiles: true,
    trackPerQuestionStats: true,
    showCorrectAnswersToggle: true,
  },
  grading: {
    enableFuzzyMatching: true,
    fuzzyMatchThreshold: 0.8,
    enablePartialCredit: false,
    partialCreditThreshold: 0.6,
    partialCreditValue: 0.5,
  },
  adaptive: {
    enabled: true,
    defaultTargetAccuracy: 0.7,
    adjustmentSpeed: 0.5,
    minQuestionsForAdaptation: 5,
    categoryDetection: 'auto',
  },
  authoring: {
    enabled: true,
    requireAuth: false,
    autoSaveDrafts: true,
    keepBackups: true,
    maxBackupsPerQuiz: 5,
  },
};
