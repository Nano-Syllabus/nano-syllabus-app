import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, clearCache } from './api';
import type { User } from './types';

// The session itself is an HttpOnly cookie the server sets. We only remember
// the user's name locally so the header paints signed-in instantly; the
// server's /api/auth/me answer is the truth.
const KEY = 'ns-user';

type AuthState = {
  user: User | null;
  ready: boolean; // true once the server has confirmed who we are
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  /** Replace the signed-in user after a profile change (onboarding). */
  setUser: (u: User) => void;
};

const Ctx = createContext<AuthState | null>(null);

function remembered(): User | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null');
  } catch {
    return null;
  }
}

function remember(u: User | null) {
  try {
    if (u) localStorage.setItem(KEY, JSON.stringify(u));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(remembered);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<{ user: User | null }>('/api/auth/me')
      .then(({ user: u }) => {
        if ((u?.id ?? null) !== (remembered()?.id ?? null)) clearCache();
        setUser(u);
        remember(u);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const signedIn = useCallback((u: User) => {
    clearCache();
    remember(u);
    setUser(u);
    setReady(true);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: u } = await api<{ user: User }>('/api/auth/login', { method: 'POST', body: { email, password } });
      signedIn(u);
      return u;
    },
    [signedIn],
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const { user: u } = await api<{ user: User }>('/api/auth/signup', { method: 'POST', body: { name, email, password } });
      signedIn(u);
      return u;
    },
    [signedIn],
  );

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST', body: {} }).catch(() => {});
    clearCache();
    remember(null);
    setUser(null);
  }, []);

  const replaceUser = useCallback((u: User) => {
    remember(u);
    setUser(u);
  }, []);

  return <Ctx.Provider value={{ user, ready, login, signup, logout, setUser: replaceUser }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
