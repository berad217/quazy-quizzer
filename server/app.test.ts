import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';
import type { AppConfig } from '../src/config/types.js';
import type { QuizRegistry, QuizSet } from '../src/quiz-engine/schema.js';

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
});
