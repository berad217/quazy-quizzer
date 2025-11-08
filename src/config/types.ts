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
}
