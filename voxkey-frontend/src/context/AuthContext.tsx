import React, { createContext, useContext, useMemo, useState } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const DEMO_USER: User = {
  id: 'demo-user',
  username: 'Demo User',
  email: 'demo@voxkey.local',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = async (username: string, password: string) => {
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUser({
      id: 'demo-user',
      username: username || 'Demo User',
      email: 'demo@voxkey.local',
    });
    setIsAuthenticated(true);
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUser({
      id: 'demo-user',
      username: username,
      email: email,
    });
    setIsAuthenticated(true);
    setLoading(false);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      login,
      logout,
      register,
      loading,
      error: null,
    }),
    [user, isAuthenticated, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
