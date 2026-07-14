"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Progress,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconBarbell, IconCheck, IconPlayerStop } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useCreateWorkout } from "@/hooks/useTraining";
import { useWakeLock } from "@/hooks/useWakeLock";
import { RestTimer } from "./RestTimer";
import { type SetData, SetLogger } from "./SetLogger";

/**
 * Heuristic to decide whether a workout submission failure is a network
 * error (which should fall back to the offline queue) vs a real API error
 * like 4xx/5xx (which the user should see and not silently queue).
 */
function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (!err || typeof err !== "object") return false;
  // Axios error shape: { response, request, message, code }
  const e = err as {
    response?: unknown;
    request?: unknown;
    message?: string;
    code?: string;
  };
  // If the server responded (any status), it's not a network error.
  if (e.response) return false;
  if (e.code === "ERR_NETWORK" || e.code === "ECONNABORTED") return true;
  const msg = (e.message ?? "").toLowerCase();
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
    return true;
  }
  // A request was made but no response received (DNS/offline)
  if (e.request && !e.response) return true;
  return false;
}

interface PlannedExercise {
  exercise_id?: string;
  exercise_name: string;
  planned_sets: number;
  planned_reps: number;
  planned_weight_kg: number | null;
}

interface WorkoutPlan {
  id?: string;
  workout_name?: string;
  training_phase?: string;
  exercises: PlannedExercise[];
}

interface ActiveWorkoutProps {
  plan: WorkoutPlan | null;
}

interface ExerciseLog {
  sets: SetData[];
  rpe: number | null;
}

export function ActiveWorkout({ plan }: ActiveWorkoutProps) {
  const router = useRouter();
  const wakeLock = useWakeLock();
  const createWorkout = useCreateWorkout();
  const { queueWorkout } = useOfflineSync();

  const [exerciseLogs, setExerciseLogs] = useState<Map<number, ExerciseLog>>(() => new Map());
  const [autoStartRest, setAutoStartRest] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Acquire wake lock on mount
  const wakeLockAcquired = useRef(false);
  if (!wakeLockAcquired.current && wakeLock.isSupported) {
    wakeLockAcquired.current = true;
    wakeLock.request();
  }

  const exercises = plan?.exercises ?? [];

  const handleSetsChange = useCallback(
    (exerciseIndex: number, sets: SetData[], rpe: number | null) => {
      setExerciseLogs((prev) => {
        const next = new Map(prev);
        next.set(exerciseIndex, { sets, rpe });
        return next;
      });
    },
    []
  );

  const handleStartRest = useCallback(() => {
    setAutoStartRest(120); // Default 2 min rest
  }, []);

  const handleAutoStartHandled = useCallback(() => {
    setAutoStartRest(null);
  }, []);

  // Calculate progress
  const completedExercises = exercises.filter((_, i) => {
    const log = exerciseLogs.get(i);
    if (!log) return false;
    return log.sets.every((s) => s.completed);
  }).length;

  const progressPercent = exercises.length > 0 ? (completedExercises / exercises.length) * 100 : 0;

  const handleCompleteWorkout = async () => {
    setSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      // Map logged data to WorkoutCreate schema
      const exerciseData = exercises
        .map((ex, i) => {
          const log = exerciseLogs.get(i);
          if (!log || log.sets.length === 0) return null;

          const completedSets = log.sets.filter((s) => s.completed);
          if (completedSets.length === 0) return null;

          const lastSet = completedSets[completedSets.length - 1];

          return {
            exercise_id: ex.exercise_id ?? undefined,
            exercise_name: ex.exercise_name,
            sets: completedSets.length,
            reps: lastSet.reps ?? ex.planned_reps,
            weight_kg: lastSet.weight_kg ?? ex.planned_weight_kg ?? 0,
            rpe: log.rpe ?? undefined,
          };
        })
        .filter(Boolean);

      const workoutPayload = {
        date: today,
        workout_type: "strength_training",
        notes: plan?.workout_name
          ? `Active workout: ${plan.workout_name}`
          : "Active workout session",
        exercises: exerciseData,
      };

      try {
        await createWorkout.mutateAsync(workoutPayload);

        // Release wake lock
        await wakeLock.release();

        notifications.show({
          title: "Workout Complete",
          message: `Logged ${exerciseData.length} exercises with ${exerciseData.reduce((acc, ex) => acc + (ex?.sets ?? 0), 0)} total sets`,
          color: "green",
          icon: <IconCheck size={16} />,
        });

        router.push("/dashboard");
      } catch (err) {
        // Network errors (no server response) -> queue offline and pretend success.
        // Real API errors (4xx/5xx) bubble up so the user can correct and retry.
        if (isNetworkError(err)) {
          try {
            await queueWorkout(workoutPayload as unknown as Parameters<typeof queueWorkout>[0]);
            await wakeLock.release();

            notifications.show({
              title: "Workout Saved Offline",
              message:
                "No connection -- your workout is queued and will sync automatically when you're back online.",
              color: "blue",
              icon: <IconCheck size={16} />,
            });

            router.push("/dashboard");
            return;
          } catch (queueErr) {
            // IndexedDB failure -- surface this to the user; data would be lost otherwise.
            notifications.show({
              title: "Could Not Save Workout",
              message:
                "Network is offline and local storage is unavailable. Please reconnect and try again.",
              color: "red",
              icon: <IconAlertCircle size={16} />,
            });
            console.error("Offline queue failed:", queueErr);
            return;
          }
        }
        // Re-throw non-network errors to the outer catch.
        throw err;
      }
    } catch {
      notifications.show({
        title: "Error Saving Workout",
        message: "Failed to save workout. Please try again.",
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    await wakeLock.release();
    router.push("/dashboard");
  };

  if (!plan || exercises.length === 0) {
    return (
      <Stack gap="lg" p={{ base: "sm", md: "lg" }}>
        <OfflineIndicator />
        <Card withBorder radius="lg" p="xl">
          <Stack align="center" gap="md">
            <IconBarbell size={48} color="var(--mantine-color-dimmed)" />
            <Title order={3} ta="center">
              No Workout Planned
            </Title>
            <Text c="dimmed" ta="center">
              There is no workout plan for today. You can log a freeform workout from the Training
              page.
            </Text>
            <Button
              size="lg"
              onClick={() => router.push("/training")}
              styles={{ root: { minHeight: 48 } }}
            >
              Go to Training
            </Button>
          </Stack>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack gap="md" p={{ base: "xs", md: "lg" }}>
      <OfflineIndicator />
      {/* Workout header */}
      <Card withBorder radius="lg" p={{ base: "sm", md: "lg" }}>
        <Group justify="space-between" wrap="nowrap">
          <Stack gap={4}>
            <Title order={2} fz={{ base: "lg", md: "xl" }}>
              {plan.workout_name ?? "Today's Workout"}
            </Title>
            {plan.training_phase && (
              <Badge color="steelBlue" variant="light" size="md">
                {plan.training_phase}
              </Badge>
            )}
          </Stack>
          <Stack align="flex-end" gap={4}>
            <Text fw={600} fz={{ base: "md", md: "lg" }}>
              {completedExercises}/{exercises.length}
            </Text>
            <Text size="sm" c="dimmed">
              exercises
            </Text>
          </Stack>
        </Group>

        <Progress
          value={progressPercent}
          color={progressPercent === 100 ? "green" : "steelBlue"}
          size="md"
          radius="xl"
          mt="sm"
        />

        {!wakeLock.isSupported && (
          <Alert color="yellow" variant="light" mt="sm" fz="sm">
            Screen wake lock not supported in this browser. Your screen may dim during rest periods.
          </Alert>
        )}
      </Card>

      {/* Rest Timer */}
      <RestTimer autoStartSeconds={autoStartRest} onAutoStartHandled={handleAutoStartHandled} />

      {/* Exercise list */}
      {exercises.map((exercise, index) => (
        <SetLogger
          key={`${exercise.exercise_name}-${index}`}
          exercise={exercise}
          exerciseIndex={index}
          onStartRest={handleStartRest}
          onSetsChange={handleSetsChange}
        />
      ))}

      {/* Action buttons */}
      <Group grow mt="md" mb="xl" style={{ position: "sticky", bottom: 0, zIndex: 50 }}>
        <Button
          variant="outline"
          color="red"
          size="lg"
          leftSection={<IconPlayerStop size={20} />}
          onClick={handleCancel}
          styles={{ root: { minHeight: 52 } }}
        >
          Cancel
        </Button>
        <Button
          size="lg"
          color="green"
          leftSection={submitting ? <Loader size={20} color="white" /> : <IconCheck size={20} />}
          onClick={handleCompleteWorkout}
          disabled={submitting || completedExercises === 0}
          styles={{ root: { minHeight: 52 } }}
        >
          {submitting ? "Saving..." : "Complete Workout"}
        </Button>
      </Group>
    </Stack>
  );
}
