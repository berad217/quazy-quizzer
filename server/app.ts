import express from 'express';
import cors from 'cors';
import type { AppConfig } from '../src/config/types.js';
import type { QuizRegistry } from '../src/quiz-engine/schema.js';
import { sessionStore } from './sessionService.js';
import * as userService from './userService.js';
import * as authoringService from './authoringService.js';

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
   * Body: { userId, selectedQuizIds, randomize?, limit?, adaptive?, targetAccuracy? }
   */
  app.post('/api/sessions', (req, res) => {
    try {
      const { userId, selectedQuizIds, randomize, limit, adaptive, targetAccuracy } = req.body;

      if (!userId || !selectedQuizIds || !Array.isArray(selectedQuizIds)) {
        return res.status(400).json({
          error: 'userId and selectedQuizIds (array) are required',
        });
      }

      // Get user profile for adaptive mode
      let userSkills;
      if (adaptive && config.adaptive.enabled) {
        const user = userService.getUser(userId);
        userSkills = user?.skillLevels || {};
      }

      const session = sessionStore.create(quizRegistry, {
        userId,
        selectedQuizIds,
        randomize,
        limit,
        adaptive: adaptive && config.adaptive.enabled,
        targetAccuracy: targetAccuracy || config.adaptive.defaultTargetAccuracy,
        userSkills,
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
      const result = sessionStore.grade(req.params.id, config.grading);
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
   * Marks a session as complete and records stats to user profile
   */
  app.post('/api/sessions/:id/complete', async (req, res) => {
    try {
      // First, get the grading results
      const gradingResult = sessionStore.grade(req.params.id, config.grading);
      const session = sessionStore.get(req.params.id);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Mark session as complete
      sessionStore.complete(req.params.id);

      // Record completion to user profile
      try {
        await userService.recordQuizCompletion(
          session.userId,
          session.quizIds,
          gradingResult.totalCorrect,
          gradingResult.totalQuestions,
          gradingResult.perQuestion
        );
      } catch (userError) {
        console.error('Failed to record quiz completion for user:', userError);
        // Continue anyway - session is still completed
      }

      // Update user skill levels (Sprint 8)
      if (config.adaptive.enabled) {
        try {
          const questionResults: { [compositeKey: string]: { question: any; score: number } } = {};

          for (const sessionQuestion of session.questions) {
            const result = gradingResult.perQuestion[sessionQuestion.compositeKey];
            if (result) {
              questionResults[sessionQuestion.compositeKey] = {
                question: sessionQuestion.question,
                score: result.score !== undefined ? result.score : (result.isCorrect ? 1 : 0)
              };
            }
          }

          const adjustmentSpeed = config.adaptive.adjustmentSpeed * 64; // Convert 0-1 to K factor (0-64)
          await userService.updateUserSkills(session.userId, questionResults, adjustmentSpeed);
        } catch (skillError) {
          console.error('Failed to update user skills:', skillError);
          // Continue anyway - session is still completed
        }
      }

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

  /**
   * GET /api/users
   * Gets all user profiles
   */
  app.get('/api/users', async (req, res) => {
    try {
      const users = await userService.loadUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/users/:id
   * Gets a specific user profile
   */
  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await userService.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/users
   * Creates a new user profile
   * Body: { id, name }
   */
  app.post('/api/users', async (req, res) => {
    try {
      const { id, name } = req.body;

      if (!id || !name) {
        return res.status(400).json({
          error: 'id and name are required',
        });
      }

      const user = await userService.createUser(id, name);
      res.status(201).json(user);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('already exists')
      ) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * DELETE /api/users/:id
   * Deletes a user profile
   */
  app.delete('/api/users/:id', async (req, res) => {
    try {
      const deleted = await userService.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * PUT /api/users/:id/settings
   * Updates user settings
   * Body: { theme?, fontScale? }
   */
  app.put('/api/users/:id/settings', async (req, res) => {
    try {
      const { theme, fontScale } = req.body;
      await userService.updateUserSettings(req.params.id, {
        theme,
        fontScale,
      });
      const user = await userService.getUser(req.params.id);
      res.json(user);
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

  // ========== Quiz Authoring API ==========

  /**
   * GET /api/author/quizzes
   * Lists all quizzes (published and drafts)
   */
  app.get('/api/author/quizzes', async (req, res) => {
    try {
      const includeDrafts = req.query.includeDrafts !== 'false';
      const quizzes = await authoringService.listQuizzes(includeDrafts);
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/author/quizzes/:id
   * Gets a quiz by ID for editing
   */
  app.get('/api/author/quizzes/:id', async (req, res) => {
    try {
      const quiz = await authoringService.getQuizForEditing(req.params.id);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/author/quizzes
   * Creates a new quiz
   * Body: { quiz: RawQuizData, saveAsDraft?: boolean }
   */
  app.post('/api/author/quizzes', async (req, res) => {
    try {
      const { quiz, saveAsDraft = true } = req.body;

      if (!quiz || !quiz.id) {
        return res.status(400).json({
          error: 'Quiz data with ID is required',
        });
      }

      await authoringService.createQuiz(quiz, saveAsDraft);
      res.status(201).json({ success: true, id: quiz.id });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('already exists')
      ) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * PUT /api/author/quizzes/:id
   * Updates an existing quiz
   * Body: { quiz: RawQuizData, saveAsDraft?: boolean, createBackup?: boolean }
   */
  app.put('/api/author/quizzes/:id', async (req, res) => {
    try {
      const { quiz, saveAsDraft = true, createBackup = true } = req.body;

      if (!quiz) {
        return res.status(400).json({
          error: 'Quiz data is required',
        });
      }

      await authoringService.updateQuiz(req.params.id, quiz, saveAsDraft, createBackup);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/author/quizzes/:id/publish
   * Publishes a draft quiz
   */
  app.post('/api/author/quizzes/:id/publish', async (req, res) => {
    try {
      await authoringService.publishQuiz(req.params.id);
      res.json({ success: true });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('validation errors')
      ) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * DELETE /api/author/quizzes/:id
   * Deletes a quiz
   */
  app.delete('/api/author/quizzes/:id', async (req, res) => {
    try {
      const deleteDraft = req.query.deleteDraft !== 'false';
      await authoringService.deleteQuiz(req.params.id, deleteDraft);
      res.json({ success: true });
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
   * POST /api/author/quizzes/:id/validate
   * Validates a quiz and returns errors/warnings
   */
  app.post('/api/author/quizzes/:id/validate', async (req, res) => {
    try {
      const { quiz } = req.body;

      if (!quiz) {
        return res.status(400).json({
          error: 'Quiz data is required',
        });
      }

      const validation = await authoringService.validateQuizData(quiz);
      res.json(validation);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/author/quizzes/:id/duplicate
   * Duplicates a quiz with a new ID
   * Body: { newQuizId: string }
   */
  app.post('/api/author/quizzes/:id/duplicate', async (req, res) => {
    try {
      const { newQuizId } = req.body;

      if (!newQuizId) {
        return res.status(400).json({
          error: 'newQuizId is required',
        });
      }

      await authoringService.duplicateQuiz(req.params.id, newQuizId);
      res.json({ success: true, newQuizId });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/author/import
   * Imports a quiz from JSON
   * Body: { jsonString: string, saveAsDraft?: boolean }
   */
  app.post('/api/author/import', async (req, res) => {
    try {
      const { jsonString, saveAsDraft = true } = req.body;

      if (!jsonString) {
        return res.status(400).json({
          error: 'jsonString is required',
        });
      }

      const quizId = await authoringService.importQuiz(jsonString, saveAsDraft);
      res.json({ success: true, quizId });
    } catch (error) {
      if (error instanceof SyntaxError) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/author/quizzes/:id/export
   * Exports a quiz as JSON
   */
  app.get('/api/author/quizzes/:id/export', async (req, res) => {
    try {
      const jsonString = await authoringService.exportQuiz(req.params.id);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${req.params.id}.json"`);
      res.send(jsonString);
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
