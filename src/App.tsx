import React, { useEffect, useState } from 'react';
import { AppConfig } from './config/types';
import { SessionStart } from './ui/SessionStart';
import { QuizSession } from './ui/QuizSession';

type AppView = 'start' | 'session';

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('start');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Load config from server
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => setError(err.message));
  }, []);

  const handleSessionStart = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setCurrentView('session');
  };

  const handleExitSession = () => {
    setCurrentSessionId(null);
    setCurrentView('start');
  };

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
      }}
    >
      {currentView === 'start' && (
        <SessionStart config={config} onSessionStart={handleSessionStart} />
      )}

      {currentView === 'session' && currentSessionId && (
        <QuizSession
          sessionId={currentSessionId}
          config={config}
          onExit={handleExitSession}
        />
      )}
    </div>
  );
}

export default App;
