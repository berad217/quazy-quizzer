import express from 'express';
import cors from 'cors';
import type { AppConfig } from '../src/config/types.js';

/**
 * Creates and configures the Express application
 * Separated from server startup for testing purposes
 */
export function createApp(config: AppConfig) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API Routes

  /**
   * GET /api/config
   * Returns the application configuration
   */
  app.get('/api/config', (req, res) => {
    res.json(config);
  });

  /**
   * GET /api/health
   * Health check endpoint
   */
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}
