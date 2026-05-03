"use client";

import {
  Alert,
  Badge,
  Card,
  Group,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconCheck, IconMinus } from "@tabler/icons-react";
import { useWorkout } from "@/hooks/useTraining";

interface PlannedVsActualProps {
  workoutId: string;
}

interface MetricRow {
  label: string;
  planned: number | null;
  actual: number | null;
  unit: string;
}

interface WorkoutExercise {
  id: string;
  exercise_order: number;
  planned_sets: number | null;
  actual_sets: number | null;
  planned_reps: number | null;
  actual_reps: number | null;
  planned_weight: number | null;
  actual_weight: number | null;
  planned_distance: number | null;
  actual_distance: number | null;
  planned_time_seconds: number | null;
  actual_time_seconds: number | null;
  exercises: { name: string; category?: string } | null;
}

function getDiffColor(planned: number | null, actual: number | null): string {
  if (actual == null) return "gray";
  if (planned == null) return "gray";
  return actual >= planned ? "green" : "red";
}

function getDiffLabel(planned: number | null, actual: number | null): string {
  if (actual == null) return "Not logged";
  if (planned == null) return "--";
  const diff = actual - planned;
  if (diff === 0) return "On target";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function buildMetricRows(we: WorkoutExercise): MetricRow[] {
  const rows: MetricRow[] = [];

  if (we.planned_sets != null) {
    rows.push({ label: "Sets", planned: we.planned_sets, actual: we.actual_sets, unit: "" });
  }
  if (we.planned_reps != null) {
    rows.push({ label: "Reps", planned: we.planned_reps, actual: we.actual_reps, unit: "" });
  }
  if (we.planned_weight != null) {
    rows.push({ label: "Weight", planned: we.planned_weight, actual: we.actual_weight, unit: "kg" });
  }
  if (we.planned_distance != null) {
    rows.push({
      label: "Distance",
      planned: we.planned_distance,
      actual: we.actual_distance,
      unit: "m",
    });
  }
  if (we.planned_time_seconds != null) {
    rows.push({
      label: "Time",
      planned: we.planned_time_seconds,
      actual: we.actual_time_seconds,
      unit: "s",
    });
  }

  return rows;
}

function formatValue(value: number | null, unit: string): string {
  if (value == null) return "--";
  return unit ? `${value}${unit}` : String(value);
}

export function PlannedVsActual({ workoutId }: PlannedVsActualProps) {
  const { data: workout, isLoading, error } = useWorkout(workoutId);

  if (isLoading) {
    return (
      <Stack gap="md">
        <Skeleton height={24} width={300} />
        <Skeleton height={200} />
        <Skeleton height={200} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert color="red" icon={<IconAlertCircle size={16} />} title="Error loading workout">
        Failed to load workout details. Please try again.
      </Alert>
    );
  }

  if (!workout) {
    return (
      <Text c="dimmed" ta="center" fs="italic">
        Workout not found.
      </Text>
    );
  }

  const exercises: WorkoutExercise[] = (workout.workout_exercises ?? []).sort(
    (a: WorkoutExercise, b: WorkoutExercise) => a.exercise_order - b.exercise_order,
  );

  const hasAnyPlannedValues = exercises.some((we) => {
    return (
      we.planned_sets != null ||
      we.planned_reps != null ||
      we.planned_weight != null ||
      we.planned_distance != null ||
      we.planned_time_seconds != null
    );
  });

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={4}>{workout.name || "Workout"}</Title>
          <Text c="dimmed" size="sm">
            {workout.date}
          </Text>
        </div>
        <Group gap="sm">
          {workout.is_completed && (
            <Badge color="green" leftSection={<IconCheck size={12} />}>
              Completed
            </Badge>
          )}
          {workout.rpe != null && (
            <Badge color="blue" variant="light">
              RPE {workout.rpe}
            </Badge>
          )}
        </Group>
      </Group>

      {!hasAnyPlannedValues && (
        <Text c="dimmed" ta="center" fs="italic">
          No prescribed values -- this was a self-directed workout.
        </Text>
      )}

      {exercises.map((we) => {
        const rows = buildMetricRows(we);

        if (rows.length === 0) return null;

        return (
          <Card key={we.id} withBorder radius="md" p="sm">
            <Text fw={600} size="sm" mb="xs">
              {we.exercises?.name ?? "Unknown Exercise"}
              {we.exercises?.category && (
                <Badge size="xs" variant="light" ml="xs">
                  {we.exercises.category}
                </Badge>
              )}
            </Text>

            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Metric</Table.Th>
                  <Table.Th>Planned</Table.Th>
                  <Table.Th>Actual</Table.Th>
                  <Table.Th>Diff</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row) => (
                  <Table.Tr key={row.label}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {row.label}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatValue(row.planned, row.unit)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatValue(row.actual, row.unit)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        variant="light"
                        color={getDiffColor(row.planned, row.actual)}
                        leftSection={
                          row.actual == null ? (
                            <IconMinus size={10} />
                          ) : row.actual >= (row.planned ?? 0) ? (
                            <IconCheck size={10} />
                          ) : null
                        }
                      >
                        {getDiffLabel(row.planned, row.actual)}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        );
      })}
    </Stack>
  );
}
