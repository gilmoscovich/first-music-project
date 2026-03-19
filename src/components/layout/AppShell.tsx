import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeMode } from '../../hooks/useTheme';
import { signOut } from '../../firebase/auth';
import { HelpModal } from '../help/HelpModal';
import './AppShell.css';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light', label: 'Light', icon: '☀' },
  { mode: 'dark',  label: 'Dark',  icon: '☾' },
  { mode: 'system', label: 'System', icon: '⊙' },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { mode, setTheme } = useTheme();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpModeOn, setHelpModeOn] = useState(false);
  const [helpText, setHelpText] = useState<string | null>(null);
  const [showHelpTip, setShowHelpTip] = useState(false);
  const helpTipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (!helpModeOn) { setHelpText(null); return; }
    const onOver = (e: MouseEvent) => {
      const el = (e.target as Element).closest('[data-help]');
      setHelpText(el?.getAttribute('data-help') ?? null);
    };
    const onOut = () => setHelpText(null);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseleave', onOut, true);
    return () => {
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseleave', onOut, true);
    };
  }, [helpModeOn]);

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
                  data-help="Profile menu — access My Tracks, change theme, or sign out"
                >
                  {initial}
                </button>

                {profileOpen && (
                  <div className="profile-dropdown">
                    <div className="profile-email">{user.email}</div>
                    <div className="profile-divider" />
                    <Link
                      to="/"
                      className="profile-menu-link"
                      onClick={() => setProfileOpen(false)}
                    >
                      My Tracks
                    </Link>
                    <div className="profile-divider" />

                    <div className="theme-row">
                      <span className="theme-label">Theme</span>
                      <div className="theme-toggle">
                        {THEME_OPTIONS.map(({ mode: m, label, icon }) => (
                          <button
                            key={m}
                            className={`theme-btn${mode === m ? ' theme-btn--active' : ''}`}
                            onClick={() => setTheme(m)}
                            title={label}
                          >
                            <span className="theme-btn-icon">{icon}</span>
                            <span className="theme-btn-label">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="profile-divider" />
                    <button onClick={handleSignOut} className="profile-signout">
                      Sign out
                    </button>
                  </div>
                )}
              </div>

              <Link to="/upload" className="header-upload-link" data-help="Upload a new audio track to collect feedback on">
                + Upload
              </Link>
            </>
          )}
        </div>

        {/* CENTER: help buttons */}
        <div className="header-center">
          <button
            className="help-btn"
            onClick={() => setHelpOpen(true)}
            title="Help & Reference"
            data-help="Open the Help & Reference guide — a quick overview of all features"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            Help
          </button>
          <button
            className={`help-mode-btn${helpModeOn ? ' help-mode-btn--active' : ''}`}
            onClick={() => {
              const next = !helpModeOn;
              setHelpModeOn(next);
              if (next) {
                setShowHelpTip(true);
                if (helpTipTimer.current) clearTimeout(helpTipTimer.current);
                helpTipTimer.current = setTimeout(() => setShowHelpTip(false), 2500);
              } else {
                setShowHelpTip(false);
              }
            }}
            title={helpModeOn ? 'Disable hover hints' : 'Enable hover hints'}
            data-help="Toggle hover hints — hover any control to see what it does"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21h6" />
              <path d="M12 3a6 6 0 016 6c0 2.5-1.5 4.5-3 6H9c-1.5-1.5-3-3.5-3-6a6 6 0 016-6z" />
            </svg>
            Hints
          </button>
          {showHelpTip && (
            <div className="help-mode-tip">
              Hints will appear in the bottom-right corner
            </div>
          )}
        </div>

        {/* RIGHT: brand logo */}
        <Link to="/" className="app-logo" data-help="Go to your dashboard — view and manage all your tracks">
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

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}

      {helpModeOn && helpText && (
        <div className="help-corner-panel">
          <div className="help-corner-label">Hint</div>
          {helpText}
        </div>
      )}
    </div>
  );
};
