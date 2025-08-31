// Path: c:\users\a_kop\bobsleigh-coach-ai\frontend\src\app\wellbeing\page.tsx

'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Tabs, Title, Stack, Group, Button } from '@mantine/core';
import { IconChartLine, IconCalendarStats, IconClipboardHeart, IconNotebook, IconHeartbeat } from '@tabler/icons-react';
import WellbeingAssessment from '@/components/wellbeing/WellbeingAssessment';
import { WellbeingCalendar } from '@/components/wellbeing/WellbeingCalendar';
import { WellbeingTrends } from '@/components/wellbeing/WellbeingTrends';
import RecoveryHealth from '@/components/wellbeing/RecoveryHealth';
import Reflection from '@/components/wellbeing/Reflection';
import { useRouter } from 'next/navigation';

export default function WellbeingPage() {
  const [activeTab, setActiveTab] = useState<string | null>('assessment');
  const router = useRouter();

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
            <WellbeingAssessment userId="mock-user-id" />
          </Tabs.Panel>

          <Tabs.Panel value="calendar" pt="md">
            <WellbeingCalendar />
          </Tabs.Panel>

          <Tabs.Panel value="trends" pt="md">
            <WellbeingTrends />
          </Tabs.Panel>

          <Tabs.Panel value="recovery" pt="md">
            <RecoveryHealth userId="mock-user-id" />
          </Tabs.Panel>

          <Tabs.Panel value="reflections" pt="md">
            <Reflection userId="mock-user-id" />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </AppShell>
  );
}