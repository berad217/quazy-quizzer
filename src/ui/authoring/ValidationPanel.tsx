import React from 'react';
import { useTheme } from '../ThemeContext';

interface ValidationError {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
}

export function ValidationPanel({ errors }: { errors: ValidationError[] }) {
  const { theme } = useTheme();

  if (errors.length === 0) {
    return null;
  }

  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;
  const infoCount = errors.filter((e) => e.severity === 'info').length;

  const getBgColor = () => {
    if (errorCount > 0) return '#fee2e2';
    if (warningCount > 0) return '#fef3c7';
    return '#dbeafe';
  };

  const getBorderColor = () => {
    if (errorCount > 0) return '#dc2626';
    if (warningCount > 0) return '#f59e0b';
    return '#3b82f6';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return '#dc2626';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return theme.text;
    }
  };

  return (
    <div
      style={{
        padding: '1rem',
        marginBottom: '1.5rem',
        backgroundColor: getBgColor(),
        border: `2px solid ${getBorderColor()}`,
        borderRadius: '4px',
      }}
    >
      <h4 style={{ margin: '0 0 1rem 0', color: '#000' }}>
        Validation Results
        {errorCount > 0 && <span style={{ marginLeft: '0.5rem' }}>({errorCount} errors)</span>}
        {warningCount > 0 && <span style={{ marginLeft: '0.5rem' }}>({warningCount} warnings)</span>}
        {infoCount > 0 && <span style={{ marginLeft: '0.5rem' }}>({infoCount} info)</span>}
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {errors.map((err, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '4px',
              fontSize: '0.9rem',
              color: '#000',
            }}
          >
            <span
              style={{
                fontWeight: 'bold',
                color: getSeverityColor(err.severity),
                textTransform: 'uppercase',
              }}
            >
              {err.severity}:
            </span>{' '}
            {err.message}
          </div>
        ))}
      </div>

      {errorCount > 0 && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderRadius: '4px',
            fontSize: '0.85rem',
            color: '#000',
            fontWeight: 'bold',
          }}
        >
          Cannot publish quiz until all errors are fixed.
        </div>
      )}
    </div>
  );
}
