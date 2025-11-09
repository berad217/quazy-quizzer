import { AppConfig, ThemeConfig, FeatureFlags } from './types';
import { DEFAULT_CONFIG } from './defaults';

/**
 * Deep merge utility that combines config objects
 * Missing keys are filled from defaults, unknown keys are preserved
 */
function deepMerge<T extends Record<string, any>>(
  defaults: T,
  override: Partial<T>
): T {
  const result = { ...defaults };

  for (const key in override) {
    const overrideValue = override[key];
    const defaultValue = defaults[key];

    if (
      overrideValue &&
      typeof overrideValue === 'object' &&
      !Array.isArray(overrideValue) &&
      defaultValue &&
      typeof defaultValue === 'object' &&
      !Array.isArray(defaultValue)
    ) {
      result[key] = deepMerge(defaultValue, overrideValue);
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue;
    }
  }

  return result;
}

/**
 * Validates and merges loaded config with defaults
 * Unknown keys are preserved (ignored, not removed)
 * Missing keys use defaults
 */
export function mergeConfigWithDefaults(
  loadedConfig: Partial<AppConfig>
): AppConfig {
  return deepMerge(DEFAULT_CONFIG, loadedConfig);
}

/**
 * Get a specific theme by name, falling back to default theme if not found
 */
export function getTheme(
  config: AppConfig,
  themeName?: string
): ThemeConfig {
  const targetTheme = themeName || config.defaultTheme;
  return config.themes[targetTheme] || config.themes[config.defaultTheme];
}

/**
 * Validate that required config structure exists
 * Returns array of warnings (empty if valid)
 */
export function validateConfig(config: Partial<AppConfig>): string[] {
  const warnings: string[] = [];

  if (!config.themes || Object.keys(config.themes).length === 0) {
    warnings.push('No themes defined in config, using defaults');
  }

  if (config.defaultTheme && config.themes && !config.themes[config.defaultTheme]) {
    warnings.push(
      `Default theme "${config.defaultTheme}" not found in themes, will fall back`
    );
  }

  return warnings;
}
