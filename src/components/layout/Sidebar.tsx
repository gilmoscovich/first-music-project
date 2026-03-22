import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../firebase/auth';
import { HelpModal } from '../help/HelpModal';
import './Sidebar.css';

const COLLAPSED_KEY = 'fs-sidebar-collapsed';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar = ({ mobileOpen = false, onMobileClose }: SidebarProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === '1'
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpModeOn, setHelpModeOn] = useState(false);
  const [helpText, setHelpText] = useState<string | null>(null);
  const [showHelpTip, setShowHelpTip] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const helpTipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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

  useEffect(() => {
    return () => { if (helpTipTimer.current) clearTimeout(helpTipTimer.current); };
  }, []);

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    navigate('/');
  };

  const handleNavClick = (to: string) => {
    if (!user) navigate('/login');
    else navigate(to);
    onMobileClose?.();
  };

  const isActive = (path: string) => location.pathname === path;

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  const toggleHints = () => {
    const next = !helpModeOn;
    setHelpModeOn(next);
    if (next) {
      setShowHelpTip(true);
      if (helpTipTimer.current) clearTimeout(helpTipTimer.current);
      helpTipTimer.current = setTimeout(() => setShowHelpTip(false), 2500);
    } else {
      setShowHelpTip(false);
    }
  };

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={onMobileClose} />
      )}

      <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}${mobileOpen ? ' sidebar--mobile-open' : ''}`}>

        {/* Logo row */}
        <div className="sidebar-logo-row">
          <Link to="/" className="sidebar-logo" onClick={onMobileClose}>
            <svg className="sidebar-logo-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.2">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            {!collapsed && (
              <span className="sidebar-logo-text">
                Feedback<span className="sidebar-logo-accent">Studio</span>
              </span>
            )}
          </Link>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item${isActive('/dashboard') ? ' sidebar-nav-item--active' : ''}`}
            onClick={() => handleNavClick('/dashboard')}
            title="My Tracks"
            data-help="View all your uploaded tracks"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            {!collapsed && <span>My Tracks</span>}
          </button>

          <button
            className={`sidebar-nav-item${isActive('/upload') ? ' sidebar-nav-item--active' : ''}`}
            onClick={() => handleNavClick('/upload')}
            title="Upload"
            data-help="Upload a new audio track"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {!collapsed && <span>Upload</span>}
          </button>
        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">
          <button
            className="sidebar-bottom-btn"
            onClick={() => setHelpOpen(true)}
            title="Help"
            data-help="Open the Help & Reference guide"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {!collapsed && <span>Help</span>}
          </button>

          <div className="sidebar-hints-wrap">
            <button
              className={`sidebar-bottom-btn${helpModeOn ? ' sidebar-bottom-btn--active' : ''}`}
              onClick={toggleHints}
              title="Hints"
              data-help="Toggle hover hints — hover any control to see what it does"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M9 21h6" />
                <path d="M12 3a6 6 0 016 6c0 2.5-1.5 4.5-3 6H9c-1.5-1.5-3-3.5-3-6a6 6 0 016-6z" />
              </svg>
              {!collapsed && <span>Hints</span>}
            </button>
            {showHelpTip && (
              <div className="sidebar-help-tip">
                Hints will appear in the bottom-right corner
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="sidebar-profile-wrap" ref={profileRef}>
            {profileOpen && user && (
              <div className="sidebar-profile-dropdown">
                <div className="sidebar-profile-email-header">{user.email}</div>
                <div className="sidebar-dropdown-divider" />
                <button className="sidebar-signout-btn" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            )}

            {profileOpen && !user && (
              <div className="sidebar-profile-dropdown">
                <Link
                  to="/login"
                  className="sidebar-dropdown-link"
                  onClick={() => setProfileOpen(false)}
                >
                  Sign in
                </Link>
              </div>
            )}

            <button
              className="sidebar-profile-btn"
              onClick={() => setProfileOpen(o => !o)}
              title={collapsed ? (user ? (user.email ?? 'Profile') : 'Sign in') : ''}
            >
              {user ? (
                <>
                  <div className="sidebar-avatar">{initial}</div>
                  {!collapsed && (
                    <span className="sidebar-profile-email-inline" title={user.email ?? ''}>
                      {user.email}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {!collapsed && <span>Sign in</span>}
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}

      {helpModeOn && helpText && (
        <div className="help-corner-panel">
          <div className="help-corner-label">Hint</div>
          {helpText}
        </div>
      )}
    </>
  );
};
