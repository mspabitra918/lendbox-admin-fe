"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, readSession, SESSION_EXPIRED_EVENT, writeSession } from "./api";
import type { AdminProfile, LoginResponse } from "./types";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  admin: AdminProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [admin, setAdmin] = useState<AdminProfile | null>(null);

  const clear = useCallback(() => {
    writeSession(null);
    setAdmin(null);
    setStatus("anonymous");
  }, []);

  // Restore an existing session on load.
  useEffect(() => {
    let cancelled = false;
    if (!readSession()) {
      queueMicrotask(clear);
      return;
    }
    api
      .get<AdminProfile>("/auth/admin/me")
      .then((profile) => {
        if (cancelled) return;
        setAdmin(profile);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!cancelled) clear();
      });
    return () => {
      cancelled = true;
    };
  }, [clear]);

  // Any 401 from the API, or the token reaching expiresAt, ends the session.
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, clear);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, clear);
  }, [clear]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const session = readSession();
    if (!session) return;
    const ms = new Date(session.expiresAt).getTime() - Date.now();
    const timer = window.setTimeout(clear, Math.max(ms, 0));
    return () => window.clearTimeout(timer);
  }, [status, clear]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<LoginResponse>("/auth/admin/login", { email, password });
    writeSession({ accessToken: result.accessToken, expiresAt: result.expiresAt });
    setAdmin(result.admin);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/admin/logout");
    } catch {
      // Session may already be gone server-side; clear locally regardless.
    }
    clear();
  }, [clear]);

  const value = useMemo(() => ({ status, admin, login, logout }), [status, admin, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
