import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';
import {
  MultipleChoiceSingleQuestion,
  MultipleChoiceMultiQuestion,
} from '../../../quiz-engine/schema';
import { QuestionMetaFields } from './QuestionMetaFields';

export function MultipleChoiceForm({
  question,
  multiSelect,
  onSave,
  onCancel,
}: {
  question: MultipleChoiceSingleQuestion | MultipleChoiceMultiQuestion | null;
  multiSelect: boolean;
  onSave: (question: any) => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  const [id, setId] = useState(question?.id || `q_${Date.now()}`);
  const [text, setText] = useState(question?.text || '');
  const [choices, setChoices] = useState<string[]>(
    question?.choices || ['', '', '', '']
  );
  const [correct, setCorrect] = useState<number[]>(
    question?.correct || []
  );
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [difficulty, setDifficulty] = useState<number | undefined>(
    question?.meta?.difficulty
  );
  const [category, setCategory] = useState<string | undefined>(
    question?.meta?.category
  );

  const handleAddChoice = () => {
    setChoices([...choices, '']);
  };

  const handleRemoveChoice = (index: number) => {
    if (choices.length <= 2) {
      alert('Must have at least 2 choices');
      return;
    }
    const newChoices = [...choices];
    newChoices.splice(index, 1);
    setChoices(newChoices);

    // Update correct indices
    const newCorrect = correct
      .map((i) => (i > index ? i - 1 : i))
      .filter((i) => i !== index);
    setCorrect(newCorrect);
  };

  const handleUpdateChoice = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

  const handleToggleCorrect = (index: number) => {
    if (multiSelect) {
      // Multiple correct answers allowed
      if (correct.includes(index)) {
        setCorrect(correct.filter((i) => i !== index));
      } else {
        setCorrect([...correct, index]);
      }
    } else {
      // Single correct answer
      setCorrect([index]);
    }
  };

  const handleSave = () => {
    // Validation
    if (!id.trim()) {
      alert('Question ID is required');
      return;
    }

    if (!text.trim()) {
      alert('Question text is required');
      return;
    }

    const nonEmptyChoices = choices.filter((c) => c.trim());
    if (nonEmptyChoices.length < 2) {
      alert('Must have at least 2 choices');
      return;
    }

    if (correct.length === 0) {
      alert('Must mark at least one correct answer');
      return;
    }

    const questionData: any = {
      id,
      type: multiSelect ? 'multiple_choice_multi' : 'multiple_choice_single',
      text,
      choices: nonEmptyChoices,
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
          Question Text *
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Enter your question here..."
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
          Choices * ({multiSelect ? 'check all correct answers' : 'select one correct answer'})
        </label>
        {choices.map((choice, index) => (
          <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type={multiSelect ? 'checkbox' : 'radio'}
              checked={correct.includes(index)}
              onChange={() => handleToggleCorrect(index)}
              style={{ alignSelf: 'center' }}
            />
            <input
              type="text"
              value={choice}
              onChange={(e) => handleUpdateChoice(index, e.target.value)}
              placeholder={`Choice ${index + 1}`}
              style={{
                flex: 1,
                padding: '0.5rem',
                backgroundColor: theme.secondary,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                borderRadius: '4px',
              }}
            />
            {choices.length > 2 && (
              <button
                onClick={() => handleRemoveChoice(index)}
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
          onClick={handleAddChoice}
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
          + Add Choice
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Explanation
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          placeholder="Explain why this is the correct answer..."
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
