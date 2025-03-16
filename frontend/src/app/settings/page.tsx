import { AppShell } from '@/components/layout/AppShell';
import { Settings } from '@/components/settings/Settings';
import { Stack, Title } from '@mantine/core';

export default function SettingsPage() {
  return (
    <AppShell>
      <Stack spacing="xl">
        <Title>Settings</Title>
        
        <Settings />
      </Stack>
    </AppShell>
  );
}
