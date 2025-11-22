/**
 * QuizSession Component
 *
 * Main container for an active quiz session
 */

import React, { useState, useEffect } from 'react';
import { Session, AnswerValue } from '../quiz-engine/session';
import { AppConfig } from '../config/types';
import { Sidebar } from './Sidebar';
import { QuestionView } from './QuestionView';
import { Navigation } from './Navigation';

interface QuizSessionProps {
  sessionId: string;
  config: AppConfig;
  onExit: () => void;
}

interface GradingResults {
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalUnanswered: number;
  score: number;
  perQuestion: {
    [compositeKey: string]: {
      isCorrect: boolean;
      userAnswer: AnswerValue;
      correctAnswer?: any;
    };
  };
}

export function QuizSession({ sessionId, config, onExit }: QuizSessionProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gradingResults, setGradingResults] = useState<GradingResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = config.themes[config.defaultTheme];

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
        <h2 style={{ color: 'red' }}>Error</h2>
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
        config={config}
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
          }}
        >
          <h2 style={{ margin: 0, color: theme.accent }}>
            {config.appName}
          </h2>

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

        {/* Question content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <QuestionView
            sessionQuestion={currentSessionQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={session.questions.length}
            currentAnswer={currentAnswer}
            onAnswerChange={handleAnswerChange}
            config={config}
            showCorrect={gradingResults !== null}
            correctAnswer={currentQuestionResult?.correctAnswer}
            isCorrect={currentQuestionResult?.isCorrect}
          />
        </div>

        {/* Navigation */}
        <Navigation
          currentIndex={currentQuestionIndex}
          totalQuestions={session.questions.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onGrade={handleGrade}
          onComplete={handleComplete}
          config={config}
          isGraded={gradingResults !== null}
          isCompleted={session.completedAt !== undefined}
          allAnswered={allAnswered}
        />
      </div>
    </div>
  );
}
