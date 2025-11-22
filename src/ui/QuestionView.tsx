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
        <div
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            backgroundColor: isCorrect ? '#4ade8022' : '#f8717122',
            border: `2px solid ${isCorrect ? '#4ade80' : '#f87171'}`,
            borderRadius: '6px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: isCorrect ? '#4ade80' : '#f87171',
          }}
        >
          {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
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
