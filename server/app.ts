import express from 'express';
import cors from 'cors';
import type { AppConfig } from '../src/config/types.js';
import type { QuizRegistry } from '../src/quiz-engine/schema.js';
import { sessionStore } from './sessionService.js';

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

  /**
   * POST /api/sessions
   * Creates a new quiz session
   * Body: { userId, selectedQuizIds, randomize?, limit? }
   */
  app.post('/api/sessions', (req, res) => {
    try {
      const { userId, selectedQuizIds, randomize, limit } = req.body;

      if (!userId || !selectedQuizIds || !Array.isArray(selectedQuizIds)) {
        return res.status(400).json({
          error: 'userId and selectedQuizIds (array) are required',
        });
      }

      const session = sessionStore.create(quizRegistry, {
        userId,
        selectedQuizIds,
        randomize,
        limit,
      });

      res.status(201).json(session);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/sessions/:id
   * Gets a session by ID
   */
  app.get('/api/sessions/:id', (req, res) => {
    const session = sessionStore.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  });

  /**
   * GET /api/sessions/user/:userId
   * Gets all sessions for a user
   */
  app.get('/api/sessions/user/:userId', (req, res) => {
    const sessions = sessionStore.getByUser(req.params.userId);
    res.json(sessions);
  });

  /**
   * POST /api/sessions/:id/answer
   * Submits an answer for a question in a session
   * Body: { compositeKey, value }
   */
  app.post('/api/sessions/:id/answer', (req, res) => {
    try {
      const { compositeKey, value } = req.body;

      if (!compositeKey || value === undefined) {
        return res.status(400).json({
          error: 'compositeKey and value are required',
        });
      }

      sessionStore.updateAnswer(req.params.id, compositeKey, value);
      const session = sessionStore.get(req.params.id);

      res.json(session);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('not found')
      ) {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/sessions/:id/grade
   * Grades all answers in a session
   */
  app.post('/api/sessions/:id/grade', (req, res) => {
    try {
      const result = sessionStore.grade(req.params.id);
      res.json(result);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('not found')
      ) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/sessions/:id/complete
   * Marks a session as complete
   */
  app.post('/api/sessions/:id/complete', (req, res) => {
    try {
      sessionStore.complete(req.params.id);
      const session = sessionStore.get(req.params.id);
      res.json(session);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('not found')
      ) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/sessions/:id/progress
   * Gets progress for a session
   */
  app.get('/api/sessions/:id/progress', (req, res) => {
    try {
      const progress = sessionStore.getProgress(req.params.id);
      res.json(progress);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('not found')
      ) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return app;
}
