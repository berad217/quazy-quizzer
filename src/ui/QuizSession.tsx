/**
 * QuizSession Component
 *
 * Main container for an active quiz session
 */

import React, { useState, useEffect } from 'react';
import { Session, AnswerValue } from '../quiz-engine/session';
import { Sidebar } from './Sidebar';
import { QuestionView } from './QuestionView';
import { Navigation } from './Navigation';
import { useTheme } from './ThemeContext';

interface QuizSessionProps {
  sessionId: string;
  onExit: () => void;
}

interface GradingResults {
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalUnanswered: number;
  score: number;
  totalScore: number;
  perQuestion: {
    [compositeKey: string]: {
      isCorrect: boolean;
      userAnswer: AnswerValue;
      correctAnswer?: any;
      score?: number;
      matchType?: 'exact' | 'fuzzy' | 'partial' | 'none';
      similarity?: number;
      feedback?: string;
    };
  };
}

export function QuizSession({ sessionId, onExit }: QuizSessionProps) {
  const { theme, config } = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gradingResults, setGradingResults] = useState<GradingResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true); // Default ON per spec

  // Load session
  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Failed to load session');
      const data = await response.json();
      setSession(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const handleAnswerChange = async (value: AnswerValue) => {
    if (!session) return;

    const currentQuestion = session.questions[currentQuestionIndex];

    try {
      const response = await fetch(`/api/sessions/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compositeKey: currentQuestion.compositeKey,
          value,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit answer');

      const updatedSession = await response.json();
      setSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save answer');
    }
  };

  const handleGrade = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/grade`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to grade session');

      const results = await response.json();
      setGradingResults(results);

      // Reload session to get updated answer.isCorrect fields
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grade');
    }
  };

  const handleComplete = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to complete session');

      const updatedSession = await response.json();
      setSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete');
    }
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (!session) return;
    setCurrentQuestionIndex((prev) =>
      Math.min(session.questions.length - 1, prev + 1)
    );
  };

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: theme.background,
          color: theme.text,
        }}
      >
        <div>Loading session...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div
        style={{
          padding: '2rem',
          backgroundColor: theme.background,
          color: theme.text,
        }}
      >
        <h2 style={{ color: '#ef4444' }}>Error</h2>
        <p>{error || 'Session not found'}</p>
        <button
          onClick={onExit}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: theme.accent,
            color: theme.background,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Back to Start
        </button>
      </div>
    );
  }

  const currentSessionQuestion = session.questions[currentQuestionIndex];
  const currentAnswer = session.answers[currentSessionQuestion.compositeKey]?.value;
  const allAnswered = session.questions.every(
    (q) => session.answers[q.compositeKey] !== undefined
  );

  const currentQuestionResult = gradingResults?.perQuestion[currentSessionQuestion.compositeKey];

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      {/* Sidebar */}
      <Sidebar
        session={session}
        currentQuestionIndex={currentQuestionIndex}
        gradingResults={gradingResults?.perQuestion || null}
        onQuestionSelect={handleQuestionSelect}
      />

      {/* Main content area */}
      <div
        style={{
          marginLeft: `${theme.sidebarWidth}px`,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem 2rem',
            backgroundColor: theme.panel,
            borderBottom: `2px solid ${theme.accent}44`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ margin: 0, color: theme.accent }}>
              {config.appName}
            </h2>
            {reviewMode && (
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                }}
              >
                Review Mode
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {gradingResults && (
              <div
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: theme.background,
                  borderRadius: '6px',
                  fontWeight: 'bold',
                }}
              >
                Score: {gradingResults.totalCorrect} / {gradingResults.totalQuestions} (
                {Math.round(gradingResults.score)}%)
              </div>
            )}

            {/* Show Correct Answers Toggle */}
            {gradingResults && config.features.showCorrectAnswersToggle && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  backgroundColor: theme.background,
                  borderRadius: '4px',
                }}
              >
                <input
                  type="checkbox"
                  checked={showCorrectAnswers}
                  onChange={(e) => setShowCorrectAnswers(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.9rem' }}>Show Answers</span>
              </label>
            )}

            {/* Review Mode Button */}
            {session?.completedAt && config.features.allowReviewMode && !reviewMode && (
              <button
                onClick={() => setReviewMode(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Review Session
              </button>
            )}

            {/* Exit Review Button */}
            {reviewMode && (
              <button
                onClick={() => setReviewMode(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: theme.accent,
                  color: theme.background,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Exit Review
              </button>
            )}

            <button
              onClick={onExit}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: theme.text,
                border: `1px solid ${theme.text}44`,
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Exit Quiz
            </button>
          </div>
        </div>

        {/* Question content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <QuestionView
            sessionQuestion={currentSessionQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={session.questions.length}
            currentAnswer={currentAnswer}
            onAnswerChange={reviewMode ? () => {} : handleAnswerChange}
            showCorrect={gradingResults !== null && showCorrectAnswers}
            correctAnswer={currentQuestionResult?.correctAnswer}
            isCorrect={currentQuestionResult?.isCorrect}
            score={currentQuestionResult?.score}
            matchType={currentQuestionResult?.matchType}
            similarity={currentQuestionResult?.similarity}
            feedback={currentQuestionResult?.feedback}
            readOnly={reviewMode}
          />
        </div>

        {/* Navigation - hide in review mode */}
        {!reviewMode && (
          <Navigation
            currentIndex={currentQuestionIndex}
            totalQuestions={session.questions.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onGrade={handleGrade}
            onComplete={handleComplete}
            isGraded={gradingResults !== null}
            isCompleted={session.completedAt !== undefined}
            allAnswered={allAnswered}
          />
        )}

        {/* Simple navigation in review mode */}
        {reviewMode && (
          <div
            style={{
              padding: '1.5rem 2rem',
              backgroundColor: theme.panel,
              borderTop: `2px solid ${theme.accent}44`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                backgroundColor: currentQuestionIndex === 0 ? theme.text + '44' : theme.accent,
                color: currentQuestionIndex === 0 ? theme.text + '88' : theme.background,
                border: 'none',
                borderRadius: '6px',
                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentQuestionIndex === 0 ? 0.5 : 1,
              }}
            >
              ← Previous
            </button>
            <div style={{ fontWeight: 'bold' }}>
              Question {currentQuestionIndex + 1} of {session.questions.length}
            </div>
            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === session.questions.length - 1}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                backgroundColor:
                  currentQuestionIndex === session.questions.length - 1
                    ? theme.text + '44'
                    : theme.accent,
                color:
                  currentQuestionIndex === session.questions.length - 1
                    ? theme.text + '88'
                    : theme.background,
                border: 'none',
                borderRadius: '6px',
                cursor:
                  currentQuestionIndex === session.questions.length - 1 ? 'not-allowed' : 'pointer',
                opacity: currentQuestionIndex === session.questions.length - 1 ? 0.5 : 1,
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
