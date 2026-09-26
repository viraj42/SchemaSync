/*
 * App.jsx
 * Root component — sets up React Router and the page layout.
 *
 * Route structure:
 *   /login                   → LoginPage (public)
 *   /                        → UploadPage (protected)
 *   /jobs/:jobId             → ProgressPage (protected)
 *   /jobs/:jobId/failures    → FailuresPage (protected)
 *
 * ProtectedRoute wraps guarded routes — if the user is not
 * authenticated it redirects them to /login.
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopBar          from './components/TopBar';
import ProtectedRoute  from './components/ProtectedRoute';
import LoginPage       from './pages/LoginPage';
import UploadPage      from './pages/UploadPage';
import ProgressPage    from './pages/ProgressPage';
import FailuresPage    from './pages/FailuresPage';

export default function App() {
  return (
    <BrowserRouter>
      {/* Flex column so TopBar stays at top and main fills the rest */}
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

        {/* Sticky nav bar (hidden on the login page via internal logic) */}
        <TopBar />

        {/* Page content */}
        <main className="flex-1">
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes — redirect to /login if unauthenticated */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:jobId"
              element={
                <ProtectedRoute>
                  <ProgressPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:jobId/failures"
              element={
                <ProtectedRoute>
                  <FailuresPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
