"use client";

import { Center, Loader } from "@mantine/core";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/supabase";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();

        if (!user && !pathname.startsWith("/auth/")) {
          // If no user and not on an auth page, redirect to login
          router.push("/auth/login");
        } else if (user && pathname.startsWith("/auth/")) {
          // If user is logged in and on an auth page, redirect to dashboard
          router.push("/dashboard");
        } else {
          // Otherwise, show the page
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return <>{children}</>;
}
