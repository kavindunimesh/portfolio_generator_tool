import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, type Portfolio } from './api';

type AuthState = {
  token: string | null;
  username: string | null;
  portfolio: Portfolio | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setSession: (token: string, username: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'));
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!localStorage.getItem('token')) {
      setPortfolio(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUsername(me.user.username);
      setPortfolio(me.portfolio);
      localStorage.setItem('username', me.user.username);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setToken(null);
      setUsername(null);
      setPortfolio(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [token]);

  const value = useMemo<AuthState>(
    () => ({
      token,
      username,
      portfolio,
      loading,
      refresh,
      setSession: (nextToken, nextUsername) => {
        localStorage.setItem('token', nextToken);
        localStorage.setItem('username', nextUsername);
        setToken(nextToken);
        setUsername(nextUsername);
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setToken(null);
        setUsername(null);
        setPortfolio(null);
      },
    }),
    [token, username, portfolio, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
