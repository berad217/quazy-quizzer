/**
 * AnswerInput Component
 *
 * Renders appropriate input based on question type
 */

import React from 'react';
import {
  Question,
  MultipleChoiceSingleQuestion,
  MultipleChoiceMultiQuestion,
  TrueFalseQuestion,
  FillInBlankQuestion,
  ShortAnswerQuestion,
} from '../quiz-engine/schema';
import { AnswerValue } from '../quiz-engine/session';
import { AppConfig } from '../config/types';

interface AnswerInputProps {
  question: Question;
  currentAnswer: AnswerValue | undefined;
  onAnswerChange: (value: AnswerValue) => void;
  config: AppConfig;
  showCorrect?: boolean;
  correctAnswer?: any;
}

export function AnswerInput({
  question,
  currentAnswer,
  onAnswerChange,
  config,
  showCorrect = false,
  correctAnswer,
}: AnswerInputProps) {
  const theme = config.themes[config.defaultTheme];

  switch (question.type) {
    case 'multiple_choice_single': {
      const mcq = question as MultipleChoiceSingleQuestion;
      return (
        <div>
          {mcq.choices.map((choice, index) => {
            const isSelected = currentAnswer === index;
            const isCorrect = showCorrect && correctAnswer?.includes(index);

            return (
              <label
                key={index}
                style={{
                  display: 'block',
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  backgroundColor: isSelected
                    ? theme.accent + '33'
                    : theme.panel,
                  border: `2px solid ${
                    isCorrect && showCorrect
                      ? '#4ade80'
                      : isSelected
                      ? theme.accent
                      : theme.accent + '44'
                  }`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = theme.accent + '11';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = theme.panel;
                  }
                }}
              >
                <input
                  type="radio"
                  name="answer"
                  checked={isSelected}
                  onChange={() => onAnswerChange(index)}
                  style={{ marginRight: '0.75rem' }}
                />
                {choice}
                {showCorrect && isCorrect && (
                  <span style={{ marginLeft: '0.5rem', color: '#4ade80' }}>
                    ✓
                  </span>
                )}
              </label>
            );
          })}
        </div>
      );
    }

    case 'multiple_choice_multi': {
      const mcq = question as MultipleChoiceMultiQuestion;
      const selectedIndices = (currentAnswer as number[]) || [];

      const toggleChoice = (index: number) => {
        const newSelected = selectedIndices.includes(index)
          ? selectedIndices.filter((i) => i !== index)
          : [...selectedIndices, index];
        onAnswerChange(newSelected);
      };

      return (
        <div>
          <p style={{ marginBottom: '1rem', fontStyle: 'italic', opacity: 0.8 }}>
            Select all that apply
          </p>
          {mcq.choices.map((choice, index) => {
            const isSelected = selectedIndices.includes(index);
            const isCorrect = showCorrect && correctAnswer?.includes(index);

            return (
              <label
                key={index}
                style={{
                  display: 'block',
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  backgroundColor: isSelected
                    ? theme.accent + '33'
                    : theme.panel,
                  border: `2px solid ${
                    isCorrect && showCorrect
                      ? '#4ade80'
                      : isSelected
                      ? theme.accent
                      : theme.accent + '44'
                  }`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = theme.accent + '11';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = theme.panel;
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleChoice(index)}
                  style={{ marginRight: '0.75rem' }}
                />
                {choice}
                {showCorrect && isCorrect && (
                  <span style={{ marginLeft: '0.5rem', color: '#4ade80' }}>
                    ✓
                  </span>
                )}
              </label>
            );
          })}
        </div>
      );
    }

    case 'true_false': {
      return (
        <div>
          {[
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ].map(({ value, label }) => {
            const isSelected = currentAnswer === value;
            const isCorrect = showCorrect && correctAnswer === value;

            return (
              <label
                key={label}
                style={{
                  display: 'inline-block',
                  padding: '1rem 2rem',
                  marginRight: '1rem',
                  backgroundColor: isSelected
                    ? theme.accent + '33'
                    : theme.panel,
                  border: `2px solid ${
                    isCorrect && showCorrect
                      ? '#4ade80'
                      : isSelected
                      ? theme.accent
                      : theme.accent + '44'
                  }`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                }}
                onMouseOver={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = theme.accent + '11';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = theme.panel;
                  }
                }}
              >
                <input
                  type="radio"
                  name="answer"
                  checked={isSelected}
                  onChange={() => onAnswerChange(value)}
                  style={{ marginRight: '0.75rem' }}
                />
                {label}
                {showCorrect && isCorrect && (
                  <span style={{ marginLeft: '0.5rem', color: '#4ade80' }}>
                    ✓
                  </span>
                )}
              </label>
            );
          })}
        </div>
      );
    }

    case 'fill_in_blank':
    case 'short_answer': {
      return (
        <div>
          <textarea
            value={(currentAnswer as string) || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            rows={question.type === 'short_answer' ? 5 : 2}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              fontFamily: theme.fontFamily,
              backgroundColor: theme.panel,
              color: theme.text,
              border: `2px solid ${theme.accent}44`,
              borderRadius: '6px',
              resize: 'vertical',
            }}
          />
          {showCorrect && correctAnswer && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#4ade8022',
                border: '1px solid #4ade80',
                borderRadius: '4px',
              }}
            >
              <strong>Correct answer(s):</strong>
              <div style={{ marginTop: '0.5rem' }}>
                {Array.isArray(correctAnswer)
                  ? correctAnswer
                      .map((a: any) =>
                        typeof a === 'string' ? a : a.value
                      )
                      .join(', ')
                  : correctAnswer}
              </div>
            </div>
          )}
        </div>
      );
    }

    default:
      return <div>Unknown question type: {question.type}</div>;
  }
}
