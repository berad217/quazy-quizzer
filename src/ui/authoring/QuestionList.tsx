import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { Question } from '../../quiz-engine/schema';

export function QuestionList({
  questions,
  onEdit,
  onDelete,
  onReorder,
}: {
  questions: Question[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onReorder: (newQuestions: Question[]) => void;
}) {
  const { theme } = useTheme();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const newQuestions = [...questions];
    const [removed] = newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(targetIndex, 0, removed);

    onReorder(newQuestions);
    setDraggedIndex(null);
  };

  const getQuestionTypeLabel = (type: string): string => {
    switch (type) {
      case 'multiple_choice_single':
        return 'Multiple Choice (Single)';
      case 'multiple_choice_multi':
        return 'Multiple Choice (Multiple)';
      case 'true_false':
        return 'True/False';
      case 'fill_in_blank':
        return 'Fill in the Blank';
      case 'short_answer':
        return 'Short Answer';
      default:
        return type;
    }
  };

  const getQuestionPreview = (question: Question): string => {
    if (question.text.length > 100) {
      return question.text.substring(0, 100) + '...';
    }
    return question.text;
  };

  if (questions.length === 0) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: theme.panel,
          border: `2px dashed ${theme.border}`,
          borderRadius: '4px',
        }}
      >
        No questions yet. Click "Add Question" to create your first question.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {questions.map((question, index) => (
        <div
          key={index}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          style={{
            padding: '1rem',
            backgroundColor: draggedIndex === index ? theme.secondary : theme.panel,
            border: `1px solid ${theme.border}`,
            borderRadius: '4px',
            cursor: 'move',
            opacity: draggedIndex === index ? 0.5 : 1,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  opacity: 0.3,
                  userSelect: 'none',
                }}
              >
                ☰
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold' }}>Q{index + 1}</span>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: theme.secondary,
                      fontSize: '0.75rem',
                      borderRadius: '4px',
                    }}
                  >
                    {getQuestionTypeLabel(question.type)}
                  </span>
                  {question.meta?.difficulty && (
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: theme.accent + '33',
                        color: theme.accent,
                        fontSize: '0.75rem',
                        borderRadius: '4px',
                      }}
                    >
                      Difficulty: {question.meta.difficulty}/5
                    </span>
                  )}
                  {question.meta?.category && (
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: theme.accent + '22',
                        fontSize: '0.75rem',
                        borderRadius: '4px',
                      }}
                    >
                      {question.meta.category}
                    </span>
                  )}
                </div>
                <div style={{ opacity: 0.8 }}>{getQuestionPreview(question)}</div>

                {!question.text && (
                  <div style={{ color: theme.error || '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    ⚠️ Missing question text
                  </div>
                )}

                {!question.explanation && (
                  <div
                    style={{
                      color: theme.warning || '#f59e0b',
                      fontSize: '0.85rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    ⚠️ Missing explanation
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => onEdit(index)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: theme.accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(index)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: theme.error || '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
