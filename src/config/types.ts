/**
 * Theme configuration for the application
 */
export interface ThemeConfig {
  background: string;
  panel: string;
  accent: string;
  text: string;
  fontFamily: string;
  questionTextSize: number;
  sidebarWidth: number;
}

/**
 * Feature flags for optional functionality
 */
export interface FeatureFlags {
  allowQuestionJump: boolean;
  allowReviewMode: boolean;
  randomizeOrderByDefault: boolean;
  showQuestionProgress: boolean;
  allowMultipleProfiles: boolean;
  trackPerQuestionStats: boolean;
  showCorrectAnswersToggle: boolean;
}

/**
 * Grading configuration for text answer evaluation
 */
export interface GradingConfig {
  enableFuzzyMatching: boolean;        // default: true
  fuzzyMatchThreshold: number;         // 0-1, default: 0.8 (80%)
  enablePartialCredit: boolean;        // default: false
  partialCreditThreshold: number;      // 0-1, default: 0.6 (60%)
  partialCreditValue: number;          // 0-1, default: 0.5 (50%)
}

/**
 * Adaptive difficulty configuration
 */
export interface AdaptiveConfig {
  enabled: boolean;                    // default: true
  defaultTargetAccuracy: number;       // 0-1, default: 0.7 (70%)
  adjustmentSpeed: number;             // 0-1, default: 0.5 (K factor of 32)
  minQuestionsForAdaptation: number;   // default: 5
  categoryDetection: 'auto' | 'manual'; // default: 'auto'
}

/**
 * Main application configuration
 */
export interface AppConfig {
  appName: string;
  defaultTheme: string;
  themes: {
    [themeName: string]: ThemeConfig;
  };
  quizFolder: string;
  userDataFile: string;
  features: FeatureFlags;
  grading: GradingConfig;
  adaptive: AdaptiveConfig;
}
