"use client";

import { createContext, useCallback, useContext, useMemo } from "react";

/**
 * Minimal user shape compatible with Supabase `User` fields that the app accesses.
 */
interface DevUser {
  id: string;
  email: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}

/**
 * Minimal session shape -- enough for code that checks `session?.access_token`.
 */
interface DevSession {
  access_token: string;
  user: DevUser;
}

export interface DevAuthState {
  user: DevUser;
  session: DevSession;
  loading: boolean;
  isAuthenticated: boolean;
  role: "coach" | "athlete" | "admin";
  isCoach: boolean;
  isAthlete: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ data: unknown; error: unknown }>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string) => Promise<{ data: unknown; error: unknown }>;
  logout: () => Promise<void>;
}

const DEV_USER_ID = process.env.NEXT_PUBLIC_DEV_USER_ID || "00000000-0000-0000-0000-000000000001";
const DEV_USER_EMAIL = process.env.NEXT_PUBLIC_DEV_USER_EMAIL || "coach@dev.local";
const DEV_USER_ROLE = (process.env.NEXT_PUBLIC_DEV_USER_ROLE || "coach") as
  | "coach"
  | "athlete"
  | "admin";

const devUser: DevUser = {
  id: DEV_USER_ID,
  email: DEV_USER_EMAIL,
  app_metadata: { role: DEV_USER_ROLE },
  user_metadata: {},
};

const devSession: DevSession = {
  access_token: "dev-token",
  user: devUser,
};

const DevAuthContext = createContext<DevAuthState | null>(null);

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const login = useCallback(async (_email: string, _password: string) => {
    console.log("[DevAuth] login called -- no-op in dev mode");
    return { data: { user: devUser, session: devSession }, error: null };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    console.log("[DevAuth] loginWithGoogle called -- no-op in dev mode");
  }, []);

  const signup = useCallback(async (_email: string, _password: string) => {
    console.log("[DevAuth] signup called -- no-op in dev mode");
    return { data: { user: devUser, session: devSession }, error: null };
  }, []);

  const logout = useCallback(async () => {
    console.log("[DevAuth] logout called -- no-op in dev mode");
  }, []);

  const value: DevAuthState = useMemo(
    () => ({
      user: devUser,
      session: devSession,
      loading: false,
      isAuthenticated: true,
      role: DEV_USER_ROLE,
      isCoach: DEV_USER_ROLE === "coach",
      isAthlete: DEV_USER_ROLE === "athlete",
      isAdmin: DEV_USER_ROLE === "admin",
      login,
      loginWithGoogle,
      signup,
      logout,
    }),
    [login, loginWithGoogle, signup, logout]
  );

  return <DevAuthContext.Provider value={value}>{children}</DevAuthContext.Provider>;
}

export function useDevAuth(): DevAuthState {
  const ctx = useContext(DevAuthContext);
  if (!ctx) {
    throw new Error("useDevAuth must be used inside <DevAuthProvider>");
  }
  return ctx;
}
