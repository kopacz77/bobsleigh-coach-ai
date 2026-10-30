"use client";

import { createContext, useContext } from "react";
import { useAuth as useSupabaseAuth } from "@/hooks/useAuth";
import { DevAuthProvider, useDevAuth } from "@/providers/DevAuthProvider";
import { SupabaseProvider } from "@/providers/SupabaseProvider";

/**
 * Unified auth shape.  Both the dev and supabase auth hooks return this shape
 * (DevAuthState is a strict superset of what useAuth from hooks returns).
 */
export interface AuthState {
  user: unknown;
  session: unknown;
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

const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE || "dev";

/**
 * Context that signals whether the app is running in dev auth mode.
 * Components like AuthGuard can read this to skip Supabase auth checks.
 */
export const AuthModeContext = createContext<"dev" | "supabase">(
  AUTH_MODE === "dev" ? "dev" : "supabase"
);

export function useAuthMode() {
  return useContext(AuthModeContext);
}

/**
 * Wraps the app tree with the appropriate auth provider based on
 * NEXT_PUBLIC_AUTH_MODE environment variable.
 *
 * - "dev"      -> DevAuthProvider  (always logged in, no Supabase needed)
 * - "supabase" -> SupabaseProvider (real Supabase Auth)
 *
 * In dev mode, SupabaseProvider is still rendered as an inner wrapper so that
 * legacy components calling useSupabase() get a safe default context
 * ({supabase: null, loading: false}) instead of a missing-provider error.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const mode: "dev" | "supabase" = AUTH_MODE === "dev" ? "dev" : "supabase";

  if (mode === "dev") {
    return (
      <AuthModeContext.Provider value="dev">
        <DevAuthProvider>
          <SupabaseProvider>{children}</SupabaseProvider>
        </DevAuthProvider>
      </AuthModeContext.Provider>
    );
  }

  return (
    <AuthModeContext.Provider value="supabase">
      <SupabaseProvider>{children}</SupabaseProvider>
    </AuthModeContext.Provider>
  );
}

/**
 * Internal wrapper hook that reads from DevAuthProvider context.
 * Only used when auth mode is dev.
 */
function useDevAuthWrapped(): AuthState {
  return useDevAuth();
}

/**
 * Internal wrapper hook that reads from the Supabase-backed useAuth.
 * Only used when auth mode is supabase.
 */
function useSupabaseAuthWrapped(): AuthState {
  // biome-ignore lint/correctness/useHookAtTopLevel: this is a top-level call; Biome flags it only because useAuth() reaches it through a build-time branch.
  const auth = useSupabaseAuth();
  return {
    user: auth.user,
    session: auth.session,
    loading: auth.loading,
    isAuthenticated: auth.isAuthenticated,
    role: auth.role,
    isCoach: auth.isCoach,
    isAthlete: auth.isAthlete,
    isAdmin: auth.isAdmin,
    login: auth.login,
    loginWithGoogle: auth.loginWithGoogle,
    signup: auth.signup,
    logout: auth.logout,
  };
}

/**
 * Unified useAuth hook.
 *
 * Delegates to DevAuthProvider in dev mode, or the existing Supabase-backed
 * useAuth in supabase mode.
 *
 * Since AUTH_MODE is a build-time constant (process.env), the branch is
 * deterministic and the hook call order is stable across renders.
 */
export function useAuth(): AuthState {
  // AUTH_MODE is a build-time constant -- this branch is dead-code-eliminated
  // by Next.js / webpack at build time, so only one hook is ever called.
  if (AUTH_MODE === "dev") {
    // biome-ignore lint/correctness/useHookAtTopLevel: AUTH_MODE is inlined at build time, so exactly one branch survives and hook order stays stable.
    return useDevAuthWrapped();
  }
  // biome-ignore lint/correctness/useHookAtTopLevel: see above -- the branch is resolved at build time, not per render.
  return useSupabaseAuthWrapped();
}
