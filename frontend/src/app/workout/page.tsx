"use client";

import { Center, Loader, Stack } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { ActiveWorkout } from "@/components/workout/ActiveWorkout";
import { plansAPI } from "@/lib/api";

/**
 * /workout page -- Active workout flow for athletes at the gym.
 *
 * Loads today's adapted workout plan from the API and renders the
 * ActiveWorkout component. If no plan exists for today, shows a
 * "no workout planned" state with navigation to the training page.
 */
export default function WorkoutPage() {
  const {
    data: todayPlan,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["plans", "today"],
    queryFn: async () => {
      try {
        const res = await plansAPI.getToday();
        return res.data;
      } catch (e: unknown) {
        // 404 means no plan for today -- not an error
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
      <AppShell>
        <Center style={{ height: "60vh" }}>
          <Stack align="center" gap="md">
            <Loader size="xl" />
          </Stack>
        </Center>
      </AppShell>
    );
  }

  // Transform plan data to the format ActiveWorkout expects
  const workoutPlan = todayPlan
    ? {
        id: todayPlan.id,
        workout_name: todayPlan.plan_name ?? todayPlan.workout_name ?? "Today's Workout",
        training_phase: todayPlan.training_phase ?? todayPlan.phase,
        exercises: (todayPlan.exercises ?? todayPlan.planned_exercises ?? []).map(
          (ex: Record<string, unknown>) => ({
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name ?? ex.name ?? "Unknown Exercise",
            planned_sets: ex.planned_sets ?? ex.sets ?? 3,
            planned_reps: ex.planned_reps ?? ex.reps ?? 10,
            planned_weight_kg: ex.planned_weight_kg ?? ex.weight_kg ?? null,
          })
        ),
      }
    : null;

  return (
    <AppShell>
      <ActiveWorkout plan={workoutPlan} />
    </AppShell>
  );
}
