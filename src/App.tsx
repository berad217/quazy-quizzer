import React, { useEffect, useState } from 'react';
import { AppConfig } from './config/types';

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load config from server
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <h1>Error loading config</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  const theme = config.themes[config.defaultTheme];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.background,
        color: theme.text,
        fontFamily: theme.fontFamily,
        padding: '2rem',
      }}
    >
      <h1 style={{ color: theme.accent }}>{config.appName}</h1>
      <p>Sprint 1 - Skeleton & Config ✓</p>

      <div
        style={{
          backgroundColor: theme.panel,
          padding: '1.5rem',
          borderRadius: '8px',
          marginTop: '2rem',
        }}
      >
        <h2>Configuration Loaded Successfully</h2>
        <ul>
          <li>Theme: {config.defaultTheme}</li>
          <li>Quiz Folder: {config.quizFolder}</li>
          <li>User Data: {config.userDataFile}</li>
          <li>
            Features Enabled:{' '}
            {Object.entries(config.features)
              .filter(([, enabled]) => enabled)
              .map(([feature]) => feature)
              .join(', ')}
          </li>
        </ul>
      </div>

      <div
        style={{
          backgroundColor: theme.panel,
          padding: '1.5rem',
          borderRadius: '8px',
          marginTop: '1rem',
        }}
      >
        <h3>Next Steps</h3>
        <p>Sprint 2 will implement:</p>
        <ul>
          <li>Quiz file schema and TypeScript types</li>
          <li>Quiz file loader and validator</li>
          <li>Quiz registry system</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
