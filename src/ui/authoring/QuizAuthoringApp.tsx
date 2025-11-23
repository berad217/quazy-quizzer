import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { RawQuizData } from '../../quiz-engine/schema';
import { QuizList } from './QuizList';
import { QuizEditor } from './QuizEditor';

type AuthoringView = 'list' | 'editor';

export function QuizAuthoringApp({ onExit }: { onExit: () => void }) {
  const { theme } = useTheme();
  const [view, setView] = useState<AuthoringView>('list');
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);

  const handleCreateQuiz = () => {
    setCurrentQuizId(null);
    setView('editor');
  };

  const handleEditQuiz = (quizId: string) => {
    setCurrentQuizId(quizId);
    setView('editor');
  };

  const handleBackToList = () => {
    setCurrentQuizId(null);
    setView('list');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      <header
        style={{
          backgroundColor: theme.panel,
          padding: '1rem 2rem',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0 }}>Quiz Authoring</h1>
        <button
          onClick={onExit}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: theme.secondary,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Exit to Main Menu
        </button>
      </header>

      <div style={{ padding: '2rem' }}>
        {view === 'list' && (
          <QuizList
            onCreateNew={handleCreateQuiz}
            onEditQuiz={handleEditQuiz}
          />
        )}

        {view === 'editor' && (
          <QuizEditor
            quizId={currentQuizId}
            onBack={handleBackToList}
          />
        )}
      </div>
    </div>
  );
}
