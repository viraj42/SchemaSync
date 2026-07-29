import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setError('');
    setLoading(true);
    try {
      await login(apiKey.trim());
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-border/60 rounded-2xl p-8 shadow-xl shadow-black/5 transition-all duration-300">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">Welcome Back</h1>
          <p className="text-secondary text-sm">Enter your API key to access SchemaSync</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-primary mb-2">
              API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300 disabled:opacity-50"
              placeholder="••••••••••••••••"
            />
            {error && (
              <p className="text-danger text-sm mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !apiKey.trim()}
            className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-accent-text rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none font-medium text-base"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
