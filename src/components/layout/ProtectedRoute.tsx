import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import './ProtectedRoute.css';

// Only accounts created after this date must verify their email.
// Existing accounts created before this feature was deployed are exempt.
const VERIFICATION_REQUIRED_AFTER = new Date('2026-03-26T00:00:00Z').getTime();

const requiresVerification = (creationTime: string | undefined) => {
  if (!creationTime) return false;
  return new Date(creationTime).getTime() >= VERIFICATION_REQUIRED_AFTER;
};

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [reloading, setReloading] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setVerified(null); return; }
    if (user.emailVerified) { setVerified(true); return; }
    if (!requiresVerification(user.metadata.creationTime)) { setVerified(true); return; }

    // New account, not yet verified — reload to catch cross-tab verification
    setReloading(true);
    user.reload().then(() => {
      setVerified(auth.currentUser?.emailVerified ?? false);
    }).finally(() => setReloading(false));
  }, [user]);

  if (loading || reloading) {
    return <div className="protected-loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (verified === false) {
    return <Navigate to="/verify-email" replace />;
  }

  if (verified === null && !user.emailVerified) {
    return <div className="protected-loading">Loading...</div>;
  }

  return <>{children}</>;
};
