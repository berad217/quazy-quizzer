import React, { useEffect, useState } from 'react';
import { useTheme } from '../ThemeContext';

interface QuizMetadata {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  author?: string;
  version?: number;
  questionCount: number;
  lastModified: string;
  isDraft: boolean;
}

export function QuizList({
  onCreateNew,
  onEditQuiz,
}: {
  onCreateNew: () => void;
  onEditQuiz: (quizId: string) => void;
}) {
  const { theme } = useTheme();
  const [quizzes, setQuizzes] = useState<QuizMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'lastModified' | 'questionCount'>('lastModified');

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/author/quizzes');
      if (!response.ok) throw new Error('Failed to load quizzes');
      const data = await response.json();
      setQuizzes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quizId: string, quizTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${quizTitle}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/author/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete quiz');
      await loadQuizzes();
    } catch (err) {
      alert(`Error deleting quiz: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDuplicate = async (quizId: string) => {
    const newId = `${quizId}_copy_${Date.now()}`;

    try {
      const response = await fetch(`/api/author/quizzes/${quizId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newQuizId: newId }),
      });

      if (!response.ok) throw new Error('Failed to duplicate quiz');
      await loadQuizzes();
    } catch (err) {
      alert(`Error duplicating quiz: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleExport = async (quizId: string) => {
    try {
      const response = await fetch(`/api/author/quizzes/${quizId}/export`);
      if (!response.ok) throw new Error('Failed to export quiz');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quizId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Error exporting quiz: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const response = await fetch('/api/author/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonString: text, saveAsDraft: true }),
      });

      if (!response.ok) throw new Error('Failed to import quiz');
      await loadQuizzes();
      alert('Quiz imported successfully!');
    } catch (err) {
      alert(`Error importing quiz: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Reset file input
    event.target.value = '';
  };

  // Filter and sort quizzes
  const filteredQuizzes = quizzes
    .filter(
      (q) =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'questionCount') return b.questionCount - a.questionCount;
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });

  if (loading) {
    return <div>Loading quizzes...</div>;
  }

  if (error) {
    return <div style={{ color: theme.error }}>Error: {error}</div>;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ margin: 0 }}>All Quizzes</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <label
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: theme.secondary,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Import Quiz
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
          <button
            onClick={onCreateNew}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: theme.accent,
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Create New Quiz
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <input
          type="text"
          placeholder="Search quizzes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: theme.panel,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '4px',
          }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            padding: '0.5rem',
            backgroundColor: theme.panel,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '4px',
          }}
        >
          <option value="lastModified">Last Modified</option>
          <option value="title">Title</option>
          <option value="questionCount">Question Count</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredQuizzes.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: theme.panel,
              borderRadius: '4px',
            }}
          >
            {searchTerm ? 'No quizzes match your search.' : 'No quizzes yet. Create your first quiz!'}
          </div>
        ) : (
          filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              style={{
                padding: '1rem',
                backgroundColor: theme.panel,
                border: `1px solid ${theme.border}`,
                borderRadius: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>{quiz.title}</h3>
                    {quiz.isDraft && (
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: theme.warning || '#f59e0b',
                          color: '#000',
                          fontSize: '0.75rem',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                        }}
                      >
                        DRAFT
                      </span>
                    )}
                  </div>
                  {quiz.description && (
                    <p style={{ margin: '0.5rem 0', opacity: 0.8 }}>{quiz.description}</p>
                  )}
                  <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>
                    <span>{quiz.questionCount} questions</span>
                    {' • '}
                    <span>Updated {new Date(quiz.lastModified).toLocaleDateString()}</span>
                    {quiz.author && (
                      <>
                        {' • '}
                        <span>by {quiz.author}</span>
                      </>
                    )}
                  </div>
                  {quiz.tags && quiz.tags.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {quiz.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: theme.secondary,
                            fontSize: '0.75rem',
                            borderRadius: '4px',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onEditQuiz(quiz.id)}
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
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleDuplicate(quiz.id)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: theme.secondary,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Duplicate
                </button>
                <button
                  onClick={() => handleExport(quiz.id)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: theme.secondary,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Export
                </button>
                <button
                  onClick={() => handleDelete(quiz.id, quiz.title)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: theme.error || '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
