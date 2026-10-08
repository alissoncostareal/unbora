import { createContext, useContext, useMemo, useState } from 'react';

import { loginWithGoogle, loginWithPassword, registerUser, type SessionUser } from './api';

const STORAGE_KEY = 'unbora-user';

interface AuthContextValue {
  user: SessionUser | null;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): SessionUser | null {
  const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

function storeSession(session: SessionUser, remember: boolean) {
  const keep = remember ? localStorage : sessionStorage;
  const drop = remember ? sessionStorage : localStorage;
  drop.removeItem(STORAGE_KEY);
  keep.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readStoredUser);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    async login(email, password, remember = true) {
      const session = await loginWithPassword(email, password);
      storeSession(session, remember);
      setUser(session);
    },
    async register(name, email, password) {
      await registerUser(name, email, password);
      const session = await loginWithPassword(email, password);
      storeSession(session, true);
      setUser(session);
    },
    async loginGoogle(idToken) {
      const session = await loginWithGoogle(idToken);
      storeSession(session, true);
      setUser(session);
    },
    logout() {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      setUser(null);
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth fora do AuthProvider');
  return context;
}
