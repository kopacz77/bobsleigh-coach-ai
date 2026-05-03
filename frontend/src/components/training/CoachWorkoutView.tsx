"use client";

import {
  Accordion,
  Badge,
  Group,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconCheck,
  IconClock,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { useAthletesWorkoutStatus } from "@/hooks/useTraining";

interface RecentWorkout {
  id: string;
  name: string;
  date: string;
  is_completed: boolean;
}

interface AthleteStatus {
  athlete_id: string;
  athlete_name: string;
  total_workouts: number;
  completed: number;
  recent_workouts: RecentWorkout[];
}

function getComplianceColor(total: number, completed: number): string {
  if (total === 0) return "gray";
  if (completed === total) return "green";
  if (completed > 0) return "yellow";
  return "red";
}

export function CoachWorkoutView() {
  const { data: statuses, isLoading, error } = useAthletesWorkoutStatus(7);

  if (isLoading) {
    return (
      <Stack gap="sm">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={56} radius="md" />
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Text c="red" size="sm">
        Failed to load workout status. Please try again.
      </Text>
    );
  }

  const athleteStatuses: AthleteStatus[] = statuses ?? [];

  if (athleteStatuses.length === 0) {
    return (
      <Text c="dimmed" ta="center" fs="italic" py="md">
        No athletes found.
      </Text>
    );
  }

  const hasAnyWorkouts = athleteStatuses.some((s) => s.total_workouts > 0);

  if (!hasAnyWorkouts) {
    return (
      <Text c="dimmed" ta="center" fs="italic" py="md">
        No workouts in the last 7 days.
      </Text>
    );
  }

  return (
    <Accordion variant="separated" radius="md">
      {athleteStatuses.map((status) => (
        <Accordion.Item key={status.athlete_id} value={status.athlete_id}>
          <Accordion.Control>
            <Group justify="space-between" wrap="nowrap" style={{ flex: 1 }}>
              <Group gap="sm">
                <ThemeIcon size="sm" variant="light" color="blue" radius="xl">
                  <IconUser size={12} />
                </ThemeIcon>
                <Text fw={500} size="sm">
                  {status.athlete_name}
                </Text>
              </Group>
              <Badge
                color={getComplianceColor(status.total_workouts, status.completed)}
                variant="light"
                size="sm"
              >
                {status.completed}/{status.total_workouts} completed
              </Badge>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            {status.recent_workouts.length === 0 ? (
              <Text c="dimmed" size="sm" fs="italic">
                No workouts scheduled in the last 7 days.
              </Text>
            ) : (
              <Stack gap="xs">
                {status.recent_workouts.map((workout) => (
                  <Group key={workout.id} justify="space-between" py={4}>
                    <Group gap="sm">
                      {workout.is_completed ? (
                        <ThemeIcon size="xs" color="green" variant="light" radius="xl">
                          <IconCheck size={10} />
                        </ThemeIcon>
                      ) : (
                        <ThemeIcon size="xs" color="gray" variant="light" radius="xl">
                          <IconClock size={10} />
                        </ThemeIcon>
                      )}
                      <Text size="sm">{workout.name || "Unnamed workout"}</Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {workout.date}
                    </Text>
                  </Group>
                ))}
              </Stack>
            )}
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
