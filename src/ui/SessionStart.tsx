/**
 * SessionStart Component
 *
 * Allows user to select quizzes and start a new quiz session
 */

import React, { useState, useEffect } from 'react';
import { QuizSet } from '../quiz-engine/schema';
import { UserProfile } from '../storage/userProfile';
import { useTheme } from './ThemeContext';

interface SessionStartProps {
  onSessionStart: (sessionId: string, userId: string) => void;
  onUserChange: (userId: string) => void;
  currentUserId: string | null;
  onEnterAuthoring?: () => void;
}

export function SessionStart({ onSessionStart, onUserChange, currentUserId, onEnterAuthoring }: SessionStartProps) {
  const { theme, themeName, setThemeName, config } = useTheme();
  const [quizzes, setQuizzes] = useState<QuizSet[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newUserName, setNewUserName] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [randomize, setRandomize] = useState(config.features.randomizeOrderByDefault);
  const [limit, setLimit] = useState<number | undefined>(undefined);
  const [adaptiveMode, setAdaptiveMode] = useState(config.adaptive?.enabled || false);
  const [targetAccuracy, setTargetAccuracy] = useState(config.adaptive?.defaultTargetAccuracy || 0.7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load available quizzes and users
    Promise.all([
      fetch('/api/quizzes').then((res) => res.json()),
      fetch('/api/users').then((res) => res.json()),
    ])
      .then(([quizzesData, usersData]) => {
        setQuizzes(quizzesData);
        setUsers(usersData);
        // Auto-select first user if available and no current user
        if (usersData.length > 0 && !currentUserId) {
          const firstUserId = usersData[0].id;
          setSelectedUserId(firstUserId);
          onUserChange(firstUserId);
        } else if (currentUserId) {
          setSelectedUserId(currentUserId);
        }
      })
      .catch((err) => setError(`Failed to load data: ${err.message}`));
  }, []);

  // Sync selectedUserId with currentUserId from parent
  useEffect(() => {
    if (currentUserId && currentUserId !== selectedUserId) {
      setSelectedUserId(currentUserId);
    }
  }, [currentUserId]);

  const handleQuizToggle = (quizId: string) => {
    setSelectedQuizIds((prev) =>
      prev.includes(quizId)
        ? prev.filter((id) => id !== quizId)
        : [...prev, quizId]
    );
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim()) {
      setError('Please enter a name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate ID from name (lowercase, no spaces)
      const userId = newUserName.toLowerCase().replace(/\s+/g, '_');

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, name: newUserName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const newUser = await response.json();
      setUsers((prev) => [...prev, newUser]);
      setSelectedUserId(newUser.id);
      onUserChange(newUser.id);
      setNewUserName('');
      setShowCreateUser(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!selectedUserId) {
      setError('Please select or create a user');
      return;
    }

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
          userId: selectedUserId,
          selectedQuizIds,
          randomize,
          limit: limit && limit > 0 ? limit : undefined,
          adaptive: adaptiveMode,
          targetAccuracy,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const session = await response.json();
      onSessionStart(session.id, selectedUserId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    onUserChange(userId);
  };

  if (error && quizzes.length === 0) {
    return (
      <div style={{ padding: '2rem', color: theme.text }}>
        <h2 style={{ color: '#ef4444' }}>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
        color: theme.text,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: theme.accent }}>Start a Quiz</h1>
        {onEnterAuthoring && (
          <button
            onClick={onEnterAuthoring}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: theme.accent,
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Quiz Authoring
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {/* User Selection */}
      <div
        style={{
          backgroundColor: theme.panel,
          padding: '1.5rem',
          borderRadius: '8px',
          marginTop: '1rem',
        }}
      >
        <h2>Select User</h2>

        {users.length > 0 ? (
          <div>
            <select
              value={selectedUserId}
              onChange={(e) => handleUserSelect(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                borderRadius: '4px',
                border: `1px solid ${theme.accent}44`,
                backgroundColor: theme.background,
                color: theme.text,
                marginBottom: '1rem',
              }}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>

            {selectedUser && (
              <div
                style={{
                  fontSize: '0.9rem',
                  opacity: 0.8,
                  marginBottom: '1rem',
                }}
              >
                <div>
                  Completed sets:{' '}
                  {Object.keys(selectedUser.completedSets).length}
                </div>
                <div>
                  Last active:{' '}
                  {new Date(selectedUser.lastActiveAt).toLocaleDateString()}
                </div>
              </div>
            )}

            {/* Theme Selector */}
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                }}
              >
                Theme:
              </label>
              <select
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '1rem',
                  borderRadius: '4px',
                  border: `1px solid ${theme.accent}44`,
                  backgroundColor: theme.background,
                  color: theme.text,
                }}
              >
                {Object.keys(config.themes).map((themeKey) => (
                  <option key={themeKey} value={themeKey}>
                    {themeKey.charAt(0).toUpperCase() + themeKey.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <p>No users yet. Create one below.</p>
        )}

        {!showCreateUser ? (
          <button
            onClick={() => setShowCreateUser(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: theme.accent,
              border: `1px solid ${theme.accent}`,
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            + Create New User
          </button>
        ) : (
          <div
            style={{
              backgroundColor: theme.background,
              padding: '1rem',
              borderRadius: '4px',
              marginTop: '1rem',
            }}
          >
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Enter name"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                borderRadius: '4px',
                border: `1px solid ${theme.accent}44`,
                backgroundColor: theme.panel,
                color: theme.text,
                marginBottom: '0.75rem',
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateUser();
                }
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleCreateUser}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: theme.accent,
                  color: theme.background,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateUser(false);
                  setNewUserName('');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  color: theme.text,
                  border: `1px solid ${theme.text}44`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quiz Selection */}
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

        <div style={{ marginBottom: '1rem' }}>
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

        {/* Adaptive Difficulty (Sprint 8) */}
        {config.adaptive?.enabled && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: `1px solid ${theme.text}22` }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={adaptiveMode}
                  onChange={(e) => setAdaptiveMode(e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                <strong>Adaptive Difficulty</strong>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', opacity: 0.7 }}>
                  (adjusts to your skill level)
                </span>
              </label>
            </div>

            {adaptiveMode && selectedUser && (
              <div
                style={{
                  marginLeft: '1.5rem',
                  padding: '1rem',
                  backgroundColor: theme.background,
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                }}
              >
                {selectedUser.skillLevels && Object.keys(selectedUser.skillLevels).length > 0 ? (
                  <>
                    <div style={{ marginBottom: '0.75rem', opacity: 0.8 }}>
                      Your skill levels:
                    </div>
                    {Object.entries(selectedUser.skillLevels).map(([category, skill]: [string, any]) => (
                      <div key={category} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{category}:</span>
                        <span style={{ fontWeight: 'bold' }}>
                          {skill.estimatedLevel.toFixed(1)} / 5.0
                          <span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>
                            ({Math.round(skill.confidence * 100)}% confidence)
                          </span>
                        </span>
                      </div>
                    ))}
                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: `1px solid ${theme.text}22` }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>
                        Target accuracy: {Math.round(targetAccuracy * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="0.9"
                        step="0.05"
                        value={targetAccuracy}
                        onChange={(e) => setTargetAccuracy(parseFloat(e.target.value))}
                        style={{
                          width: '100%',
                          accentColor: theme.accent,
                        }}
                      />
                      <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.25rem' }}>
                        Higher = easier questions, Lower = more challenging
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ opacity: 0.7 }}>
                    Complete a few quizzes to build your skill profile for adaptive mode.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleStartSession}
        disabled={loading || !selectedUserId || selectedQuizIds.length === 0}
        style={{
          marginTop: '1.5rem',
          padding: '1rem 2rem',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          backgroundColor: theme.accent,
          color: theme.background,
          border: 'none',
          borderRadius: '6px',
          cursor: loading || !selectedUserId || selectedQuizIds.length === 0 ? 'not-allowed' : 'pointer',
          opacity: loading || !selectedUserId || selectedQuizIds.length === 0 ? 0.5 : 1,
        }}
      >
        {loading ? 'Starting...' : 'Start Quiz'}
      </button>
    </div>
  );
}
