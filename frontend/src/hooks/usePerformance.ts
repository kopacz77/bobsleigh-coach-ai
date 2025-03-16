import { useQuery } from '@tanstack/react-query';
import { performanceAPI } from '@/lib/api';

export function usePerformanceMetrics(athleteId: number) {
  return useQuery({
    queryKey: ['performance', 'metrics', athleteId],
    queryFn: () => performanceAPI.getMetrics(athleteId).then((res) => res.data),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function usePerformanceTrends(athleteId: number, metric: string, days: number = 90) {
  return useQuery({
    queryKey: ['performance', 'trends', athleteId, metric, days],
    queryFn: () => performanceAPI.getTrends(athleteId, metric, days).then((res) => res.data),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useTrainingLoad(athleteId: number, days: number = 90) {
  return useQuery({
    queryKey: ['performance', 'load', athleteId, days],
    queryFn: () => performanceAPI.getTrainingLoad(athleteId, days).then((res) => res.data),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function usePeerComparison(athleteId: number) {
  return useQuery({
    queryKey: ['performance', 'comparison', athleteId],
    queryFn: () => performanceAPI.getComparison(athleteId).then((res) => res.data),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}
