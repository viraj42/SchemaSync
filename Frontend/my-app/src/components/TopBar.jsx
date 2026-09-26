/*
 * TopBar.jsx
 * Sticky navigation bar — only visible when authenticated.
 * Shows the SchemaSync logo, theme toggle, and logout button.
 */
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function TopBar() {
  const { isAuthenticated, logout } = useAuth();

  // Hide the top bar completely on the login page
  if (!isAuthenticated) return null;

  return (
    <header
      id="top-bar"
      className="sticky top-0 z-50 border-b border-border"
      style={{
        background: 'var(--topbar-bg)',
        backdropFilter: 'blur(20px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
        boxShadow: '0 1px 0 var(--border)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* ---- Brand Logo ---- */}
        <div className="flex items-center gap-2.5">
          {/* Icon mark */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--grad-start), var(--grad-mid))',
              boxShadow: '0 2px 12px rgba(99,102,241,0.35)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Schema<span className="gradient-text">Sync</span>
          </span>
        </div>

        {/* ---- Right Controls ---- */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            id="logout-btn"
            onClick={logout}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-border text-secondary hover:text-danger hover:border-danger/40 hover:bg-danger/5 transition-all duration-200"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
