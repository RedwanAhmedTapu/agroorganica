"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as api from "./api";

type Ctx = {
  admin: api.AdminProfile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<api.AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const profile = await api.me();
      setAdmin(profile);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password);
    setAdmin(res.admin);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setAdmin(null);
    }
  }, []);

  return <AuthCtx.Provider value={{ admin, loading, login, logout, refresh }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
