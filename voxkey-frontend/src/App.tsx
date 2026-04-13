import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/Errorboundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';

import './index.css';
import './Dashboard.css';
import './Components.css';
import './Auth.css';
import './Navigation.css';

const PUBLIC_ROUTES = new Set(['/login', '/register']);

const normalizePath = (path: string) => {
  if (!path || path === '/') return '/';
  return path;
};

const AppContent: React.FC = () => {
  const [pathname, setPathname] = useState<string>(() =>
    normalizePath(window.location.pathname)
  );

  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    const handleNavigation = () => {
      setPathname(normalizePath(window.location.pathname));
    };

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('voxkey:navigate', handleNavigation);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('voxkey:navigate', handleNavigation);
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_ROUTES.has(pathname);
    let nextPath = pathname;

    if (pathname === '/') {
      nextPath = isAuthenticated ? '/dashboard' : '/login';
    }

    if (!isAuthenticated && !isPublic) {
      nextPath = '/login';
    }

    if (isAuthenticated && isPublic) {
      nextPath = '/dashboard';
    }

    if (nextPath !== window.location.pathname) {
      window.history.replaceState({}, '', nextPath);
    }

    setPathname(nextPath);
  }, [isAuthenticated, loading, pathname]);

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();
    requestAnimationFrame(resetScroll);

    const timeoutId = window.setTimeout(resetScroll, 50);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    if (pathname === '/register') return <Register />;
    return <Login />;
  }

  if (pathname === '/settings') return <Settings />;

  return <Dashboard />;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;