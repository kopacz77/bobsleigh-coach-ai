import { AppShell } from '@/components/layout/AppShell';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { Stack, Title } from '@mantine/core';

export default function ProfilePage() {
  return (
    <AppShell>
      <Stack gap="xl">
        <Title>Profile</Title>
        
        <ProfileCard />
      </Stack>
    </AppShell>
  );
}
