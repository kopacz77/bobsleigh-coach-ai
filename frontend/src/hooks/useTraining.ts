import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trainingAPI } from "@/lib/api";

export function useWorkouts(athleteId: number, limit = 10) {
  return useQuery({
    queryKey: ["workouts", athleteId, limit],
    queryFn: () => trainingAPI.getWorkouts(athleteId, limit).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useWorkout(workoutId: number) {
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
    mutationFn: (workoutData: any) =>
      trainingAPI.createWorkout(workoutData).then((res) => res.data),
    onSuccess: (data) => {
      // Invalidate and refetch workouts for this athlete
      queryClient.invalidateQueries({ queryKey: ["workouts", data.athlete_id] });
    },
  });
}

export function useTrainingRecommendations(athleteId: number) {
  return useQuery({
    queryKey: ["recommendations", athleteId],
    queryFn: () => trainingAPI.getRecommendations(athleteId).then((res) => res.data),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
