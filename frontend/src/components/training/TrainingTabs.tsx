"use client";

import {
  Badge,
  Card,
  Group,
  rem,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
} from "@mantine/core";
import {
  IconBarbell,
  IconCalendarStats,
  IconChartLine,
  IconGitCompare,
  IconListCheck,
  IconRobot,
} from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ExerciseLibrary } from "./ExerciseLibrary";
import { TrainingAnalytics } from "./TrainingAnalytics";
import { TrainingRecommendations } from "./TrainingRecommendations";
import { WeeklyPlanView } from "./WeeklyPlanView";
import { WorkoutList } from "./WorkoutList";
import { useWorkouts } from "@/hooks/useTraining";

const VALID_TABS = ["weekly", "history", "exercises", "comparison", "recommendations", "analytics"];

/** Inline placeholder for Planned vs Actual comparison.
 *  Plan 03-04 will create the full PlannedVsActual component.
 */
function PlannedVsActualPlaceholder() {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const { data: workouts, isLoading } = useWorkouts({ limit: 20 });

  const workoutOptions = (workouts ?? []).map((w: Record<string, unknown>) => ({
    value: w.id as string,
    label: `${w.date as string} - ${w.name as string}`,
  }));

  const selectedWorkout = selectedWorkoutId
    ? (workouts ?? []).find((w: Record<string, unknown>) => w.id === selectedWorkoutId)
    : null;

  const exercises = (selectedWorkout?.workout_exercises ?? []) as Array<{
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
    exercises: { name: string } | null;
  }>;

  return (
    <Stack gap="md">
      <Select
        label="Select a workout to compare"
        placeholder={isLoading ? "Loading workouts..." : "Pick a workout"}
        data={workoutOptions}
        value={selectedWorkoutId}
        onChange={setSelectedWorkoutId}
        searchable
        clearable
        disabled={isLoading}
      />

      {selectedWorkout && exercises.length > 0 && (
        <Card withBorder p={0} radius="md">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Exercise</Table.Th>
                <Table.Th>Planned Sets</Table.Th>
                <Table.Th>Actual Sets</Table.Th>
                <Table.Th>Planned Reps</Table.Th>
                <Table.Th>Actual Reps</Table.Th>
                <Table.Th>Planned Weight</Table.Th>
                <Table.Th>Actual Weight</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {exercises
                .sort((a, b) => a.exercise_order - b.exercise_order)
                .map((we) => {
                  const matchSets =
                    we.planned_sets != null &&
                    we.actual_sets != null &&
                    we.actual_sets >= we.planned_sets;
                  const matchReps =
                    we.planned_reps != null &&
                    we.actual_reps != null &&
                    we.actual_reps >= we.planned_reps;
                  const matchWeight =
                    we.planned_weight != null &&
                    we.actual_weight != null &&
                    we.actual_weight >= we.planned_weight;

                  return (
                    <Table.Tr key={we.id}>
                      <Table.Td>
                        <Text fw={500} size="sm">
                          {we.exercises?.name ?? "Unknown"}
                        </Text>
                      </Table.Td>
                      <Table.Td>{we.planned_sets ?? "--"}</Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          {we.actual_sets ?? "--"}
                          {we.planned_sets != null && we.actual_sets != null && (
                            <Badge
                              size="xs"
                              variant="light"
                              color={matchSets ? "green" : "red"}
                            >
                              {matchSets ? "Met" : "Under"}
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>{we.planned_reps ?? "--"}</Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          {we.actual_reps ?? "--"}
                          {we.planned_reps != null && we.actual_reps != null && (
                            <Badge
                              size="xs"
                              variant="light"
                              color={matchReps ? "green" : "red"}
                            >
                              {matchReps ? "Met" : "Under"}
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>{we.planned_weight != null ? `${we.planned_weight}kg` : "--"}</Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          {we.actual_weight != null ? `${we.actual_weight}kg` : "--"}
                          {we.planned_weight != null && we.actual_weight != null && (
                            <Badge
                              size="xs"
                              variant="light"
                              color={matchWeight ? "green" : "red"}
                            >
                              {matchWeight ? "Met" : "Under"}
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {selectedWorkout && exercises.length === 0 && (
        <Text c="dimmed" ta="center" fs="italic">
          No exercises recorded for this workout.
        </Text>
      )}

      {!selectedWorkout && !isLoading && (
        <Text c="dimmed" ta="center" fs="italic">
          Select a workout above to compare planned vs actual performance.
        </Text>
      )}
    </Stack>
  );
}

export function TrainingTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string | null>("weekly");

  // On component mount, check for tab in URL query params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && VALID_TABS.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (value: string | null) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams);
    params.set("tab", value || "weekly");
    router.push(`${pathname}?${params.toString()}`);
  };

  const iconStyle = { width: rem(16), height: rem(16) };

  return (
    <Tabs value={activeTab} onChange={handleTabChange}>
      <Tabs.List>
        <Tabs.Tab value="weekly" leftSection={<IconCalendarStats style={iconStyle} />}>
          Weekly Plan
        </Tabs.Tab>
        <Tabs.Tab value="history" leftSection={<IconListCheck style={iconStyle} />}>
          Workout History
        </Tabs.Tab>
        <Tabs.Tab value="exercises" leftSection={<IconBarbell style={iconStyle} />}>
          Exercise Library
        </Tabs.Tab>
        <Tabs.Tab value="comparison" leftSection={<IconGitCompare style={iconStyle} />}>
          Planned vs Actual
        </Tabs.Tab>
        <Tabs.Tab value="recommendations" leftSection={<IconRobot style={iconStyle} />}>
          Recommendations
        </Tabs.Tab>
        <Tabs.Tab value="analytics" leftSection={<IconChartLine style={iconStyle} />}>
          Analytics
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="weekly" pt="xl">
        <WeeklyPlanView />
      </Tabs.Panel>

      <Tabs.Panel value="history" pt="xl">
        <WorkoutList />
      </Tabs.Panel>

      <Tabs.Panel value="exercises" pt="xl">
        <ExerciseLibrary />
      </Tabs.Panel>

      <Tabs.Panel value="comparison" pt="xl">
        <PlannedVsActualPlaceholder />
      </Tabs.Panel>

      <Tabs.Panel value="recommendations" pt="xl">
        <TrainingRecommendations />
      </Tabs.Panel>

      <Tabs.Panel value="analytics" pt="xl">
        <TrainingAnalytics />
      </Tabs.Panel>
    </Tabs>
  );
}
