import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { wellbeingAPI } from "@/lib/api";

export function useCheckInToday() {
  return useQuery({
    queryKey: ["wellbeing", "checkin", "today"],
    queryFn: () =>
      wellbeingAPI.getCheckInToday().then((res) => {
        // Backend returns 204 No Content when no check-in exists today
        if (res.status === 204) return null;
        return res.data;
      }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      sleep_quality: number;
      stress_level: number;
      nutrition_quality: number;
      physical_readiness: number;
      mental_clarity: number;
      notes?: string;
      flag_concern?: boolean;
    }) => wellbeingAPI.submitCheckIn(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wellbeing"] });
      notifications.show({
        title: "Check-in saved",
        message: "Your daily wellness check-in has been recorded",
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to save check-in. Please try again.",
        color: "red",
      });
    },
  });
}

export function useWellbeingHistory(days = 30) {
  return useQuery({
    queryKey: ["wellbeing", "history", days],
    queryFn: () => wellbeingAPI.getHistory(days).then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCoachReadiness() {
  return useQuery({
    queryKey: ["wellbeing", "coach", "readiness"],
    queryFn: () => wellbeingAPI.getCoachReadiness().then((res) => res.data),
    staleTime: 2 * 60 * 1000, // 2 min -- coaches want fresh data
  });
}
