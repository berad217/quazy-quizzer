import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';
import { ShortAnswerQuestion } from '../../../quiz-engine/schema';
import { QuestionMetaFields } from './QuestionMetaFields';

export function ShortAnswerForm({
  question,
  onSave,
  onCancel,
}: {
  question: ShortAnswerQuestion | null;
  onSave: (question: any) => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  const [id, setId] = useState(question?.id || `q_${Date.now()}`);
  const [text, setText] = useState(question?.text || '');
  const [acceptableAnswers, setAcceptableAnswers] = useState<string[]>(
    question?.acceptableAnswers?.map(a => typeof a === 'string' ? a : a.value) || ['']
  );
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [difficulty, setDifficulty] = useState<number | undefined>(
    question?.meta?.difficulty
  );
  const [category, setCategory] = useState<string | undefined>(
    question?.meta?.category
  );

  const handleAddAnswer = () => {
    setAcceptableAnswers([...acceptableAnswers, '']);
  };

  const handleRemoveAnswer = (index: number) => {
    if (acceptableAnswers.length <= 1) {
      alert('Must have at least 1 acceptable answer');
      return;
    }
    const newAnswers = [...acceptableAnswers];
    newAnswers.splice(index, 1);
    setAcceptableAnswers(newAnswers);
  };

  const handleUpdateAnswer = (index: number, value: string) => {
    const newAnswers = [...acceptableAnswers];
    newAnswers[index] = value;
    setAcceptableAnswers(newAnswers);
  };

  const handleSave = () => {
    if (!id.trim()) {
      alert('Question ID is required');
      return;
    }

    if (!text.trim()) {
      alert('Question text is required');
      return;
    }

    const nonEmptyAnswers = acceptableAnswers.filter((a) => a.trim());
    if (nonEmptyAnswers.length === 0) {
      alert('Must have at least 1 acceptable answer');
      return;
    }

    const questionData: ShortAnswerQuestion = {
      id,
      type: 'short_answer',
      text,
      acceptableAnswers: nonEmptyAnswers,
      explanation: explanation || undefined,
      meta: {
        ...(difficulty && { difficulty }),
        ...(category && { category }),
      },
    };

    onSave(questionData);
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Question ID *
        </label>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="e.g., q1, question_1"
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
          Question Text *
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Ask your question here..."
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

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Acceptable Answers *
        </label>
        {acceptableAnswers.map((answer, index) => (
          <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={answer}
              onChange={(e) => handleUpdateAnswer(index, e.target.value)}
              placeholder={`Answer ${index + 1}`}
              style={{
                flex: 1,
                padding: '0.5rem',
                backgroundColor: theme.secondary,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                borderRadius: '4px',
              }}
            />
            {acceptableAnswers.length > 1 && (
              <button
                onClick={() => handleRemoveAnswer(index)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: theme.error || '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleAddAnswer}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: theme.secondary,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '0.5rem',
          }}
        >
          + Add Answer Variant
        </button>
        <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>
          Add multiple acceptable answer variants. Fuzzy matching will handle minor typos and variations.
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Explanation
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          placeholder="Explain the correct answer..."
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

      <QuestionMetaFields
        difficulty={difficulty}
        category={category}
        onDifficultyChange={setDifficulty}
        onCategoryChange={setCategory}
      />

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: theme.secondary,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: theme.accent,
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Save Question
        </button>
      </div>
    </div>
  );
}
