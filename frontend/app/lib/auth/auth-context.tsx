"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isDemoCredentials } from "./demo-config";
import {
  clearSession,
  createDemoSession,
  readSession,
  writeSession,
  type DemoSession,
} from "./session";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: DemoSession | null;
  login: (email: string, password: string) => string | null;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<DemoSession | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const session = readSession();
      if (session) {
        writeSession(session);
        setUser(session);
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const login = useCallback((email: string, password: string) => {
    if (!isDemoCredentials(email, password)) {
      return "Invalid email or password. Use the demo credentials shown below.";
    }
    const session = createDemoSession();
    writeSession(session);
    setUser(session);
    setStatus("authenticated");
    return null;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ status, user, login, logout }),
    [status, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
