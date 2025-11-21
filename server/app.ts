import express from 'express';
import cors from 'cors';
import type { AppConfig } from '../src/config/types.js';
import type { QuizRegistry } from '../src/quiz-engine/schema.js';

/**
 * Creates and configures the Express application
 * Separated from server startup for testing purposes
 */
export function createApp(config: AppConfig, quizRegistry: QuizRegistry) {
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

  /**
   * GET /api/quizzes
   * Returns all available quizzes
   */
  app.get('/api/quizzes', (req, res) => {
    res.json(quizRegistry.all);
  });

  /**
   * GET /api/quizzes/:id
   * Returns a specific quiz by ID
   */
  app.get('/api/quizzes/:id', (req, res) => {
    const quiz = quizRegistry.byId[req.params.id];
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(quiz);
  });

  return app;
}
