import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { plansAPI } from "@/lib/api";

export function usePendingPlans() {
  return useQuery({
    queryKey: ["plans", "pending"],
    queryFn: () => plansAPI.getPending().then((res) => res.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePlan(planId: string) {
  return useQuery({
    queryKey: ["plans", planId],
    queryFn: () => plansAPI.getPlan(planId).then((res) => res.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!planId,
  });
}

export function useCurrentPlan() {
  return useQuery({
    queryKey: ["plans", "current"],
    queryFn: () =>
      plansAPI.getCurrent().then((res) => {
        // 204 No Content returns empty data
        if (res.status === 204 || !res.data) return null;
        return res.data;
      }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTodaysWorkout() {
  return useQuery({
    queryKey: ["plans", "today"],
    queryFn: () =>
      plansAPI.getToday().then((res) => {
        // 204 No Content returns empty data
        if (res.status === 204 || !res.data) return null;
        return res.data;
      }),
    staleTime: 30000,
  });
}

export function useApprovePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => plansAPI.approve(planId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", "pending"] });
    },
  });
}

export function useRejectPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, rejectionNotes }: { planId: string; rejectionNotes: string }) =>
      plansAPI.reject(planId, rejectionNotes).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", "pending"] });
    },
  });
}

export function useGenerateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weekStart: string) => plansAPI.generateBatch(weekStart).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", "pending"] });
    },
  });
}
