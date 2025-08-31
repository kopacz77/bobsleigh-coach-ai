import { Stack, Title } from "@mantine/core";
import { AppShell } from "@/components/layout/AppShell";
import { Settings } from "@/components/settings/Settings";

export default function SettingsPage() {
  return (
    <AppShell>
      <Stack gap="xl">
        <Title>Settings</Title>

        <Settings />
      </Stack>
    </AppShell>
  );
}
