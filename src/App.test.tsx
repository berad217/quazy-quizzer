import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { DEFAULT_CONFIG } from './config/defaults';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('App Component', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should show loading state initially', () => {
    mockFetch.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );

    render(<App />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should load and display config', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => DEFAULT_CONFIG,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(DEFAULT_CONFIG.appName)).toBeInTheDocument();
    });

    expect(
      screen.getByText('Sprint 1 - Skeleton & Config ✓')
    ).toBeInTheDocument();
  });

  it('should display error when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Error loading config')).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('should display configuration details', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => DEFAULT_CONFIG,
    });

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText('Configuration Loaded Successfully')
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Theme: dark/i, { exact: false })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Quiz Folder: \.\/quizzes/i, { exact: false })
    ).toBeInTheDocument();
  });

  it('should apply theme styles', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => DEFAULT_CONFIG,
    });

    const { container } = render(<App />);

    await waitFor(() => {
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.style.backgroundColor).toBe(
        DEFAULT_CONFIG.themes.dark.background
      );
      expect(mainDiv.style.color).toBe(DEFAULT_CONFIG.themes.dark.text);
    });
  });

  it('should call /api/config endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => DEFAULT_CONFIG,
    });

    render(<App />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/config');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  it('should display enabled features', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => DEFAULT_CONFIG,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Features Enabled:/)).toBeInTheDocument();
    });

    // Check that some features are listed
    const featuresText = screen.getByText(/Features Enabled:/).textContent;
    expect(featuresText).toContain('allowQuestionJump');
    expect(featuresText).toContain('allowReviewMode');
  });

  it('should use light theme when configured', async () => {
    const lightConfig = {
      ...DEFAULT_CONFIG,
      defaultTheme: 'light',
    };

    mockFetch.mockResolvedValueOnce({
      json: async () => lightConfig,
    });

    const { container } = render(<App />);

    await waitFor(() => {
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.style.backgroundColor).toBe(
        DEFAULT_CONFIG.themes.light.background
      );
    });
  });
});
