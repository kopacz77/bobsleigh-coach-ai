import { AthleteStats } from '@/components/dashboard/AthleteStats';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { TrainingRecommendations } from '@/components/training/TrainingRecommendations';
import { AppShell } from '@/components/layout/AppShell';
import { Grid, Stack, Title } from '@mantine/core';

export default function DashboardPage() {
  return (
    <AppShell>
      <Stack gap="xl">
        <Title>Dashboard</Title>
        
        <AthleteStats />
        
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <PerformanceChart />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TrainingRecommendations />
          </Grid.Col>
        </Grid>
      </Stack>
    </AppShell>
  );
}
