import { describe, it, expect } from 'vitest';
import {
  mergeConfigWithDefaults,
  getTheme,
  validateConfig,
} from './configLoader';
import { AppConfig } from './types';
import { DEFAULT_CONFIG } from './defaults';

describe('configLoader', () => {
  describe('mergeConfigWithDefaults', () => {
    it('should return default config when given empty object', () => {
      const result = mergeConfigWithDefaults({});
      expect(result).toEqual(DEFAULT_CONFIG);
    });

    it('should preserve all default values when partial config provided', () => {
      const partial = { appName: 'Custom Quiz' };
      const result = mergeConfigWithDefaults(partial);

      expect(result.appName).toBe('Custom Quiz');
      expect(result.defaultTheme).toBe(DEFAULT_CONFIG.defaultTheme);
      expect(result.themes).toEqual(DEFAULT_CONFIG.themes);
      expect(result.features).toEqual(DEFAULT_CONFIG.features);
    });

    it('should deep merge nested objects', () => {
      const partial = {
        features: {
          allowQuestionJump: false,
          // Other features not specified
        },
      };
      const result = mergeConfigWithDefaults(partial);

      expect(result.features.allowQuestionJump).toBe(false);
      expect(result.features.allowReviewMode).toBe(
        DEFAULT_CONFIG.features.allowReviewMode
      );
      expect(result.features.showQuestionProgress).toBe(
        DEFAULT_CONFIG.features.showQuestionProgress
      );
    });

    it('should preserve unknown keys (per spec: ignore, do not crash)', () => {
      const partial = {
        appName: 'Test',
        unknownKey: 'should be preserved',
        nested: {
          alsoUnknown: 'also preserved',
        },
      } as any;

      const result = mergeConfigWithDefaults(partial);

      expect((result as any).unknownKey).toBe('should be preserved');
      expect((result as any).nested.alsoUnknown).toBe('also preserved');
    });

    it('should override entire theme objects when provided', () => {
      const customTheme = {
        background: '#000000',
        panel: '#111111',
        accent: '#ff0000',
        text: '#ffffff',
        fontFamily: 'Comic Sans',
        questionTextSize: 20,
        sidebarWidth: 300,
      };

      const partial = {
        themes: {
          custom: customTheme,
        },
      };

      const result = mergeConfigWithDefaults(partial);

      expect(result.themes.custom).toEqual(customTheme);
      expect(result.themes.dark).toEqual(DEFAULT_CONFIG.themes.dark);
    });

    it('should handle partial theme overrides', () => {
      const partial = {
        themes: {
          dark: {
            accent: '#ff00ff', // Override just the accent color
          },
        },
      };

      const result = mergeConfigWithDefaults(partial);

      expect(result.themes.dark.accent).toBe('#ff00ff');
      expect(result.themes.dark.background).toBe(
        DEFAULT_CONFIG.themes.dark.background
      );
    });

    it('should handle array values without merging', () => {
      const partial = {
        features: {
          customArray: ['a', 'b', 'c'],
        },
      } as any;

      const result = mergeConfigWithDefaults(partial);
      expect((result.features as any).customArray).toEqual(['a', 'b', 'c']);
    });
  });

  describe('getTheme', () => {
    it('should return requested theme when it exists', () => {
      const theme = getTheme(DEFAULT_CONFIG, 'dark');
      expect(theme).toEqual(DEFAULT_CONFIG.themes.dark);
    });

    it('should return default theme when no theme name specified', () => {
      const theme = getTheme(DEFAULT_CONFIG);
      expect(theme).toEqual(DEFAULT_CONFIG.themes[DEFAULT_CONFIG.defaultTheme]);
    });

    it('should fall back to default theme when requested theme does not exist', () => {
      const theme = getTheme(DEFAULT_CONFIG, 'nonexistent');
      expect(theme).toEqual(DEFAULT_CONFIG.themes[DEFAULT_CONFIG.defaultTheme]);
    });

    it('should work with custom themes', () => {
      const customTheme = {
        background: '#000',
        panel: '#111',
        accent: '#f00',
        text: '#fff',
        fontFamily: 'Arial',
        questionTextSize: 18,
        sidebarWidth: 250,
      };

      const customConfig: AppConfig = {
        ...DEFAULT_CONFIG,
        themes: {
          ...DEFAULT_CONFIG.themes,
          custom: customTheme,
        },
      };

      const theme = getTheme(customConfig, 'custom');
      expect(theme).toEqual(customTheme);
    });
  });

  describe('validateConfig', () => {
    it('should return empty array for valid config', () => {
      const warnings = validateConfig(DEFAULT_CONFIG);
      expect(warnings).toEqual([]);
    });

    it('should warn when no themes defined', () => {
      const config = {
        ...DEFAULT_CONFIG,
        themes: {},
      };
      const warnings = validateConfig(config);

      // Should get 2 warnings: no themes + default theme not found
      expect(warnings.length).toBeGreaterThanOrEqual(1);
      expect(warnings.some(w => w.includes('No themes defined'))).toBe(true);
    });

    it('should warn when default theme not found in themes', () => {
      const config = {
        defaultTheme: 'nonexistent',
        themes: {
          dark: DEFAULT_CONFIG.themes.dark,
        },
      };
      const warnings = validateConfig(config);

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('Default theme "nonexistent" not found');
    });

    it('should return multiple warnings when multiple issues exist', () => {
      const config = {
        defaultTheme: 'missing',
        themes: {},
      };
      const warnings = validateConfig(config);

      expect(warnings.length).toBeGreaterThan(1);
    });

    it('should not warn for partial configs with valid structure', () => {
      const config = {
        appName: 'Test',
        themes: {
          dark: DEFAULT_CONFIG.themes.dark,
        },
      };
      const warnings = validateConfig(config);

      expect(warnings).toEqual([]);
    });
  });
});
