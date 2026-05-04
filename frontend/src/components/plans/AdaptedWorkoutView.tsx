"use client";

import {
  Alert,
  Badge,
  Card,
  Divider,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAdjustments,
  IconBed,
  IconCalendarOff,
  IconClock,
  IconFlame,
} from "@tabler/icons-react";

import { useTodaysWorkout } from "@/hooks/usePlans";

// ---- Types matching backend response shapes ----

interface Exercise {
  exercise_name?: string;
  name?: string;
  sets?: number;
  reps?: number;
  adapted_reps?: number;
  planned_weight_kg?: number;
  adapted_weight_kg?: number;
  distance_m?: number;
  duration_seconds?: number;
  rest_seconds?: number;
  notes?: string;
  measurement_type?: string;
}

interface Section {
  name: string;
  exercises: Exercise[];
}

interface Adaptation {
  applied: boolean;
  readiness_score: number | null;
  multiplier: number;
  message: string;
  coach_alert: boolean;
}

interface TodaysWorkout {
  day_name?: string;
  date?: string;
  title?: string;
  session_type?: string;
  is_rest_day?: boolean;
  estimated_duration_minutes?: number;
  target_rpe?: number;
  sections?: Section[];
  adaptation?: Adaptation;
}

// ---- Helpers ----

const SECTION_LABELS: Record<string, string> = {
  warm_up: "Warm-Up",
  main: "Main Work",
  accessory: "Accessory",
  cool_down: "Cool-Down",
};

const SESSION_TYPE_COLORS: Record<string, string> = {
  strength: "violet",
  power: "orange",
  speed: "green",
  endurance: "blue",
  recovery: "teal",
  technique: "cyan",
};

function adaptationColor(multiplier: number): string {
  if (multiplier >= 1.0) return "green";
  if (multiplier >= 0.9) return "yellow";
  if (multiplier >= 0.8) return "orange";
  return "red";
}

function formatRest(seconds: number): string {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
  }
  return `${seconds}s`;
}

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const name = exercise.exercise_name || exercise.name || "Exercise";
  const hasAdaptedWeight =
    exercise.adapted_weight_kg != null &&
    exercise.planned_weight_kg != null &&
    exercise.adapted_weight_kg !== exercise.planned_weight_kg;
  const hasAdaptedReps =
    exercise.adapted_reps != null &&
    exercise.reps != null &&
    exercise.adapted_reps !== exercise.reps;

  return (
    <Card withBorder p="sm" radius="sm">
      <Stack gap={4}>
        <Text fw={600} size="sm">
          {name}
        </Text>
        <Group gap="xs" wrap="wrap">
          {/* Sets x Reps (with adaptation) */}
          {exercise.sets != null && (
            <Text size="sm">
              {exercise.sets} sets
              {exercise.reps != null && (
                <>
                  {" x "}
                  {hasAdaptedReps ? (
                    <>
                      <Text component="span" td="line-through" c="dimmed" size="sm">
                        {exercise.reps}
                      </Text>{" "}
                      <Text component="span" fw={700} size="sm">
                        {exercise.adapted_reps}
                      </Text>
                    </>
                  ) : (
                    <>{exercise.reps}</>
                  )}
                  {" reps"}
                </>
              )}
            </Text>
          )}

          {/* Weight (with adaptation) */}
          {exercise.planned_weight_kg != null && (
            <Text size="sm">
              {"@ "}
              {hasAdaptedWeight ? (
                <>
                  <Text component="span" td="line-through" c="dimmed" size="sm">
                    {exercise.planned_weight_kg}kg
                  </Text>{" "}
                  <Text component="span" fw={700} size="sm">
                    {exercise.adapted_weight_kg}kg
                  </Text>
                </>
              ) : (
                <Text component="span" fw={600} size="sm">
                  {exercise.planned_weight_kg}kg
                </Text>
              )}
            </Text>
          )}

          {/* Distance / Duration for non-weight exercises */}
          {exercise.distance_m != null && (
            <Text size="sm">{exercise.distance_m}m</Text>
          )}
          {exercise.duration_seconds != null && (
            <Text size="sm">{exercise.duration_seconds}s</Text>
          )}
        </Group>

        {/* Rest period */}
        {exercise.rest_seconds != null && exercise.rest_seconds > 0 && (
          <Text size="xs" c="dimmed">
            Rest: {formatRest(exercise.rest_seconds)}
          </Text>
        )}

        {/* Notes */}
        {exercise.notes && (
          <Text size="xs" c="dimmed" fs="italic">
            {exercise.notes}
          </Text>
        )}
      </Stack>
    </Card>
  );
}

// ---- Main Component ----

/**
 * Athlete-facing view of today's adapted workout.
 *
 * Uses useTodaysWorkout() to fetch the day's plan with morning
 * adaptation applied. Shows loading, no-plan, rest-day, and active
 * workout states. Adapted values display alongside planned values
 * with strikethrough formatting.
 */
export function AdaptedWorkoutView() {
  const { data, isLoading, isError } = useTodaysWorkout();

  // Loading state
  if (isLoading) {
    return (
      <Card withBorder shadow="sm" radius="md" p="xl">
        <Stack align="center" gap="md">
          <Loader size="md" />
          <Text c="dimmed" size="sm">
            Loading today's workout...
          </Text>
        </Stack>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card withBorder shadow="sm" radius="md" p="lg">
        <Alert color="red" title="Failed to load workout">
          Could not load today's workout. Please try refreshing.
        </Alert>
      </Card>
    );
  }

  // No plan / 204 state
  if (!data) {
    return (
      <Card withBorder shadow="sm" radius="md" p="lg">
        <Stack align="center" gap="sm">
          <IconCalendarOff size={40} color="var(--mantine-color-gray-5)" />
          <Title order={4}>No Workout Planned</Title>
          <Text c="dimmed" ta="center" size="sm">
            No approved plan for this week. Check back after your coach reviews.
          </Text>
        </Stack>
      </Card>
    );
  }

  const workout = data as TodaysWorkout;

  // Rest day state
  if (workout.is_rest_day) {
    return (
      <Card withBorder shadow="sm" radius="md" p="lg">
        <Stack align="center" gap="sm">
          <IconBed size={40} color="var(--mantine-color-teal-5)" />
          <Title order={4}>Rest Day</Title>
          <Text c="dimmed" ta="center" size="sm">
            Recovery is training too. Stay hydrated, stretch, and get good sleep.
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            Light walking, foam rolling, or gentle mobility work are great options.
          </Text>
        </Stack>
      </Card>
    );
  }

  // Active workout
  const adaptation = workout.adaptation;
  const sections = workout.sections ?? [];

  return (
    <Card withBorder shadow="sm" radius="md" p="md">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" wrap="wrap">
          <Stack gap={2}>
            <Title order={3}>{workout.title || "Today's Workout"}</Title>
            <Text size="sm" c="dimmed">
              {workout.day_name}
              {workout.date && ` - ${workout.date}`}
            </Text>
          </Stack>
          <Group gap="xs">
            {workout.session_type && (
              <Badge
                variant="light"
                color={SESSION_TYPE_COLORS[workout.session_type] ?? "gray"}
                size="lg"
              >
                {workout.session_type}
              </Badge>
            )}
            {workout.estimated_duration_minutes != null &&
              workout.estimated_duration_minutes > 0 && (
                <Badge variant="outline" leftSection={<IconClock size={12} />}>
                  {workout.estimated_duration_minutes}min
                </Badge>
              )}
          </Group>
        </Group>

        {/* Target RPE */}
        {workout.target_rpe != null && workout.target_rpe > 0 && (
          <Badge
            variant="light"
            color="blue"
            size="lg"
            leftSection={<IconFlame size={14} />}
          >
            Target RPE: {workout.target_rpe}
          </Badge>
        )}

        {/* Adaptation message */}
        {adaptation?.applied && (
          <Alert
            icon={<IconAdjustments size={18} />}
            title={`Adaptation Applied (${Math.round(adaptation.multiplier * 100)}%)`}
            color={adaptationColor(adaptation.multiplier)}
            variant="light"
            radius="md"
          >
            <Text size="sm">{adaptation.message}</Text>
            {adaptation.readiness_score != null && (
              <Text size="xs" c="dimmed" mt={4}>
                Readiness score: {adaptation.readiness_score}/10
              </Text>
            )}
          </Alert>
        )}

        {adaptation && !adaptation.applied && adaptation.message && (
          <Alert
            icon={<IconAdjustments size={18} />}
            title="No Adaptation"
            color="gray"
            variant="light"
            radius="md"
          >
            <Text size="sm">{adaptation.message}</Text>
          </Alert>
        )}

        {/* Exercise Sections */}
        {sections.map((section) => (
          <Stack key={section.name} gap="xs">
            <Divider
              label={SECTION_LABELS[section.name] || section.name}
              labelPosition="left"
            />
            {section.exercises.map((exercise, idx) => (
              <ExerciseRow
                key={`${section.name}-${exercise.exercise_name || exercise.name || idx}`}
                exercise={exercise}
              />
            ))}
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
