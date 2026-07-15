import { useQuery } from "@tanstack/react-query";
import { performanceAPI } from "@/lib/api";

export function usePerformanceMetrics(athleteId: string) {
  return useQuery({
    queryKey: ["performance", "metrics", athleteId],
    queryFn: () => performanceAPI.getMetrics(athleteId).then((res) => res.data),
    enabled: !!athleteId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function usePerformanceTrends(athleteId: string, metric: string, days = 90) {
  return useQuery({
    queryKey: ["performance", "trends", athleteId, metric, days],
    queryFn: () => performanceAPI.getTrends(athleteId, metric, days).then((res) => res.data),
    enabled: !!athleteId && !!metric,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useTrainingLoad(athleteId: string, days = 90) {
  return useQuery({
    queryKey: ["performance", "load", athleteId, days],
    queryFn: () => performanceAPI.getTrainingLoad(athleteId, days).then((res) => res.data),
    enabled: !!athleteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePeerComparison(athleteId: string) {
  return useQuery({
    queryKey: ["performance", "comparison", athleteId],
    queryFn: () => performanceAPI.getComparison(athleteId).then((res) => res.data),
    enabled: !!athleteId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}
