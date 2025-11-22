/**
 * QuestionView Component
 *
 * Displays the current question and answer input
 */

import React from 'react';
import { SessionQuestion, AnswerValue } from '../quiz-engine/session';
import { AnswerInput } from './AnswerInput';
import { useTheme } from './ThemeContext';

interface QuestionViewProps {
  sessionQuestion: SessionQuestion;
  questionNumber: number;
  totalQuestions: number;
  currentAnswer: AnswerValue | undefined;
  onAnswerChange: (value: AnswerValue) => void;
  showCorrect?: boolean;
  correctAnswer?: any;
  isCorrect?: boolean;
  score?: number;
  matchType?: 'exact' | 'fuzzy' | 'partial' | 'none';
  similarity?: number;
  feedback?: string;
  readOnly?: boolean;
}

export function QuestionView({
  sessionQuestion,
  questionNumber,
  totalQuestions,
  currentAnswer,
  onAnswerChange,
  showCorrect = false,
  correctAnswer,
  isCorrect,
  score,
  matchType,
  similarity,
  feedback,
  readOnly = false,
}: QuestionViewProps) {
  const { theme } = useTheme();
  const question = sessionQuestion.question;

  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '800px',
      }}
    >
      {/* Question header */}
      <div
        style={{
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: `2px solid ${theme.accent}44`,
        }}
      >
        <div
          style={{
            fontSize: '0.9rem',
            opacity: 0.7,
            marginBottom: '0.5rem',
          }}
        >
          Question {questionNumber} of {totalQuestions}
        </div>
        <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>
          Type: {question.type.replace(/_/g, ' ')}
          {question.meta?.difficulty && ` • Difficulty: ${question.meta.difficulty}`}
          {question.meta?.category && ` • Category: ${question.meta.category}`}
        </div>
      </div>

      {/* Question text */}
      <div
        style={{
          fontSize: `${theme.questionTextSize * 1.1}px`,
          marginBottom: '2rem',
          lineHeight: 1.6,
          fontWeight: 500,
        }}
      >
        {question.text}
      </div>

      {/* Result indicator (if graded) */}
      {showCorrect && isCorrect !== undefined && (
        <div>
          {/* Main result badge */}
          <div
            style={{
              padding: '1rem',
              marginBottom: matchType && matchType !== 'exact' && matchType !== 'none' ? '0.75rem' : '1.5rem',
              backgroundColor: isCorrect ? '#4ade8022' : '#f8717122',
              border: `2px solid ${isCorrect ? '#4ade80' : '#f87171'}`,
              borderRadius: '6px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: isCorrect ? '#4ade80' : '#f87171',
            }}
          >
            {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            {score !== undefined && score < 1 && score > 0 && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                ({Math.round(score * 100)}% credit)
              </span>
            )}
          </div>

          {/* Fuzzy match feedback */}
          {matchType === 'fuzzy' && similarity !== undefined && (
            <div
              style={{
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                backgroundColor: '#fbbf2433',
                border: '1px solid #fbbf24',
                borderRadius: '4px',
                fontSize: '0.95rem',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>⚠️</span>
              <div>
                <strong>Minor typo detected.</strong> Your answer was accepted (
                {Math.round(similarity * 100)}% match).
                {feedback && <div style={{ marginTop: '0.25rem', opacity: 0.9 }}>{feedback}</div>}
              </div>
            </div>
          )}

          {/* Partial credit feedback */}
          {matchType === 'partial' && score !== undefined && (
            <div
              style={{
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                backgroundColor: '#fb923c33',
                border: '1px solid #fb923c',
                borderRadius: '4px',
                fontSize: '0.95rem',
                color: '#fb923c',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>⭐</span>
              <div>
                <strong>Partial credit awarded.</strong> Your answer was close (
                {Math.round(score * 100)}% credit).
                {feedback && <div style={{ marginTop: '0.25rem', opacity: 0.9 }}>{feedback}</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Answer input */}
      <AnswerInput
        question={question}
        currentAnswer={currentAnswer}
        onAnswerChange={onAnswerChange}
        showCorrect={showCorrect}
        correctAnswer={correctAnswer}
        readOnly={readOnly}
      />

      {/* Explanation (if available and showing correct answers) */}
      {showCorrect && question.explanation && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: theme.panel,
            borderLeft: `4px solid ${theme.accent}`,
            borderRadius: '4px',
          }}
        >
          <div
            style={{
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: theme.accent,
            }}
          >
            Explanation:
          </div>
          <div style={{ lineHeight: 1.6 }}>{question.explanation}</div>
        </div>
      )}
    </div>
  );
}
