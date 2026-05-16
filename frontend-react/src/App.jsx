import { ErrorBoundary } from './components/system/ErrorBoundary.jsx';
import { ThemeSync } from './components/system/ThemeSync.jsx';
import { ToastStack } from './components/system/ToastStack.jsx';
import { DevBackendBanner } from './components/DevBackendBanner.jsx';
import { RouteSync } from './components/layout/RouteSync.jsx';
import { AppRoutes } from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <RouteSync />
      <ThemeSync />
      <ToastStack />
      <DevBackendBanner />
      <AppRoutes />
    </ErrorBoundary>
  );
}
