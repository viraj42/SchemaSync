import { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('schemasync_token'));

  const isAuthenticated = Boolean(token);

  const login = useCallback(async (apiKey) => {
    const res = await apiLogin(apiKey);
    const storedToken = localStorage.getItem('schemasync_token');
    if (storedToken) {
      setToken(storedToken);
    } else if (res && res.token) {
      localStorage.setItem('schemasync_token', res.token);
      setToken(res.token);
    }
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('schemasync_token');
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
