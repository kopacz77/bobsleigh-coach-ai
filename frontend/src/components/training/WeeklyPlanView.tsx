"use client";

import {
  Accordion,
  ActionIcon,
  Alert,
  Badge,
  Card,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCalendarEvent,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";
import { useWeeklyWorkouts } from "@/hooks/useTraining";

/** Get the Monday of the week containing the given date. */
function getMonday(d: dayjs.Dayjs): dayjs.Dayjs {
  const day = d.day(); // 0 = Sunday
  // If Sunday (0), go back 6 days; otherwise go back (day - 1) days
  return d.subtract(day === 0 ? 6 : day - 1, "day");
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TYPE_COLORS: Record<string, string> = {
  strength: "violet",
  power: "orange",
  speed: "green",
  endurance: "blue",
  recovery: "teal",
  technique: "cyan",
};

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
  exercises: { name: string } | null;
}

interface Workout {
  id: string;
  name: string;
  date: string;
  workout_type: string;
  duration_minutes: number | null;
  is_completed: boolean;
  rpe: number | null;
  notes: string | null;
  workout_exercises: WorkoutExercise[];
}

function formatExerciseLine(we: WorkoutExercise): string {
  const name = we.exercises?.name ?? "Exercise";
  const sets = we.actual_sets ?? we.planned_sets;
  const reps = we.actual_reps ?? we.planned_reps;
  const weight = we.actual_weight ?? we.planned_weight;
  const distance = we.actual_distance ?? we.planned_distance;
  const time = we.actual_time_seconds ?? we.planned_time_seconds;

  const parts: string[] = [];
  if (sets) parts.push(`${sets}x`);
  if (reps) parts.push(`${reps}`);
  if (weight) parts.push(`@ ${weight}kg`);
  if (distance) parts.push(`${distance}m`);
  if (time) parts.push(`${time}s`);

  const detail = parts.length > 0 ? parts.join(" ") : "";
  return detail ? `${detail} ${name}` : name;
}

export function WeeklyPlanView() {
  const [weekStart, setWeekStart] = useState(() => getMonday(dayjs()));

  const weekStartStr = weekStart.format("YYYY-MM-DD");
  const weekEnd = weekStart.add(6, "day");

  const { data: workouts, isLoading, isError, error } = useWeeklyWorkouts(weekStartStr);

  const prevWeek = () => setWeekStart((w) => w.subtract(7, "day"));
  const nextWeek = () => setWeekStart((w) => w.add(7, "day"));
  const goToday = () => setWeekStart(getMonday(dayjs()));

  // Group workouts by date string
  const workoutsByDate = new Map<string, Workout[]>();
  if (workouts) {
    for (const w of workouts as Workout[]) {
      const existing = workoutsByDate.get(w.date) ?? [];
      existing.push(w);
      workoutsByDate.set(w.date, existing);
    }
  }

  return (
    <Stack gap="md">
      {/* Week navigation header */}
      <Group justify="space-between">
        <ActionIcon variant="subtle" size="lg" onClick={prevWeek} aria-label="Previous week">
          <IconChevronLeft size={20} />
        </ActionIcon>

        <Group gap="xs">
          <IconCalendarEvent size={18} />
          <Title order={4}>
            {weekStart.format("MMM D")} &ndash; {weekEnd.format("MMM D, YYYY")}
          </Title>
        </Group>

        <ActionIcon variant="subtle" size="lg" onClick={nextWeek} aria-label="Next week">
          <IconChevronRight size={20} />
        </ActionIcon>
      </Group>

      <Group justify="center">
        <Badge variant="outline" size="sm" style={{ cursor: "pointer" }} onClick={goToday}>
          Today
        </Badge>
      </Group>

      {/* Error state */}
      {isError && (
        <Alert icon={<IconAlertCircle size={16} />} title="Failed to load workouts" color="red">
          {(error as Error)?.message ?? "An unexpected error occurred."}
        </Alert>
      )}

      {/* Day cards */}
      {isLoading ? (
        <Stack gap="sm">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={`skel-${i}`} height={72} radius="md" />
          ))}
        </Stack>
      ) : (
        <Accordion variant="separated" radius="md" chevronPosition="right">
          {DAYS.map((dayName, idx) => {
            const currentDate = weekStart.add(idx, "day");
            const dateStr = currentDate.format("YYYY-MM-DD");
            const dayWorkouts = workoutsByDate.get(dateStr) ?? [];
            const isToday = currentDate.isSame(dayjs(), "day");
            const hasWorkouts = dayWorkouts.length > 0;
            const allCompleted = hasWorkouts && dayWorkouts.every((w) => w.is_completed);

            let borderColor = "gray";
            if (hasWorkouts) {
              borderColor = allCompleted ? "green" : "blue";
            }

            return (
              <Accordion.Item
                key={dateStr}
                value={dateStr}
                style={{
                  borderLeft: `4px solid var(--mantine-color-${borderColor}-5)`,
                }}
              >
                <Accordion.Control disabled={!hasWorkouts}>
                  <Group justify="space-between" wrap="nowrap" style={{ minHeight: 44 }}>
                    <Stack gap={2}>
                      <Text fw={isToday ? 700 : 500} size="sm">
                        {dayName}, {currentDate.format("MMM D")}
                        {isToday && (
                          <Badge size="xs" variant="filled" color="blue" ml="xs">
                            Today
                          </Badge>
                        )}
                      </Text>
                      {hasWorkouts ? (
                        <Group gap="xs">
                          {dayWorkouts.map((w) => (
                            <Text key={w.id} size="sm" c="dimmed">
                              {w.name}
                            </Text>
                          ))}
                        </Group>
                      ) : (
                        <Text size="sm" c="dimmed" fs="italic">
                          Rest Day
                        </Text>
                      )}
                    </Stack>

                    <Group gap="xs" wrap="nowrap">
                      {dayWorkouts.map((w) => (
                        <Group key={w.id} gap={4} wrap="nowrap">
                          <Badge
                            variant="light"
                            color={TYPE_COLORS[w.workout_type] ?? "gray"}
                            size="sm"
                          >
                            {w.workout_type}
                          </Badge>
                          {w.duration_minutes && (
                            <Group gap={2} wrap="nowrap">
                              <IconClock size={12} />
                              <Text size="xs" c="dimmed">
                                {w.duration_minutes}m
                              </Text>
                            </Group>
                          )}
                          {w.is_completed && (
                            <Badge
                              variant="filled"
                              color="green"
                              size="xs"
                              leftSection={<IconCheck size={10} />}
                            >
                              Done
                            </Badge>
                          )}
                        </Group>
                      ))}
                    </Group>
                  </Group>
                </Accordion.Control>

                {hasWorkouts && (
                  <Accordion.Panel>
                    <Stack gap="sm">
                      {dayWorkouts.map((w) => (
                        <Card key={w.id} withBorder p="md" radius="sm">
                          <Stack gap="xs">
                            <Group justify="space-between">
                              <Text fw={600} size="sm">
                                {w.name}
                              </Text>
                              {w.rpe && (
                                <Badge variant="outline" size="xs">
                                  RPE {w.rpe}
                                </Badge>
                              )}
                            </Group>

                            {w.notes && (
                              <Text size="sm" c="dimmed">
                                {w.notes}
                              </Text>
                            )}

                            {w.workout_exercises && w.workout_exercises.length > 0 && (
                              <Stack gap={4}>
                                {w.workout_exercises
                                  .sort((a, b) => a.exercise_order - b.exercise_order)
                                  .map((we) => (
                                    <Text key={we.id} size="sm">
                                      {formatExerciseLine(we)}
                                    </Text>
                                  ))}
                              </Stack>
                            )}
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  </Accordion.Panel>
                )}
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}
    </Stack>
  );
}
