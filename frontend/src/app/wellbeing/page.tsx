"use client";

import { Button, Group, Stack, Tabs, Title } from "@mantine/core";
import {
  IconCalendarStats,
  IconChartLine,
  IconClipboardHeart,
  IconHeartbeat,
  IconNotebook,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DailyCheckIn } from "@/components/check-in";
import { AppShell } from "@/components/layout/AppShell";
import { RecoveryHealth, Reflection } from "@/components/wellbeing";
import { WellbeingCalendar } from "@/components/wellbeing/WellbeingCalendar";
import { WellbeingTrends } from "@/components/wellbeing/WellbeingTrends";

export default function WellbeingPage() {
  const [activeTab, setActiveTab] = useState<string | null>("checkin");
  const router = useRouter();

  return (
    <AppShell>
      <Stack gap="xl">
        <Group justify="space-between">
          <Title>Wellbeing Tracker</Title>
          <Button onClick={() => router.push("/wellbeing/history")}>View History</Button>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="checkin" leftSection={<IconClipboardHeart size={16} />}>
              Daily Check-In
            </Tabs.Tab>
            <Tabs.Tab value="calendar" leftSection={<IconCalendarStats size={16} />}>
              Calendar View
            </Tabs.Tab>
            <Tabs.Tab value="trends" leftSection={<IconChartLine size={16} />}>
              Trends
            </Tabs.Tab>
            <Tabs.Tab value="recovery" leftSection={<IconHeartbeat size={16} />}>
              Recovery
            </Tabs.Tab>
            <Tabs.Tab value="reflections" leftSection={<IconNotebook size={16} />}>
              Reflections
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="checkin" pt="md">
            <DailyCheckIn />
          </Tabs.Panel>

          <Tabs.Panel value="calendar" pt="md">
            <WellbeingCalendar />
          </Tabs.Panel>

          <Tabs.Panel value="trends" pt="md">
            <WellbeingTrends />
          </Tabs.Panel>

          <Tabs.Panel value="recovery" pt="md">
            <RecoveryHealth />
          </Tabs.Panel>

          <Tabs.Panel value="reflections" pt="md">
            <Reflection />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </AppShell>
  );
}
