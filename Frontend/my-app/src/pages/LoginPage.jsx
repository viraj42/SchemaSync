/*
 * LoginPage.jsx
 * The authentication entry point.
 *
 * Flow:
 *   1. User types their API key into the input field.
 *   2. On submit, calls login() from AuthContext which hits POST /api/auth/token.
 *   3. The backend validates the API key and returns a JWT token.
 *   4. Token is stored in localStorage → user is redirected to the upload page.
 *
 * Why this structure?
 *   - useState manages local form state (apiKey input value, error message, loading flag).
 *   - useAuth() is a custom hook that provides the login function from context.
 *   - useNavigate() lets us programmatically redirect after a successful login.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  // Form state
  const [apiKey, setApiKey]   = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  // Called when the form is submitted
  const handleSubmit = async (e) => {
    e.preventDefault();               // Prevent default browser form submit
    if (!apiKey.trim()) return;       // Guard: ignore empty submission

    setError('');
    setLoading(true);

    try {
      await login(apiKey.trim());     // POST /api/auth/token — stores JWT on success
      navigate('/');                  // Redirect to the upload page
    } catch (err) {
      setError(err.message || 'Invalid API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="login-page"
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* ---- Decorative Background Blobs ---- */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {/* Top-left purple blob */}
        <div
          style={{
            position: 'absolute', top: '-15%', left: '-10%',
            width: 480, height: 480, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* Bottom-right cyan blob */}
        <div
          style={{
            position: 'absolute', bottom: '-15%', right: '-10%',
            width: 420, height: 420, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* ---- Login Card ---- */}
      <div
        className="relative w-full max-w-md fade-in-up"
        style={{ zIndex: 1 }}
      >
        {/* Card glow ring */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: -1, borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.2), rgba(6,182,212,0.2))',
            filter: 'blur(1px)',
            zIndex: -1,
          }}
        />

        <div
          className="rounded-3xl p-8"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}
        >
          {/* ---- Header ---- */}
          <div className="text-center mb-8">
            {/* Brand icon */}
            <div className="flex justify-center mb-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--grad-start), var(--grad-mid))',
                  boxShadow: '0 8px 28px rgba(99,102,241,0.4)',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Welcome to <span className="gradient-text">SchemaSync</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Enter your API key to access the platform
            </p>
          </div>

          {/* ---- Form ---- */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                API Key
              </label>

              {/* Input with show/hide toggle */}
              <div className="relative">
                <input
                  id="apiKey"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={loading}
                  placeholder="sk-••••••••••••••••••••••"
                  className="input-field pr-12 mono"
                  autoComplete="current-password"
                  spellCheck={false}
                />
                {/* Show / hide password button */}
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  tabIndex={-1}
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div
                  className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.2)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading || !apiKey.trim()}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  {/* Spinning loader icon */}
                  <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Authenticating…
                </>
              ) : (
                <>
                  Sign in
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* ---- Footer hint ---- */}
          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-secondary)' }}>
            API keys are managed by your SchemaSync administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
