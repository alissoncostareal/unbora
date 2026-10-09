'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginMerchant, loginWithGoogle, registerMerchant } from './api';
import type { MerchantUser } from './types';

const STORAGE_KEY = 'unbora-business-session';

interface AuthContextValue {
  user: MerchantUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginGoogle: (idToken: string) => Promise<void>;
  register: (name: string, email: string, pass: string, business: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MerchantUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error reading session:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const u = await loginMerchant(email, password);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        setUser(u);
      },
      async loginGoogle(idToken) {
        const u = await loginWithGoogle(idToken);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        setUser(u);
      },
      async register(name, email, password, businessName) {
        const u = await registerMerchant(name, email, password, businessName);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        setUser(u);
      },
      logout() {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        window.location.href = '/login';
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
