/**
 * Theme Context
 *
 * Provides theme values to all UI components based on user preference or default
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfig, ThemeConfig } from '../config/types';

interface ThemeContextValue {
  theme: ThemeConfig;
  themeName: string;
  setThemeName: (name: string) => void;
  config: AppConfig;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  config: AppConfig;
  userTheme?: string;
  onThemeChange?: (themeName: string) => void;
  children: ReactNode;
}

export function ThemeProvider({ config, userTheme, onThemeChange, children }: ThemeProviderProps) {
  // Use user theme if provided, otherwise use default from config
  const [themeName, setThemeNameState] = useState<string>(
    userTheme || config.defaultTheme
  );

  // Get the theme object from config
  const theme = config.themes[themeName] || config.themes[config.defaultTheme];

  const setThemeName = (name: string) => {
    setThemeNameState(name);
    if (onThemeChange) {
      onThemeChange(name);
    }
  };

  // Update theme when userTheme prop changes
  useEffect(() => {
    if (userTheme) {
      setThemeNameState(userTheme);
    }
  }, [userTheme]);

  const value: ThemeContextValue = {
    theme,
    themeName,
    setThemeName,
    config,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
