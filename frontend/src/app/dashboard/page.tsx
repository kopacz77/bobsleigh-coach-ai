"use client";

import { Center, Loader } from "@mantine/core";
import AthleteDashboard from "@/components/dashboard/AthleteDashboard";
import CoachDashboard from "@/components/dashboard/CoachDashboard";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/providers/AuthProvider";

export default function DashboardPage() {
  const { user, isCoach, loading } = useAuth();
  // user is typed as unknown in the unified AuthState. Narrow to the
  // minimal shape we read here.
  const userId = (user as { id?: string } | null | undefined)?.id ?? "";

  if (loading) {
    return (
      <AppShell>
        <Center style={{ height: "60vh" }}>
          <Loader size="xl" />
        </Center>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {isCoach ? (
        <CoachDashboard userId={userId} userProfile={null} />
      ) : (
        <AthleteDashboard userId={userId} />
      )}
    </AppShell>
  );
}
