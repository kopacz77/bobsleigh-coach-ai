'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Tabs, Title, Stack, Group, Button } from '@mantine/core';
import { IconChartLine, IconCalendarStats, IconClipboardHeart, IconNotebook, IconHeartbeat } from '@tabler/icons-react';
import {
  MoodTracking,
  PhysicalMetrics,
  RecoveryHealth,
  Reflection,
  WellbeingAssessment,
} from '@/components/wellbeing';
import { WellbeingCalendar } from '@/components/wellbeing/WellbeingCalendar';
import { WellbeingTrends } from '@/components/wellbeing/WellbeingTrends';
import { useRouter } from 'next/navigation';

export default function WellbeingPage() {
  const [activeTab, setActiveTab] = useState<string | null>('assessment');
  const router = useRouter();
  const currentUserId = "123e4567-e89b-12d3-a456-426614174000";

  return (
    <AppShell>
      <Stack gap="xl">
        <Group justify="space-between">
          <Title>Wellbeing Tracker</Title>
          <Button onClick={() => router.push('/wellbeing/history')}>
            View History
          </Button>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="assessment" leftSection={<IconClipboardHeart size={16} />}>
              Daily Assessment
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

          <Tabs.Panel value="assessment" pt="md">
            <WellbeingAssessment userId={currentUserId} />
          </Tabs.Panel>

          <Tabs.Panel value="calendar" pt="md">
            <WellbeingCalendar />
          </Tabs.Panel>

          <Tabs.Panel value="trends" pt="md">
            <WellbeingTrends />
          </Tabs.Panel>

          <Tabs.Panel value="recovery" pt="md">
            <RecoveryHealth userId={currentUserId} />
          </Tabs.Panel>

          <Tabs.Panel value="reflections" pt="md">
            <Reflection userId={currentUserId} />
          </Tabs.Panel>

          <Tabs.Panel value="mood" pt="md">
            <MoodTracking userId={currentUserId} />
          </Tabs.Panel>

          <Tabs.Panel value="metrics" pt="md">
            <PhysicalMetrics userId={currentUserId} />
          </Tabs.Panel>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </AppShell>
  );
}