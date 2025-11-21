/**
 * SessionStart Component
 *
 * Allows user to select quizzes and start a new quiz session
 */

import React, { useState, useEffect } from 'react';
import { QuizSet } from '../quiz-engine/schema';
import { AppConfig } from '../config/types';

interface SessionStartProps {
  config: AppConfig;
  onSessionStart: (sessionId: string) => void;
}

export function SessionStart({ config, onSessionStart }: SessionStartProps) {
  const [quizzes, setQuizzes] = useState<QuizSet[]>([]);
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([]);
  const [userId, setUserId] = useState('user1'); // Default user for now
  const [randomize, setRandomize] = useState(config.features.randomizeOrderByDefault);
  const [limit, setLimit] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = config.themes[config.defaultTheme];

  useEffect(() => {
    // Load available quizzes
    fetch('/api/quizzes')
      .then((res) => res.json())
      .then((data) => setQuizzes(data))
      .catch((err) => setError(`Failed to load quizzes: ${err.message}`));
  }, []);

  const handleQuizToggle = (quizId: string) => {
    setSelectedQuizIds((prev) =>
      prev.includes(quizId)
        ? prev.filter((id) => id !== quizId)
        : [...prev, quizId]
    );
  };

  const handleStartSession = async () => {
    if (selectedQuizIds.length === 0) {
      setError('Please select at least one quiz');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          selectedQuizIds,
          randomize,
          limit: limit && limit > 0 ? limit : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const session = await response.json();
      onSessionStart(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  if (error && quizzes.length === 0) {
    return (
      <div style={{ padding: '2rem', color: theme.text }}>
        <h2 style={{ color: 'red' }}>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
        color: theme.text,
      }}
    >
      <h1 style={{ color: theme.accent }}>Start a Quiz</h1>

      {error && (
        <div
          style={{
            backgroundColor: '#fee',
            color: '#c00',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          backgroundColor: theme.panel,
          padding: '1.5rem',
          borderRadius: '8px',
          marginTop: '1rem',
        }}
      >
        <h2>Select Quizzes</h2>
        {quizzes.length === 0 ? (
          <p>No quizzes available. Add quiz files to the /quizzes folder.</p>
        ) : (
          <div>
            {quizzes.map((quiz) => (
              <label
                key={quiz.id}
                style={{
                  display: 'block',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  backgroundColor: selectedQuizIds.includes(quiz.id)
                    ? theme.accent + '22'
                    : 'transparent',
                  border: `1px solid ${theme.accent}44`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedQuizIds.includes(quiz.id)}
                  onChange={() => handleQuizToggle(quiz.id)}
                  style={{ marginRight: '0.75rem' }}
                />
                <strong>{quiz.title}</strong>
                {quiz.description && (
                  <span style={{ marginLeft: '0.5rem', opacity: 0.8 }}>
                    - {quiz.description}
                  </span>
                )}
                <span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>
                  ({quiz.questions.length} questions)
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: theme.panel,
          padding: '1.5rem',
          borderRadius: '8px',
          marginTop: '1rem',
        }}
      >
        <h2>Options</h2>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            User ID:
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              borderRadius: '4px',
              border: `1px solid ${theme.accent}44`,
              backgroundColor: theme.background,
              color: theme.text,
              width: '200px',
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={randomize}
              onChange={(e) => setRandomize(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            Randomize question order
          </label>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Limit questions (optional):
          </label>
          <input
            type="number"
            min="1"
            value={limit || ''}
            onChange={(e) =>
              setLimit(e.target.value ? parseInt(e.target.value) : undefined)
            }
            placeholder="No limit"
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              borderRadius: '4px',
              border: `1px solid ${theme.accent}44`,
              backgroundColor: theme.background,
              color: theme.text,
              width: '120px',
            }}
          />
        </div>
      </div>

      <button
        onClick={handleStartSession}
        disabled={loading || selectedQuizIds.length === 0}
        style={{
          marginTop: '1.5rem',
          padding: '1rem 2rem',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          backgroundColor: theme.accent,
          color: theme.background,
          border: 'none',
          borderRadius: '6px',
          cursor: loading || selectedQuizIds.length === 0 ? 'not-allowed' : 'pointer',
          opacity: loading || selectedQuizIds.length === 0 ? 0.5 : 1,
        }}
      >
        {loading ? 'Starting...' : 'Start Quiz'}
      </button>
    </div>
  );
}
