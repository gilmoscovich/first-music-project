import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { ReviewPage } from './pages/ReviewPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { useTheme } from './hooks/useTheme';

const AppRoutes = () => {
  useTheme(); // Apply system theme to <html> globally for all routes
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <DashboardPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <AppShell>
              <UploadPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/review/:trackId"
        element={<ReviewPage />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
