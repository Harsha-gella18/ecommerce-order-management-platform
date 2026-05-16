import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { HomePage } from '../pages/HomePage.jsx';
import { dashboardPathForRole } from '../utils/dashboardPath.js';
import { PageLoader } from './ui/Spinner.jsx';

export function LandingGate() {
  const { user, loading } = useAuth();
  if (loading) {
    return <PageLoader />;
  }
  if (user) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }
  return <HomePage />;
}
