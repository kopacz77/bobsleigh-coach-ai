"use client";

import { Center, Loader } from "@mantine/core";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { supabase, loading: providerLoading } = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!supabase) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      handleRedirect(!!session);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authed = !!session;
      setIsAuthenticated(authed);
      handleRedirect(authed);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, pathname]);

  function handleRedirect(authed: boolean) {
    const isAuthPage = pathname.startsWith("/auth/");

    if (!authed && !isAuthPage) {
      // Not logged in and not on an auth page -> redirect to login
      router.push("/auth/login");
    } else if (authed && isAuthPage) {
      // Logged in but on an auth page -> redirect to dashboard
      router.push("/dashboard");
    }
  }

  if (providerLoading || isLoading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="xl" />
      </Center>
    );
  }

  // Allow rendering auth pages for unauthenticated users
  const isAuthPage = pathname.startsWith("/auth/");
  if (!isAuthenticated && !isAuthPage) {
    // Still redirecting, show loader
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return <>{children}</>;
}
