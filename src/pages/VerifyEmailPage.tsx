import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { sendVerificationEmail, signOut } from '../firebase/auth';
import './VerifyEmailPage.css';

const RESEND_COOLDOWN = 60;

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCheck = async () => {
    if (!auth.currentUser) return;
    setChecking(true);
    setCheckError('');
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        navigate('/dashboard');
      } else {
        setCheckError('Email not yet verified — please check your inbox and try again.');
      }
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (!auth.currentUser || cooldown > 0) return;
    try {
      await sendVerificationEmail(auth.currentUser);
      setResendSuccess(true);
      startCooldown();
    } catch {
      setCheckError('Failed to resend — please try again shortly.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="verify-page">
      <div className="verify-card">
        <div className="verify-header">
          <div className="verify-logo">
            <div className="verify-logo-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <span>Feedback<span className="verify-logo-accent">Studio</span></span>
          </div>

          <div className="verify-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m2 7 10 7 10-7" />
            </svg>
          </div>

          <h1 className="verify-title">Check your inbox</h1>
          <p className="verify-subtitle">
            We sent a verification link to<br />
            <strong>{user.email}</strong>
          </p>
        </div>

        <div className="verify-actions">
          {checkError && <div className="verify-error">{checkError}</div>}

          <button
            className={`verify-btn-primary${checking ? ' verify-btn--loading' : ''}`}
            onClick={handleCheck}
            disabled={checking}
          >
            {checking ? 'Checking...' : "I've verified — continue"}
          </button>

          <button
            className="verify-btn-ghost"
            onClick={handleResend}
            disabled={cooldown > 0}
          >
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : resendSuccess
              ? 'Email sent!'
              : 'Resend email'}
          </button>
        </div>

        <div className="verify-signout">
          Wrong email?{' '}
          <button onClick={handleSignOut} className="verify-link">Sign out</button>
        </div>
      </div>
    </div>
  );
};
