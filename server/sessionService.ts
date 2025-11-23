/**
 * Session Service
 *
 * Manages quiz sessions in memory.
 * In a production app, this would persist to a database or file.
 */

import {
  Session,
  createSession,
  updateAnswer,
  gradeSession,
  completeSession,
  getSessionProgress,
  CreateSessionOptions,
  AnswerValue,
  GradingResult,
} from '../src/quiz-engine/session.js';
import { QuizRegistry } from '../src/quiz-engine/schema.js';
import { GradingConfig } from '../src/config/types.js';

/**
 * In-memory session store
 */
class SessionStore {
  private sessions: Map<string, Session> = new Map();

  /**
   * Creates a new session
   */
  create(registry: QuizRegistry, options: CreateSessionOptions): Session {
    const session = createSession(registry, options);
    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Gets a session by ID
   */
  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Gets all sessions for a user
   */
  getByUser(userId: string): Session[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId
    );
  }

  /**
   * Updates an answer in a session
   */
  updateAnswer(sessionId: string, compositeKey: string, value: AnswerValue): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    updateAnswer(session, compositeKey, value);
  }

  /**
   * Grades a session
   */
  grade(sessionId: string, gradingConfig: GradingConfig): GradingResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return gradeSession(session, gradingConfig);
  }

  /**
   * Marks a session as complete
   */
  complete(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    completeSession(session);
  }

  /**
   * Gets session progress
   */
  getProgress(sessionId: string): ReturnType<typeof getSessionProgress> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return getSessionProgress(session);
  }

  /**
   * Deletes a session
   */
  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Gets all sessions (for debugging/admin)
   */
  getAll(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clears all sessions (for testing)
   */
  clear(): void {
    this.sessions.clear();
  }
}

// Export singleton instance
export const sessionStore = new SessionStore();
