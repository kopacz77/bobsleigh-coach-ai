import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { athleteAPI } from '@/lib/api';

export function useAthleteProfile(athleteId: number) {
  return useQuery({
    queryKey: ['athlete', athleteId],
    queryFn: () => athleteAPI.getProfile(athleteId).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateAthleteProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ athleteId, data }: { athleteId: number; data: any }) => 
      athleteAPI.updateProfile(athleteId, data).then((res) => res.data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch athlete data
      queryClient.invalidateQueries({ queryKey: ['athlete', variables.athleteId] });
    },
  });
}
