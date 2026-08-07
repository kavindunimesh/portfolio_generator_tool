import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, type Portfolio } from './api';
import {
  clearAuthSession,
  getAuthToken,
  getAuthUsername,
  setAuthSession,
  setAuthUsername,
} from './lib/authSession';

type AuthState = {
  token: string | null;
  username: string | null;
  portfolio: Portfolio | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setSession: (token: string, username: string, remember?: boolean) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [username, setUsername] = useState<string | null>(() => getAuthUsername());
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!getAuthToken()) {
      setPortfolio(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUsername(me.user.username);
      setPortfolio(me.portfolio);
      setAuthUsername(me.user.username);
    } catch {
      clearAuthSession();
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
      setSession: (nextToken, nextUsername, remember = false) => {
        setAuthSession(nextToken, nextUsername, remember);
        setToken(nextToken);
        setUsername(nextUsername);
      },
      logout: () => {
        clearAuthSession();
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
