import { Grid, Stack, Title } from "@mantine/core";
import { AppShell } from "@/components/layout/AppShell";
import { TrainingRecommendations } from "@/components/training/TrainingRecommendations";
import { WorkoutForm } from "@/components/training/WorkoutForm";

export default function TrainingPage() {
  return (
    <AppShell>
      <Stack gap="xl">
        <Title>Training</Title>

        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <WorkoutForm />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <TrainingRecommendations />
          </Grid.Col>
        </Grid>
      </Stack>
    </AppShell>
  );
}
