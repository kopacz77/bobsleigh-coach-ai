import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { trainingAPI } from "@/lib/api";

export interface WorkoutFilters {
  workout_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function useWorkouts(filters: WorkoutFilters = {}) {
  return useQuery({
    queryKey: ["workouts", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== "") params.set(k, String(v));
      }
      return api.get(`/api/training/workouts?${params.toString()}`).then((res) => res.data);
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useWeeklyWorkouts(weekStart: string) {
  return useQuery({
    queryKey: ["workouts", "week", weekStart],
    queryFn: () =>
      api.get(`/api/training/workouts/week?week_start=${weekStart}`).then((res) => res.data),
    staleTime: 2 * 60 * 1000,
    enabled: !!weekStart,
  });
}

export function useWorkout(workoutId: string) {
  return useQuery({
    queryKey: ["workout", workoutId],
    queryFn: () => trainingAPI.getWorkout(workoutId).then((res) => res.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!workoutId,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workoutData: Record<string, unknown>) =>
      trainingAPI.createWorkout(workoutData).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutId, updates }: { workoutId: string; updates: Record<string, unknown> }) =>
      api.patch(`/api/training/workouts/${workoutId}`, updates).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useTrainingRecommendations(athleteId: string) {
  return useQuery({
    queryKey: ["recommendations", athleteId],
    queryFn: () => trainingAPI.getRecommendations(athleteId).then((res) => res.data),
    staleTime: 60 * 60 * 1000,
  });
}

export function useAthleteWorkoutsForCoach(
  athleteId: string,
  params?: { limit?: number; date_from?: string; date_to?: string },
) {
  return useQuery({
    queryKey: ["coach", "athlete-workouts", athleteId, params],
    queryFn: () => trainingAPI.getAthleteWorkoutsForCoach(athleteId, params).then((res) => res.data),
    staleTime: 2 * 60 * 1000,
    enabled: !!athleteId,
  });
}

export function useAthletesWorkoutStatus(days = 7) {
  return useQuery({
    queryKey: ["coach", "workout-status", days],
    queryFn: () => trainingAPI.getAthletesWorkoutStatus(days).then((res) => res.data),
    staleTime: 2 * 60 * 1000,
  });
}
