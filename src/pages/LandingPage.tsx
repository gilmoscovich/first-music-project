import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './LandingPage.css';

// Deterministic seeded waveform bars
function seedBars(n: number): number[] {
  const bars: number[] = [];
  let s = 42;
  for (let i = 0; i < n; i++) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const base = 0.15 + Math.abs((s & 0xff) / 255) * 0.65;
    const envelope = Math.sin((i / n) * Math.PI) * 0.3 + 0.7;
    bars.push(Math.min(1, Math.max(0.1, base * envelope)));
  }
  return bars;
}

const BARS = seedBars(120);
const MARKERS = [
  { pos: 0.22, name: 'Sarah', time: '0:47', comment: 'Low-mids feel muddy here' },
  { pos: 0.45, name: 'James', time: '1:38', comment: 'The kick sits perfectly' },
  { pos: 0.72, name: 'Alex',  time: '2:31', comment: 'Vocals need more presence' },
];

const PLAY_HEAD = 0.38;

export const LandingPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  // Force light mode on the landing page; restore user preference on leave
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      const saved = localStorage.getItem('fs-theme') ?? 'system';
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = saved === 'dark' || (saved === 'system' && prefersDark);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    };
  }, []);

  const steps = [
    {
      n: '01',
      title: 'Upload your track',
      body: 'Drop any audio file — WAV, MP3, FLAC. We store it securely and generate a shareable review link.',
    },
    {
      n: '02',
      title: 'Share with collaborators',
      body: 'Send the link to producers, mix engineers, or A&R reps. No account required on their end.',
    },
    {
      n: '03',
      title: 'Collect timestamped feedback',
      body: 'Reviewers click anywhere on the waveform to pin comments at exact moments in the track.',
    },
  ];

  return (
    <div className="landing">

      {/* ── Nav ── */}
      <nav className="land-nav">
        <div className="land-nav-inner">
          <Link to="/" className="land-logo">
            <svg className="land-logo-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <span>Feedback<span className="land-logo-accent">Studio</span></span>
          </Link>

          <div className="land-nav-actions">
            <Link to="/login" className="btn-ghost btn-ghost--sm">Sign in</Link>
            <Link to="/login" className="btn-primary btn-primary--sm">Start free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text animate-up">
            <span className="eyebrow">Professional music feedback</span>
            <h1 className="hero-h1">
              Get real feedback<br />on your music.
            </h1>
            <p className="hero-body">
              Share your tracks with producers, engineers, and collaborators.
              They leave timestamped comments pinned to the exact moment in the audio —
              no more vague notes in a Google Doc.
            </p>
            <div className="hero-ctas">
              <Link to="/login" className="btn-primary">
                Start for free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <a href="#how-it-works" className="btn-ghost">See how it works</a>
            </div>
            <p className="hero-note">Free to use · No credit card · Works in any browser</p>
          </div>

          {/* Waveform player mockup */}
          <div className="hero-player animate-up" style={{ animationDelay: '0.12s' }}>
            <div className="player-card">
              <div className="player-card-accent" />

              <div className="player-track-info">
                <div>
                  <div className="player-track-title">Late Night Session v3</div>
                  <div className="player-track-meta">3:18 · 44.1 kHz · Stereo</div>
                </div>
                <span className="badge">3 markers</span>
              </div>

              {/* Waveform */}
              <div className="player-waveform">
                {BARS.map((h, i) => {
                  const pct = i / BARS.length;
                  const isPlayed = pct < PLAY_HEAD;
                  return (
                    <div
                      key={i}
                      className={`wbar ${isPlayed ? 'wbar--played' : 'wbar--unplayed'}`}
                      style={{ height: `${h * 100}%` }}
                    />
                  );
                })}

                {/* Playhead */}
                <div className="player-playhead" style={{ left: `${PLAY_HEAD * 100}%` }} />

                {/* Marker pins */}
                {MARKERS.map((m, i) => (
                  <div key={i} className="player-marker" style={{ left: `${m.pos * 100}%` }}>
                    <div className="player-marker-pin">
                      <svg width="10" height="12" viewBox="0 0 10 12" fill="#06b6d4">
                        <path d="M5 0L10 5L5 12L0 5Z" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="player-controls">
                <button className="player-play-btn" aria-label="Play">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </button>
                <span className="player-time">1:22 / 3:18</span>
                <div className="player-spacer" />
                <button className="player-pin-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Pin feedback
                </button>
              </div>
            </div>

            {/* Feedback cards preview */}
            <div className="hero-feedback-cards">
              {MARKERS.slice(0, 2).map((m, i) => (
                <div
                  key={i}
                  className="mini-card animate-up"
                  style={{ animationDelay: `${0.2 + i * 0.1}s` }}
                >
                  <div className="mini-card-header">
                    <div className="mini-card-avatar">{m.name[0]}</div>
                    <div className="mini-card-name">{m.name}</div>
                    <span className="mini-card-time">{m.time}</span>
                  </div>
                  <p className="mini-card-comment">"{m.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-inner">
          <div className="section-header-block animate-up">
            <span className="eyebrow">How it works</span>
            <h2 className="section-h2">Three steps to better feedback.</h2>
            <p className="section-body">
              No lengthy setup. No complicated software. Just upload, share, and start collecting
              meaningful, timestamped feedback in minutes.
            </p>
          </div>

          <div className="steps-grid">
            {steps.map((s, i) => (
              <div key={i} className="step-card animate-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="step-number">{s.n}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features">
        <div className="section-inner">
          <div className="section-header-block animate-up">
            <span className="eyebrow">Features</span>
            <h2 className="section-h2">Built for music professionals.</h2>
          </div>

          <div className="features-grid">
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                ),
                title: 'Timestamped markers',
                body: 'Feedback is pinned to exact seconds. No more "around the 2-minute mark" guesswork.',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 9h6M9 12h6M9 15h4" />
                  </svg>
                ),
                title: 'Frequency analysis',
                body: 'Reviewers rate each frequency band — sub, low-mid, high — with verdicts and notes.',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                ),
                title: 'Volume feedback',
                body: 'A calibrated fader lets reviewers indicate the exact dB adjustment they\'d suggest.',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                ),
                title: 'Shareable link',
                body: 'One link, no account required for reviewers. Works on any device with a browser.',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ),
                title: 'Read tracking',
                body: 'Mark feedback as read, track which sections you\'ve reviewed, stay organized.',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
                title: 'Secure storage',
                body: 'Files stored on Firebase with per-user access rules. 5 GB free on the Spark tier.',
              },
            ].map((f, i) => (
              <div key={i} className="feature-card animate-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-body">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="final-cta">
        <div className="section-inner final-cta-inner animate-up">
          <span className="eyebrow">Get started today</span>
          <h2 className="final-cta-h2">Ready to get real feedback on your music?</h2>
          <p className="final-cta-body">
            Free account. No credit card. Upload your first track in under two minutes.
          </p>
          <Link to="/login" className="btn-primary">
            Create free account
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="land-footer">
        <div className="land-footer-inner">
          <span className="land-logo">
            Feedback<span className="land-logo-accent">Studio</span>
          </span>
          <span className="land-footer-copy">© 2025 · All rights reserved</span>
        </div>
      </footer>

      <div ref={tooltipRef} />
    </div>
  );
};
