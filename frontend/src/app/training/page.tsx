'use client';

import { AppShell } from '@/components/layout/AppShell';
import { TrainingHeader } from '@/components/training/TrainingHeader';
import { TrainingTabs } from '@/components/training/TrainingTabs';
import { Stack } from '@mantine/core';

export default function TrainingPage() {
  return (
    <AppShell>
      <Stack spacing="lg">
        <TrainingHeader />
        <TrainingTabs />
      </Stack>
    </AppShell>
  );
}
