/**
 * Sidebar Component
 *
 * Displays list of questions with status indicators
 */

import React from 'react';
import { Session } from '../quiz-engine/session';
import { useTheme } from './ThemeContext';

interface SidebarProps {
  session: Session;
  currentQuestionIndex: number;
  gradingResults: { [compositeKey: string]: { isCorrect: boolean } } | null;
  onQuestionSelect: (index: number) => void;
}

export function Sidebar({
  session,
  currentQuestionIndex,
  gradingResults,
  onQuestionSelect,
}: SidebarProps) {
  const { theme, config } = useTheme();
  const allowJump = config.features.allowQuestionJump;

  const getQuestionStatus = (compositeKey: string): 'unanswered' | 'answered' | 'correct' | 'incorrect' => {
    const hasAnswer = session.answers[compositeKey] !== undefined;

    if (!hasAnswer) {
      return 'unanswered';
    }

    if (gradingResults && gradingResults[compositeKey]) {
      return gradingResults[compositeKey].isCorrect ? 'correct' : 'incorrect';
    }

    return 'answered';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'correct':
        return '#4ade80'; // green
      case 'incorrect':
        return '#f87171'; // red
      case 'answered':
        return theme.accent;
      case 'unanswered':
      default:
        return theme.text + '44'; // semi-transparent
    }
  };

  const getStatusSymbol = (status: string): string => {
    switch (status) {
      case 'correct':
        return '✓';
      case 'incorrect':
        return '✗';
      case 'answered':
        return '●';
      case 'unanswered':
      default:
        return '○';
    }
  };

  return (
    <div
      style={{
        width: `${theme.sidebarWidth}px`,
        backgroundColor: theme.panel,
        padding: '1rem',
        overflowY: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
      }}
    >
      <h3 style={{ marginTop: 0, color: theme.accent }}>Questions</h3>

      {config.features.showQuestionProgress && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: theme.background,
            borderRadius: '4px',
            fontSize: '0.9rem',
          }}
        >
          <div>
            {Object.keys(session.answers).length} / {session.questions.length} answered
          </div>
          {gradingResults && (
            <div style={{ marginTop: '0.25rem', opacity: 0.8 }}>
              Graded: {Object.values(gradingResults).filter((r) => r.isCorrect).length}{' '}
              correct
            </div>
          )}
        </div>
      )}

      <div>
        {session.questions.map((q, index) => {
          const status = getQuestionStatus(q.compositeKey);
          const isCurrent = index === currentQuestionIndex;

          return (
            <div
              key={q.compositeKey}
              onClick={() => allowJump && onQuestionSelect(index)}
              style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                backgroundColor: isCurrent ? theme.accent + '22' : theme.background,
                border: isCurrent ? `2px solid ${theme.accent}` : '1px solid transparent',
                borderRadius: '4px',
                cursor: allowJump ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                if (allowJump && !isCurrent) {
                  e.currentTarget.style.backgroundColor = theme.accent + '11';
                }
              }}
              onMouseOut={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.backgroundColor = theme.background;
                }
              }}
            >
              <div
                style={{
                  fontSize: '1.2rem',
                  color: getStatusColor(status),
                  minWidth: '1.5rem',
                }}
              >
                {getStatusSymbol(status)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: isCurrent ? 'bold' : 'normal' }}>
                  Q{index + 1}
                </div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    opacity: 0.7,
                    marginTop: '0.25rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {q.question.type.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!allowJump && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.5rem',
            fontSize: '0.85rem',
            opacity: 0.6,
            fontStyle: 'italic',
          }}
        >
          Navigate using Prev/Next buttons
        </div>
      )}
    </div>
  );
}
