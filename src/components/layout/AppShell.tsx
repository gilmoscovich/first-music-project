import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../firebase/auth';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <Link to="/" style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-violet)" strokeWidth="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.02em' }}>Feedback Studio</span>
        </Link>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/upload" style={{
              background: 'var(--accent-violet)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}>
              + Upload
            </Link>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{user.email}</span>
            <button
              onClick={handleSignOut}
              style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '4px 8px' }}
            >
              Sign out
            </button>
          </div>
        )}
      </header>

      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
};
