import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../firebase/auth';
import './AppShell.css';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="app-shell">
      <header className="app-header">
        {/* LEFT: profile + upload */}
        <div className="header-left">
          {user && (
            <>
              <div className="profile-menu" ref={profileRef}>
                <button
                  className="profile-avatar"
                  onClick={() => setProfileOpen(o => !o)}
                  title="Profile"
                >
                  {initial}
                </button>

                {profileOpen && (
                  <div className="profile-dropdown">
                    <div className="profile-email">{user.email}</div>
                    <div className="profile-divider" />
                    <button onClick={handleSignOut} className="profile-signout">
                      Sign out
                    </button>
                  </div>
                )}
              </div>

              <Link to="/upload" className="header-upload-link">
                + Upload
              </Link>
            </>
          )}
        </div>

        {/* RIGHT: brand logo */}
        <Link to="/" className="app-logo">
          <span className="app-logo-text">Feedback Studio</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-violet)" strokeWidth="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </Link>
      </header>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
};
