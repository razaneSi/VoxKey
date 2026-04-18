import React, { useEffect, useState, useCallback } from 'react';
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

const getPath = () => window.location.pathname || '/';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  const [path, setPath] = useState<string>(getPath);

  // Sync navigation events (back/forward + custom events)
  const syncPath = useCallback(() => {
    setPath(getPath());
  }, []);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    window.addEventListener('popstate', syncPath);
    window.addEventListener('voxkey:navigate', syncPath);

    return () => {
      window.removeEventListener('popstate', syncPath);
      window.removeEventListener('voxkey:navigate', syncPath);
    };
  }, [syncPath]);

  // Routing logic (single source of truth)
  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_ROUTES.has(path);

    let nextPath = path;

    // Root redirect
    if (path === '/') {
      nextPath = isAuthenticated ? '/dashboard' : '/login';
    }

    // Protect private routes
    if (!isAuthenticated && !isPublic) {
      nextPath = '/login';
    }

    // Prevent authenticated users from seeing login/register
    if (isAuthenticated && isPublic) {
      nextPath = '/dashboard';
    }

    // Apply only if needed
    if (nextPath !== path) {
      window.history.replaceState({}, '', nextPath);
      setPath(nextPath);
    }
  }, [isAuthenticated, loading, path]);

  // Scroll reset on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const id = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });

    const timeout = window.setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);

    return () => {
      cancelAnimationFrame(id);
      clearTimeout(timeout);
    };
  }, [path]);

  // Loading state
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Public routing
  if (!isAuthenticated) {
    if (path === '/register') return <Register />;
    return <Login />;
  }

  // Private routes
  if (path === '/settings') return <Settings />;

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