import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function TopBar() {
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between transition-colors duration-300 shadow-sm">
      <div className="font-bold tracking-tight text-primary text-xl flex items-center gap-2">
        <span className="text-accent">◆</span> SchemaSync
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button
          type="button"
          onClick={logout}
          className="text-sm font-medium text-secondary hover:text-primary transition-all duration-300 py-1.5 px-4 border border-border rounded-full hover:bg-border/30 hover:shadow-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
