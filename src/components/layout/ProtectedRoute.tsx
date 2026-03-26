import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import './ProtectedRoute.css';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [reloading, setReloading] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setVerified(null); return; }
    if (user.emailVerified) { setVerified(true); return; }

    // Reload to catch verification done in another tab/session
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

  // verified === true or user.emailVerified was already true
  if (verified === null && !user.emailVerified) {
    return <div className="protected-loading">Loading...</div>;
  }

  return <>{children}</>;
};
