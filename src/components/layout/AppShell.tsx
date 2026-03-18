import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../firebase/auth';
import './AppShell.css';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-violet)" strokeWidth="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span className="app-logo-text">Feedback Studio</span>
        </Link>

        {user && (
          <div className="header-actions">
            <Link to="/upload" className="header-upload-link">
              + Upload
            </Link>
            <span className="header-email">{user.email}</span>
            <button onClick={handleSignOut} className="header-signout">
              Sign out
            </button>
          </div>
        )}
      </header>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
};
