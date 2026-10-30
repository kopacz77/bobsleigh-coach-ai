import { Stack, Title } from "@mantine/core";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileCard } from "@/components/profile/ProfileCard";

export default function ProfilePage() {
  return (
    <AppShell>
      <Stack gap="lg" px={{ base: "xs", md: "lg" }}>
        <Title fz={{ base: "lg", md: "xl" }}>Profile</Title>

        <ProfileCard />
      </Stack>
    </AppShell>
  );
}
