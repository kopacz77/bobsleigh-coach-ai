"use client";

import { Button, Group, Modal, Stack, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TrainingTabs } from "@/components/training/TrainingTabs";
import { WorkoutForm } from "@/components/training/WorkoutForm";

export default function TrainingPage() {
  const [opened, { open, close }] = useDisclosure(false);
  const queryClient = useQueryClient();

  const handleWorkoutSaved = () => {
    close();
    queryClient.invalidateQueries({ queryKey: ["workouts"] });
  };

  return (
    <AppShell>
      <Stack gap="xl">
        <Group justify="space-between">
          <Title>Training</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Log Workout
          </Button>
        </Group>

        <Suspense>
          <TrainingTabs />
        </Suspense>

        <Modal opened={opened} onClose={close} title="Log Workout" size="lg" centered>
          <WorkoutForm onSuccess={handleWorkoutSaved} />
        </Modal>
      </Stack>
    </AppShell>
  );
}
