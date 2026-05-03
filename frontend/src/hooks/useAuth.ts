import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";

export function useAuth() {
  const { supabase, loading: providerLoading } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;

    // Get initial session from local storage (synchronous restore)
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { data: null, error: new Error("Supabase not initialized") };
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    },
    [supabase],
  );

  const loginWithGoogle = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: "google" });
  }, [supabase]);

  const signup = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { data: null, error: new Error("Supabase not initialized") };
      const { data, error } = await supabase.auth.signUp({ email, password });
      return { data, error };
    },
    [supabase],
  );

  const logout = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/auth/login");
  }, [supabase, router]);

  // While provider is loading, keep loading true
  if (providerLoading) {
    return {
      user: null,
      session: null,
      loading: true,
      isAuthenticated: false,
      login,
      loginWithGoogle,
      signup,
      logout,
    };
  }

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    signup,
    logout,
  };
}
