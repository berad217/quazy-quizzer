import React from 'react';
import { useTheme } from '../../ThemeContext';

export function QuestionMetaFields({
  difficulty,
  category,
  onDifficultyChange,
  onCategoryChange,
}: {
  difficulty?: number;
  category?: string;
  onDifficultyChange: (value: number | undefined) => void;
  onCategoryChange: (value: string | undefined) => void;
}) {
  const { theme } = useTheme();

  return (
    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: `1px solid ${theme.border}` }}>
      <h4 style={{ marginBottom: '1rem' }}>Metadata (for Adaptive Difficulty)</h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Difficulty (1-5)
          </label>
          <input
            type="number"
            value={difficulty || ''}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onDifficultyChange(val >= 1 && val <= 5 ? val : undefined);
            }}
            min={1}
            max={5}
            placeholder="Leave empty for default"
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: theme.secondary,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
            }}
          />
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>
            1 = Very Easy, 5 = Very Hard
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Category
          </label>
          <input
            type="text"
            value={category || ''}
            onChange={(e) => onCategoryChange(e.target.value || undefined)}
            placeholder="e.g., math, science, geography"
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: theme.secondary,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
            }}
          />
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>
            Used for skill tracking
          </div>
        </div>
      </div>
    </div>
  );
}
