import React, { useEffect, useState } from 'react';
import { useTheme } from '../ThemeContext';
import { RawQuizData, Question } from '../../quiz-engine/schema';
import { QuestionList } from './QuestionList';
import { QuestionEditor } from './QuestionEditor';
import { ValidationPanel } from './ValidationPanel';

interface ValidationError {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
}

export function QuizEditor({
  quizId,
  onBack,
}: {
  quizId: string | null;
  onBack: () => void;
}) {
  const { theme } = useTheme();
  const [quiz, setQuiz] = useState<RawQuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    if (quizId) {
      loadQuiz(quizId);
    } else {
      // Create new quiz
      const newQuiz: RawQuizData = {
        id: `quiz_${Date.now()}`,
        title: 'New Quiz',
        description: '',
        questions: [],
        tags: [],
        version: 1,
      };
      setQuiz(newQuiz);
      setLoading(false);
    }
  }, [quizId]);

  const loadQuiz = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/author/quizzes/${id}`);
      if (!response.ok) throw new Error('Failed to load quiz');
      const data = await response.json();
      setQuiz(data);
    } catch (err) {
      alert(`Error loading quiz: ${err instanceof Error ? err.message : 'Unknown error'}`);
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const validateQuiz = async () => {
    if (!quiz) return;

    try {
      const response = await fetch(`/api/author/quizzes/${quiz.id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz }),
      });

      if (!response.ok) throw new Error('Validation failed');
      const result = await response.json();
      setValidationErrors(result.errors || []);
      return result.valid;
    } catch (err) {
      alert(`Error validating quiz: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  };

  const handleSave = async (saveAsDraft = true) => {
    if (!quiz) return;

    setSaving(true);

    try {
      const endpoint = quizId
        ? `/api/author/quizzes/${quiz.id}`
        : '/api/author/quizzes';

      const method = quizId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz, saveAsDraft }),
      });

      if (!response.ok) throw new Error('Failed to save quiz');

      alert(`Quiz ${saveAsDraft ? 'saved as draft' : 'published'} successfully!`);
      if (!saveAsDraft) {
        onBack();
      }
    } catch (err) {
      alert(`Error saving quiz: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const isValid = await validateQuiz();

    if (!isValid) {
      const hasErrors = validationErrors.some((e) => e.severity === 'error');
      if (hasErrors) {
        alert('Cannot publish quiz with validation errors. Please fix them first.');
        return;
      }
    }

    if (confirm('Are you sure you want to publish this quiz?')) {
      await handleSave(false);
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestionIndex(quiz?.questions?.length || 0);
  };

  const handleEditQuestion = (index: number) => {
    setEditingQuestionIndex(index);
  };

  const handleSaveQuestion = (question: Question) => {
    if (!quiz) return;

    const updatedQuestions = [...(quiz.questions || [])];

    if (editingQuestionIndex !== null) {
      if (editingQuestionIndex < updatedQuestions.length) {
        updatedQuestions[editingQuestionIndex] = question;
      } else {
        updatedQuestions.push(question);
      }
    }

    setQuiz({ ...quiz, questions: updatedQuestions });
    setEditingQuestionIndex(null);
  };

  const handleDeleteQuestion = (index: number) => {
    if (!quiz) return;

    if (confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = [...(quiz.questions || [])];
      updatedQuestions.splice(index, 1);
      setQuiz({ ...quiz, questions: updatedQuestions });
    }
  };

  const handleReorderQuestions = (newQuestions: Question[]) => {
    if (!quiz) return;
    setQuiz({ ...quiz, questions: newQuestions });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!quiz) {
    return <div>Error: Quiz not found</div>;
  }

  if (editingQuestionIndex !== null) {
    const question = editingQuestionIndex < (quiz.questions?.length || 0)
      ? quiz.questions![editingQuestionIndex]
      : null;

    return (
      <QuestionEditor
        question={question}
        onSave={handleSaveQuestion}
        onCancel={() => setEditingQuestionIndex(null)}
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={onBack}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: theme.secondary,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '1rem',
          }}
        >
          ← Back to Quiz List
        </button>

        <h2>Quiz Editor</h2>

        <div
          style={{
            backgroundColor: theme.panel,
            padding: '1.5rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Quiz ID
            </label>
            <input
              type="text"
              value={quiz.id}
              disabled
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: theme.secondary,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                borderRadius: '4px',
                opacity: 0.6,
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Title *
            </label>
            <input
              type="text"
              value={quiz.title || ''}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: theme.secondary,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Description
            </label>
            <textarea
              value={quiz.description || ''}
              onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: theme.secondary,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                borderRadius: '4px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Author
              </label>
              <input
                type="text"
                value={quiz.author || ''}
                onChange={(e) => setQuiz({ ...quiz, author: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: theme.secondary,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '4px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Version
              </label>
              <input
                type="number"
                value={quiz.version || 1}
                onChange={(e) => setQuiz({ ...quiz, version: parseInt(e.target.value) || 1 })}
                min={1}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: theme.secondary,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={quiz.tags?.join(', ') || ''}
              onChange={(e) =>
                setQuiz({
                  ...quiz,
                  tags: e.target.value.split(',').map((t) => t.trim()).filter((t) => t),
                })
              }
              placeholder="e.g., math, grade2, multiplication"
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: theme.secondary,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                borderRadius: '4px',
              }}
            />
          </div>
        </div>

        <ValidationPanel errors={validationErrors} />

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Questions ({quiz.questions?.length || 0})</h3>
            <button
              onClick={handleAddQuestion}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: theme.accent,
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              + Add Question
            </button>
          </div>
        </div>

        <QuestionList
          questions={quiz.questions || []}
          onEdit={handleEditQuestion}
          onDelete={handleDeleteQuestion}
          onReorder={handleReorderQuestions}
        />

        <div
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: theme.panel,
            borderRadius: '4px',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={() => validateQuiz()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: theme.secondary,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Validate
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: theme.secondary,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            onClick={handlePublish}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: theme.accent,
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              fontWeight: 'bold',
            }}
          >
            {saving ? 'Publishing...' : 'Publish Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}
