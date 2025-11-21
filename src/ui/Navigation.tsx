/**
 * Navigation Component
 *
 * Provides prev/next navigation and session control buttons
 */

import React from 'react';
import { AppConfig } from '../config/types';

interface NavigationProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onGrade: () => void;
  onComplete: () => void;
  config: AppConfig;
  isGraded: boolean;
  isCompleted: boolean;
  allAnswered: boolean;
}

export function Navigation({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onGrade,
  onComplete,
  config,
  isGraded,
  isCompleted,
  allAnswered,
}: NavigationProps) {
  const theme = config.themes[config.defaultTheme];

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  const buttonStyle = (disabled: boolean = false) => ({
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    backgroundColor: disabled ? theme.text + '44' : theme.accent,
    color: disabled ? theme.text + '88' : theme.background,
    border: 'none',
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s',
  });

  return (
    <div
      style={{
        padding: '1.5rem 2rem',
        backgroundColor: theme.panel,
        borderTop: `2px solid ${theme.accent}44`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        bottom: 0,
      }}
    >
      {/* Previous button */}
      <button onClick={onPrevious} disabled={isFirst} style={buttonStyle(isFirst)}>
        ← Previous
      </button>

      {/* Center buttons */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        {config.features.showCorrectAnswersToggle && !isCompleted && (
          <button
            onClick={onGrade}
            disabled={!allAnswered || isGraded}
            style={{
              ...buttonStyle(!allAnswered || isGraded),
              backgroundColor: isGraded
                ? '#4ade80'
                : !allAnswered
                ? theme.text + '44'
                : theme.accent,
            }}
          >
            {isGraded ? '✓ Graded' : 'Grade Quiz'}
          </button>
        )}

        {!isCompleted && (
          <button
            onClick={onComplete}
            disabled={!isGraded}
            style={{
              ...buttonStyle(!isGraded),
              backgroundColor: !isGraded ? theme.text + '44' : '#3b82f6',
            }}
          >
            Complete Quiz
          </button>
        )}

        {isCompleted && (
          <div
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4ade8022',
              border: '2px solid #4ade80',
              borderRadius: '6px',
              fontWeight: 'bold',
              color: '#4ade80',
            }}
          >
            ✓ Quiz Completed
          </div>
        )}
      </div>

      {/* Next button */}
      <button onClick={onNext} disabled={isLast} style={buttonStyle(isLast)}>
        Next →
      </button>
    </div>
  );
}
