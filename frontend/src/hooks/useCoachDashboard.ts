import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { coachAPI } from "@/lib/api";

export function useCoachRoster() {
  return useQuery({
    queryKey: ["coach", "roster"],
    queryFn: () => coachAPI.getRoster().then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCoachPMCSummary() {
  return useQuery({
    queryKey: ["coach", "pmc-summary"],
    queryFn: () => coachAPI.getPMCSummary().then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCoachAlerts() {
  return useQuery({
    queryKey: ["coach", "alerts"],
    queryFn: () => coachAPI.getAlerts().then((res) => res.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddAthlete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      athleteId,
      relationshipType,
    }: {
      athleteId: string;
      relationshipType?: string;
    }) => coachAPI.addAthlete(athleteId, relationshipType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "roster"] });
    },
  });
}

export function useRemoveAthlete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (athleteId: string) => coachAPI.removeAthlete(athleteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "roster"] });
    },
  });
}
