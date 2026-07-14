"use client";

import { Badge, Button, Card, Group, Loader, Stack, Text } from "@mantine/core";
import { IconBarbell, IconPlayerPlay } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { plansAPI } from "@/lib/api";

/**
 * Prominent "Start Workout" banner for the athlete dashboard.
 *
 * Shows today's workout summary if a plan exists, or a "no workout today"
 * state with an option to log a freeform workout. The button is XL-sized
 * and full width on mobile for one-tap access at the gym.
 */
export function StartWorkoutBanner() {
  const { data: todayPlan, isLoading } = useQuery({
    queryKey: ["plans", "today", "banner"],
    queryFn: async () => {
      try {
        const res = await plansAPI.getToday();
        return res.data;
      } catch (e: unknown) {
        if (
          e &&
          typeof e === "object" &&
          "response" in e &&
          (e as { response?: { status?: number } }).response?.status === 404
        ) {
          return null;
        }
        throw e;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <Card withBorder radius="lg" p="lg">
        <Group justify="center">
          <Loader size="sm" />
          <Text c="dimmed">Loading today's plan...</Text>
        </Group>
      </Card>
    );
  }

  const exerciseCount = todayPlan?.exercises?.length ?? todayPlan?.planned_exercises?.length ?? 0;
  const workoutName = todayPlan?.plan_name ?? todayPlan?.workout_name ?? null;
  const phase = todayPlan?.training_phase ?? todayPlan?.phase ?? null;

  if (!todayPlan) {
    return (
      <Card withBorder radius="lg" p={{ base: "md", md: "lg" }}>
        <Stack gap="sm" align="center">
          <Group gap="xs">
            <IconBarbell size={24} color="var(--mantine-color-dimmed)" />
            <Text fw={500} c="dimmed">
              No workout planned for today
            </Text>
          </Group>
          <Button
            component={Link}
            href="/workout"
            variant="light"
            size="lg"
            fullWidth
            styles={{ root: { minHeight: 48 } }}
          >
            Log Freeform Workout
          </Button>
        </Stack>
      </Card>
    );
  }

  return (
    <Card withBorder radius="lg" p={{ base: "md", md: "lg" }}>
      <Stack gap="sm">
        <Group justify="space-between">
          <Stack gap={2}>
            {workoutName && (
              <Text fw={600} fz={{ base: "md", md: "lg" }}>
                {workoutName}
              </Text>
            )}
            <Group gap="xs">
              {phase && (
                <Badge color="steelBlue" variant="light" size="sm">
                  {phase}
                </Badge>
              )}
              <Text size="sm" c="dimmed">
                {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}
              </Text>
            </Group>
          </Stack>
        </Group>

        <Button
          component={Link}
          href="/workout"
          size="xl"
          fullWidth
          leftSection={<IconPlayerPlay size={24} />}
          styles={{
            root: {
              minHeight: 56,
              fontSize: 18,
              fontWeight: 600,
            },
          }}
        >
          Start Workout
        </Button>
      </Stack>
    </Card>
  );
}
