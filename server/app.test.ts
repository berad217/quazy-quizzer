import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';
import type { AppConfig } from '../src/config/types.js';
import type { QuizRegistry, QuizSet } from '../src/quiz-engine/schema.js';
import { sessionStore } from './sessionService.js';

// Empty quiz registry for tests that don't need quiz data
const emptyRegistry: QuizRegistry = { byId: {}, all: [] };

// Sample quiz data for testing
const sampleQuiz: QuizSet = {
  id: 'test_quiz_1',
  title: 'Test Quiz',
  description: 'A test quiz',
  tags: ['test'],
  questions: [
    {
      id: 'q1',
      type: 'multiple_choice_single',
      text: 'Test question?',
      choices: ['A', 'B', 'C'],
      correct: [0],
    },
  ],
};

const registryWithQuiz: QuizRegistry = {
  byId: { test_quiz_1: sampleQuiz },
  all: [sampleQuiz],
};

describe('Express API Server', () => {
  describe('GET /api/health', () => {
    it('should return 200 and health status', async () => {
      const app = createApp(DEFAULT_CONFIG, emptyRegistry);
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('GET /api/config', () => {
    it('should return 200 and the default config', async () => {
      const app = createApp(DEFAULT_CONFIG, emptyRegistry);
      const response = await request(app).get('/api/config');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(DEFAULT_CONFIG);
    });

    it('should return custom config when provided', async () => {
      const customConfig: AppConfig = {
        ...DEFAULT_CONFIG,
        appName: 'Custom Test App',
        defaultTheme: 'light',
      };

      const app = createApp(customConfig, emptyRegistry);
      const response = await request(app).get('/api/config');

      expect(response.status).toBe(200);
      expect(response.body.appName).toBe('Custom Test App');
      expect(response.body.defaultTheme).toBe('light');
    });

    it('should return correct theme configuration', async () => {
      const app = createApp(DEFAULT_CONFIG, emptyRegistry);
      const response = await request(app).get('/api/config');

      expect(response.status).toBe(200);
      expect(response.body.themes).toHaveProperty('dark');
      expect(response.body.themes).toHaveProperty('light');
      expect(response.body.themes.dark).toHaveProperty('background');
      expect(response.body.themes.dark).toHaveProperty('accent');
    });

    it('should return correct feature flags', async () => {
      const app = createApp(DEFAULT_CONFIG, emptyRegistry);
      const response = await request(app).get('/api/config');

      expect(response.status).toBe(200);
      expect(response.body.features).toEqual(DEFAULT_CONFIG.features);
      expect(response.body.features.allowQuestionJump).toBe(true);
      expect(response.body.features.randomizeOrderByDefault).toBe(true);
    });

    it('should return JSON content type', async () => {
      const app = createApp(DEFAULT_CONFIG, emptyRegistry);
      const response = await request(app).get('/api/config');

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('GET /api/quizzes', () => {
    it('should return empty array when no quizzes are loaded', async () => {
      const app = createApp(DEFAULT_CONFIG, emptyRegistry);
      const response = await request(app).get('/api/quizzes');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all quizzes when registry has quizzes', async () => {
      const app = createApp(DEFAULT_CONFIG, registryWithQuiz);
      const response = await request(app).get('/api/quizzes');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(sampleQuiz);
    });
  });

  describe('GET /api/quizzes/:id', () => {
    it('should return 404 when quiz not found', async () => {
      const app = createApp(DEFAULT_CONFIG, emptyRegistry);
      const response = await request(app).get('/api/quizzes/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Quiz not found');
    });

    it('should return quiz when found by ID', async () => {
      const app = createApp(DEFAULT_CONFIG, registryWithQuiz);
      const response = await request(app).get('/api/quizzes/test_quiz_1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(sampleQuiz);
    });

    it('should return correct quiz data structure', async () => {
      const app = createApp(DEFAULT_CONFIG, registryWithQuiz);
      const response = await request(app).get('/api/quizzes/test_quiz_1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('questions');
      expect(Array.isArray(response.body.questions)).toBe(true);
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const app = createApp(DEFAULT_CONFIG, emptyRegistry);
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('CORS', () => {
    it('should have CORS headers enabled', async () => {
      const app = createApp(DEFAULT_CONFIG, emptyRegistry);
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Session API', () => {
    beforeEach(() => {
      // Clear session store before each test to avoid interference
      sessionStore.clear();
    });

    describe('POST /api/sessions', () => {
      it('should create a new session', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);
        const response = await request(app).post('/api/sessions').send({
          userId: 'user1',
          selectedQuizIds: ['test_quiz_1'],
        });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('userId', 'user1');
        expect(response.body).toHaveProperty('quizIds');
        expect(response.body.quizIds).toEqual(['test_quiz_1']);
        expect(response.body).toHaveProperty('questions');
        expect(response.body.questions).toHaveLength(1);
        expect(response.body).toHaveProperty('answers');
        expect(response.body).toHaveProperty('createdAt');
      });

      it('should create session with randomize option', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);
        const response = await request(app).post('/api/sessions').send({
          userId: 'user1',
          selectedQuizIds: ['test_quiz_1'],
          randomize: true,
        });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });

      it('should create session with limit option', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);
        const response = await request(app).post('/api/sessions').send({
          userId: 'user1',
          selectedQuizIds: ['test_quiz_1'],
          limit: 1,
        });

        expect(response.status).toBe(201);
        expect(response.body.questions).toHaveLength(1);
      });

      it('should return 400 when userId is missing', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);
        const response = await request(app).post('/api/sessions').send({
          selectedQuizIds: ['test_quiz_1'],
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });

      it('should return 400 when selectedQuizIds is missing', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);
        const response = await request(app).post('/api/sessions').send({
          userId: 'user1',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });

      it('should return 400 for non-existent quiz', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);
        const response = await request(app).post('/api/sessions').send({
          userId: 'user1',
          selectedQuizIds: ['nonexistent'],
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/sessions/:id', () => {
      it('should get a session by ID', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);

        // Create a session first
        const createResponse = await request(app).post('/api/sessions').send({
          userId: 'user1',
          selectedQuizIds: ['test_quiz_1'],
        });
        const sessionId = createResponse.body.id;

        // Get the session
        const getResponse = await request(app).get(`/api/sessions/${sessionId}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.id).toBe(sessionId);
      });

      it('should return 404 for non-existent session', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);
        const response = await request(app).get('/api/sessions/nonexistent-id');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/sessions/user/:userId', () => {
      it('should get all sessions for a user', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);

        // Create two sessions for user1
        await request(app).post('/api/sessions').send({
          userId: 'user1',
          selectedQuizIds: ['test_quiz_1'],
        });
        await request(app).post('/api/sessions').send({
          userId: 'user1',
          selectedQuizIds: ['test_quiz_1'],
        });

        // Create one session for user2
        await request(app).post('/api/sessions').send({
          userId: 'user2',
          selectedQuizIds: ['test_quiz_1'],
        });

        // Get sessions for user1
        const response = await request(app).get('/api/sessions/user/user1');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(2);
        expect(response.body.every((s: any) => s.userId === 'user1')).toBe(true);
      });

      it('should return empty array for user with no sessions', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);
        const response = await request(app).get('/api/sessions/user/nonexistent');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
      });
    });

    describe('POST /api/sessions/:id/answer', () => {
      it('should submit an answer', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);

        // Create session
        const createResponse = await request(app).post('/api/sessions').send({
          userId: 'user1',
          selectedQuizIds: ['test_quiz_1'],
        });
        const sessionId = createResponse.body.id;
        const compositeKey = createResponse.body.questions[0].compositeKey;

        // Submit answer
        const answerResponse = await request(app)
          .post(`/api/sessions/${sessionId}/answer`)
          .send({
            compositeKey,
            value: 0,
          });

        expect(answerResponse.status).toBe(200);
        expect(answerResponse.body.answers[compositeKey]).toBeDefined();
        expect(answerResponse.body.answers[compositeKey].value).toBe(0);
      });

      it('should return 400 when compositeKey is missing', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);

        const createResponse = await request(app).post('/api/sessions').send({
          userId: 'user1',
          selectedQuizIds: ['test_quiz_1'],
        });
        const sessionId = createResponse.body.id;

        const response = await request(app)
          .post(`/api/sessions/${sessionId}/answer`)
          .send({ value: 0 });

        expect(response.status).toBe(400);
      });

      it('should return 404 for non-existent session', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);

        const response = await request(app)
          .post('/api/sessions/nonexistent/answer')
          .send({
            compositeKey: 'test::q1',
            value: 0,
          });

        expect(response.status).toBe(404);
      });
    });

    describe('POST /api/sessions/:id/grade', () => {
      it('should grade a session', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);

        // Create session
        const createResponse = await request(app).post('/api/sessions').send({
          userId: 'user1',
          selectedQuizIds: ['test_quiz_1'],
        });
        const sessionId = createResponse.body.id;
        const compositeKey = createResponse.body.questions[0].compositeKey;

        // Submit correct answer
        await request(app).post(`/api/sessions/${sessionId}/answer`).send({
          compositeKey,
          value: 0, // Correct answer
        });

        // Grade
        const gradeResponse = await request(app).post(
          `/api/sessions/${sessionId}/grade`
        );

        expect(gradeResponse.status).toBe(200);
        expect(gradeResponse.body).toHaveProperty('totalQuestions', 1);
        expect(gradeResponse.body).toHaveProperty('totalCorrect', 1);
        expect(gradeResponse.body).toHaveProperty('totalIncorrect', 0);
        expect(gradeResponse.body).toHaveProperty('score', 100);
        expect(gradeResponse.body).toHaveProperty('perQuestion');
      });

      it('should return 404 for non-existent session', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);
        const response = await request(app).post('/api/sessions/nonexistent/grade');

        expect(response.status).toBe(404);
      });
    });

    describe('POST /api/sessions/:id/complete', () => {
      it('should mark session as complete', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);

        // Create session
        const createResponse = await request(app).post('/api/sessions').send({
          userId: 'user1',
          selectedQuizIds: ['test_quiz_1'],
        });
        const sessionId = createResponse.body.id;

        // Complete
        const completeResponse = await request(app).post(
          `/api/sessions/${sessionId}/complete`
        );

        expect(completeResponse.status).toBe(200);
        expect(completeResponse.body).toHaveProperty('completedAt');
        expect(completeResponse.body.completedAt).toBeDefined();
      });

      it('should return 404 for non-existent session', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);
        const response = await request(app).post('/api/sessions/nonexistent/complete');

        expect(response.status).toBe(404);
      });
    });

    describe('GET /api/sessions/:id/progress', () => {
      it('should get session progress', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);

        // Create session
        const createResponse = await request(app).post('/api/sessions').send({
          userId: 'user1',
          selectedQuizIds: ['test_quiz_1'],
        });
        const sessionId = createResponse.body.id;
        const compositeKey = createResponse.body.questions[0].compositeKey;

        // Submit answer
        await request(app).post(`/api/sessions/${sessionId}/answer`).send({
          compositeKey,
          value: 0,
        });

        // Get progress
        const progressResponse = await request(app).get(
          `/api/sessions/${sessionId}/progress`
        );

        expect(progressResponse.status).toBe(200);
        expect(progressResponse.body).toHaveProperty('answered', 1);
        expect(progressResponse.body).toHaveProperty('total', 1);
        expect(progressResponse.body).toHaveProperty('percentComplete', 100);
      });

      it('should return 404 for non-existent session', async () => {
        const app = createApp(DEFAULT_CONFIG, registryWithQuiz);
        const response = await request(app).get('/api/sessions/nonexistent/progress');

        expect(response.status).toBe(404);
      });
    });
  });
});
