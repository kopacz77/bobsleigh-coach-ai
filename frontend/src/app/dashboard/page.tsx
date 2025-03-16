'use client';

import { AppShell } from '@/components/layout/AppShell';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TrainingSummary } from '@/components/dashboard/TrainingSummary';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { UpcomingWorkouts } from '@/components/dashboard/UpcomingWorkouts';
import { RecoveryStatus } from '@/components/dashboard/RecoveryStatus';
import { Grid, Stack } from '@mantine/core';

export default function DashboardPage() {
  return (
    <AppShell>
      <Stack spacing="lg">
        <DashboardHeader />
        
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <TrainingSummary />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <RecoveryStatus />
          </Grid.Col>
        </Grid>
        
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <PerformanceChart />
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <UpcomingWorkouts />
          </Grid.Col>
        </Grid>
      </Stack>
    </AppShell>
  );
}
