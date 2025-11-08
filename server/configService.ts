import fs from 'fs/promises';
import path from 'path';
import { AppConfig } from '../src/config/types.js';
import { mergeConfigWithDefaults, validateConfig } from '../src/config/configLoader.js';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'app.config.json');

/**
 * Loads application config from file system
 * Falls back to defaults if file doesn't exist or is invalid
 */
export async function loadConfig(): Promise<AppConfig> {
  try {
    const fileContent = await fs.readFile(CONFIG_PATH, 'utf-8');
    const loadedConfig = JSON.parse(fileContent) as Partial<AppConfig>;

    // Validate and log warnings
    const warnings = validateConfig(loadedConfig);
    if (warnings.length > 0) {
      console.warn('Config validation warnings:');
      warnings.forEach((warning) => console.warn(`  - ${warning}`));
    }

    // Merge with defaults
    const config = mergeConfigWithDefaults(loadedConfig);
    console.log(`✓ Config loaded from ${CONFIG_PATH}`);
    return config;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`Config file not found at ${CONFIG_PATH}, using defaults`);
    } else {
      console.error('Error loading config:', error);
      console.warn('Using default config');
    }
    return DEFAULT_CONFIG;
  }
}

/**
 * Reloads config from disk (useful for development)
 */
export async function reloadConfig(): Promise<AppConfig> {
  console.log('Reloading config...');
  return loadConfig();
}
