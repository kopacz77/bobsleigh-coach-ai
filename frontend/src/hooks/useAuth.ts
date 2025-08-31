import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, signInWithGoogle, signOut, supabase } from "@/lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Set up Supabase auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Get initial user
    async function getInitialUser() {
      try {
        const user = await getCurrentUser();
        setUser(user);
      } catch (error) {
        console.error("Error getting current user:", error);
      } finally {
        setLoading(false);
      }
    }

    getInitialUser();

    // Clean up subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  const login = async () => {
    const { error } = await signInWithGoogle();
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await signOut();
    if (error) throw error;
    router.push("/auth/login");
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}
