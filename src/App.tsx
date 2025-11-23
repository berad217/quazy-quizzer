import React, { useEffect, useState } from 'react';
import { AppConfig } from './config/types';
import { UserProfile } from './storage/userProfile';
import { SessionStart } from './ui/SessionStart';
import { QuizSession } from './ui/QuizSession';
import { ThemeProvider, useTheme } from './ui/ThemeContext';
import { QuizAuthoringApp } from './ui/authoring/QuizAuthoringApp';

type AppView = 'start' | 'session' | 'authoring';

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('start');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Load config from server
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => setError(err.message));
  }, []);

  // Load current user profile when user changes
  useEffect(() => {
    if (currentUserId) {
      fetch(`/api/users/${currentUserId}`)
        .then((res) => res.json())
        .then((user) => setCurrentUser(user))
        .catch((err) => console.error('Failed to load user profile:', err));
    } else {
      setCurrentUser(null);
    }
  }, [currentUserId]);

  const handleSessionStart = (sessionId: string, userId: string) => {
    setCurrentSessionId(sessionId);
    setCurrentUserId(userId);
    setCurrentView('session');
  };

  const handleExitSession = () => {
    setCurrentSessionId(null);
    setCurrentView('start');
  };

  const handleUserChange = (userId: string) => {
    setCurrentUserId(userId);
  };

  const handleEnterAuthoring = () => {
    setCurrentView('authoring');
  };

  const handleExitAuthoring = () => {
    setCurrentView('start');
  };

  const handleThemeChange = async (themeName: string) => {
    if (!currentUserId) return;

    try {
      // Update user settings on server
      await fetch(`/api/users/${currentUserId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeName }),
      });

      // Update local user state
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          settings: {
            ...currentUser.settings,
            theme: themeName,
          },
        });
      }
    } catch (err) {
      console.error('Failed to save theme preference:', err);
    }
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

  const userTheme = currentUser?.settings?.theme;

  return (
    <ThemeProvider
      config={config}
      userTheme={userTheme}
      onThemeChange={handleThemeChange}
    >
      <AppContent
        currentView={currentView}
        currentSessionId={currentSessionId}
        currentUserId={currentUserId}
        onSessionStart={handleSessionStart}
        onExitSession={handleExitSession}
        onUserChange={handleUserChange}
        onEnterAuthoring={handleEnterAuthoring}
        onExitAuthoring={handleExitAuthoring}
      />
    </ThemeProvider>
  );
}

// Separate component to use useTheme hook
function AppContent({
  currentView,
  currentSessionId,
  currentUserId,
  onSessionStart,
  onExitSession,
  onUserChange,
  onEnterAuthoring,
  onExitAuthoring,
}: {
  currentView: AppView;
  currentSessionId: string | null;
  currentUserId: string | null;
  onSessionStart: (sessionId: string, userId: string) => void;
  onExitSession: () => void;
  onUserChange: (userId: string) => void;
  onEnterAuthoring: () => void;
  onExitAuthoring: () => void;
}) {
  const { theme } = useTheme();

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
        <SessionStart
          onSessionStart={onSessionStart}
          onUserChange={onUserChange}
          currentUserId={currentUserId}
          onEnterAuthoring={onEnterAuthoring}
        />
      )}

      {currentView === 'session' && currentSessionId && (
        <QuizSession
          sessionId={currentSessionId}
          onExit={onExitSession}
        />
      )}

      {currentView === 'authoring' && (
        <QuizAuthoringApp onExit={onExitAuthoring} />
      )}
    </div>
  );
}

export default App;
