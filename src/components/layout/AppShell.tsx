import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeMode } from '../../hooks/useTheme';
import { Sidebar } from './Sidebar';
import './AppShell.css';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Projects',
  '/upload': 'Upload',
};

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'dark',   label: '☾ Dark'   },
  { value: 'light',  label: '☀ Light'  },
  { value: 'system', label: '⊙ System' },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { mode, setTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Projects';

  return (
    <div className="page-root">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="page-body">
        <div className="page-header">
          <div className="page-header-left">
            <button
              className="page-header-hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>
            <span className="page-header-title">{pageTitle}</span>
          </div>

          <div className="page-header-theme-pill" role="group" aria-label="Theme">
            {THEME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`page-header-theme-btn${mode === opt.value ? ' page-header-theme-btn--active' : ''}`}
                onClick={() => setTheme(opt.value)}
                aria-pressed={mode === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <main className="page-main">
          {children}
        </main>
      </div>
    </div>
  );
};
