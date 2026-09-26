/*
 * ThemeToggle.jsx
 * Toggles between dark (default) and light themes.
 * Persists preference in localStorage and sets data-theme on <html>.
 */
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  // Initialize from localStorage or system preference
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('schemasync_theme');
    if (stored === 'light' || stored === 'dark') return stored;
    // Default to dark; fall back to system preference
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  // Apply theme to <html> element whenever it changes
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('schemasync_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      id="theme-toggle-btn"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-border text-secondary hover:text-primary hover:border-border-bright hover:bg-surface-2 transition-all duration-200"
    >
      {isDark ? (
        /* Sun icon (shown in dark mode → click to go light) */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        /* Moon icon (shown in light mode → click to go dark) */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}
