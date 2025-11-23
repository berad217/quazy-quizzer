import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';
import { TrueFalseQuestion } from '../../../quiz-engine/schema';
import { QuestionMetaFields } from './QuestionMetaFields';

export function TrueFalseForm({
  question,
  onSave,
  onCancel,
}: {
  question: TrueFalseQuestion | null;
  onSave: (question: any) => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  const [id, setId] = useState(question?.id || `q_${Date.now()}`);
  const [text, setText] = useState(question?.text || '');
  const [correct, setCorrect] = useState<boolean>(
    question?.correct !== undefined ? question.correct : true
  );
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [difficulty, setDifficulty] = useState<number | undefined>(
    question?.meta?.difficulty
  );
  const [category, setCategory] = useState<string | undefined>(
    question?.meta?.category
  );

  const handleSave = () => {
    if (!id.trim()) {
      alert('Question ID is required');
      return;
    }

    if (!text.trim()) {
      alert('Question text is required');
      return;
    }

    const questionData: TrueFalseQuestion = {
      id,
      type: 'true_false',
      text,
      correct,
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
          Statement *
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Enter the statement to evaluate as true or false..."
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
          Correct Answer *
        </label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              checked={correct === true}
              onChange={() => setCorrect(true)}
            />
            <span>True</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              checked={correct === false}
              onChange={() => setCorrect(false)}
            />
            <span>False</span>
          </label>
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
          placeholder="Explain why this is true/false..."
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
