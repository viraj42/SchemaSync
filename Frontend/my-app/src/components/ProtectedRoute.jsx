/*
 * ProtectedRoute.jsx
 * Route guard — redirects unauthenticated users to /login.
 * Props:
 *   children - the protected page component to render if authenticated
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  // If not logged in, send to /login and replace history entry
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
