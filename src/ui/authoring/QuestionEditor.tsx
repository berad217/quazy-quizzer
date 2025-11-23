import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { Question } from '../../quiz-engine/schema';
import { MultipleChoiceForm } from './questionForms/MultipleChoiceForm';
import { TrueFalseForm } from './questionForms/TrueFalseForm';
import { FillInBlankForm } from './questionForms/FillInBlankForm';
import { ShortAnswerForm } from './questionForms/ShortAnswerForm';

export function QuestionEditor({
  question,
  onSave,
  onCancel,
}: {
  question: Question | null;
  onSave: (question: Question) => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  const [questionType, setQuestionType] = useState<string>(
    question?.type || 'multiple_choice_single'
  );

  const handleTypeChange = (newType: string) => {
    if (
      question &&
      question.type !== newType &&
      !confirm('Changing question type will reset all question data. Continue?')
    ) {
      return;
    }
    setQuestionType(newType);
  };

  return (
    <div>
      <div
        style={{
          backgroundColor: theme.panel,
          padding: '1.5rem',
          borderRadius: '4px',
          marginBottom: '1.5rem',
        }}
      >
        <h2>Question Editor</h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Question Type
          </label>
          <select
            value={questionType}
            onChange={(e) => handleTypeChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: theme.secondary,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
            }}
          >
            <option value="multiple_choice_single">Multiple Choice (Single Answer)</option>
            <option value="multiple_choice_multi">Multiple Choice (Multiple Answers)</option>
            <option value="true_false">True/False</option>
            <option value="fill_in_blank">Fill in the Blank</option>
            <option value="short_answer">Short Answer</option>
          </select>
        </div>

        {questionType === 'multiple_choice_single' && (
          <MultipleChoiceForm
            question={question?.type === 'multiple_choice_single' ? question : null}
            multiSelect={false}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}

        {questionType === 'multiple_choice_multi' && (
          <MultipleChoiceForm
            question={question?.type === 'multiple_choice_multi' ? question : null}
            multiSelect={true}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}

        {questionType === 'true_false' && (
          <TrueFalseForm
            question={question?.type === 'true_false' ? question : null}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}

        {questionType === 'fill_in_blank' && (
          <FillInBlankForm
            question={question?.type === 'fill_in_blank' ? question : null}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}

        {questionType === 'short_answer' && (
          <ShortAnswerForm
            question={question?.type === 'short_answer' ? question : null}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}
      </div>
    </div>
  );
}
