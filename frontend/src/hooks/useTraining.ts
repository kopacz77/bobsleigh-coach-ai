import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { trainingAPI } from "@/lib/api";

export function useWorkouts(athleteId: string, limit = 10) {
  return useQuery({
    queryKey: ["workouts", athleteId, limit],
    queryFn: () => trainingAPI.getWorkouts(athleteId, limit).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useWorkout(workoutId: string) {
  return useQuery({
    queryKey: ["workout", workoutId],
    queryFn: () => trainingAPI.getWorkout(workoutId).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!workoutId, // Only run if workoutId is provided
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workoutData: Record<string, unknown>) =>
      trainingAPI.createWorkout(workoutData).then((res) => res.data),
    onSuccess: () => {
      // Invalidate all workouts queries since we don't know the athlete_id ahead of time
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
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
