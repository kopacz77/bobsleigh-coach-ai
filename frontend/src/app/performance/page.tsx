import { AppShell } from '@/components/layout/AppShell';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { PerformanceMetrics } from '@/components/performance/PerformanceMetrics';
import { PerformanceTrends } from '@/components/performance/PerformanceTrends';
import { Grid, Stack, Title } from '@mantine/core';

export default function PerformancePage() {
  return (
    <AppShell>
      <Stack spacing="xl">
        <Title>Performance Analytics</Title>
        
        <PerformanceMetrics />
        
        <Grid>
          <Grid.Col span={12}>
            <PerformanceChart days={60} />
          </Grid.Col>
          
          <Grid.Col span={12}>
            <PerformanceTrends />
          </Grid.Col>
        </Grid>
      </Stack>
    </AppShell>
  );
}
