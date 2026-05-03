"use client";

import {
  rem,
  Select,
  Stack,
  Tabs,
  Text,
} from "@mantine/core";
import {
  IconBarbell,
  IconCalendarStats,
  IconChartLine,
  IconGitCompare,
  IconListCheck,
  IconRobot,
} from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ExerciseLibrary } from "./ExerciseLibrary";
import { PlannedVsActual } from "./PlannedVsActual";
import { TrainingAnalytics } from "./TrainingAnalytics";
import { TrainingRecommendations } from "./TrainingRecommendations";
import { WeeklyPlanView } from "./WeeklyPlanView";
import { WorkoutList } from "./WorkoutList";
import { useWorkouts } from "@/hooks/useTraining";

const VALID_TABS = ["weekly", "history", "exercises", "comparison", "recommendations", "analytics"];

/** Workout selector with PlannedVsActual comparison view. */
function ComparisonTab() {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const { data: workouts, isLoading } = useWorkouts({ limit: 20 });

  const workoutOptions = (workouts ?? []).map((w: Record<string, unknown>) => ({
    value: w.id as string,
    label: `${w.date as string} - ${w.name as string}`,
  }));

  return (
    <Stack gap="md">
      <Select
        label="Select a workout to compare"
        placeholder={isLoading ? "Loading workouts..." : "Pick a workout"}
        data={workoutOptions}
        value={selectedWorkoutId}
        onChange={setSelectedWorkoutId}
        searchable
        clearable
        disabled={isLoading}
      />

      {selectedWorkoutId ? (
        <PlannedVsActual workoutId={selectedWorkoutId} />
      ) : (
        !isLoading && (
          <Text c="dimmed" ta="center" fs="italic">
            Select a workout above to compare planned vs actual performance.
          </Text>
        )
      )}
    </Stack>
  );
}

export function TrainingTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string | null>("weekly");

  // On component mount, check for tab in URL query params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && VALID_TABS.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (value: string | null) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams);
    params.set("tab", value || "weekly");
    router.push(`${pathname}?${params.toString()}`);
  };

  const iconStyle = { width: rem(16), height: rem(16) };

  return (
    <Tabs value={activeTab} onChange={handleTabChange}>
      <Tabs.List>
        <Tabs.Tab value="weekly" leftSection={<IconCalendarStats style={iconStyle} />}>
          Weekly Plan
        </Tabs.Tab>
        <Tabs.Tab value="history" leftSection={<IconListCheck style={iconStyle} />}>
          Workout History
        </Tabs.Tab>
        <Tabs.Tab value="exercises" leftSection={<IconBarbell style={iconStyle} />}>
          Exercise Library
        </Tabs.Tab>
        <Tabs.Tab value="comparison" leftSection={<IconGitCompare style={iconStyle} />}>
          Planned vs Actual
        </Tabs.Tab>
        <Tabs.Tab value="recommendations" leftSection={<IconRobot style={iconStyle} />}>
          Recommendations
        </Tabs.Tab>
        <Tabs.Tab value="analytics" leftSection={<IconChartLine style={iconStyle} />}>
          Analytics
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="weekly" pt="xl">
        <WeeklyPlanView />
      </Tabs.Panel>

      <Tabs.Panel value="history" pt="xl">
        <WorkoutList />
      </Tabs.Panel>

      <Tabs.Panel value="exercises" pt="xl">
        <ExerciseLibrary />
      </Tabs.Panel>

      <Tabs.Panel value="comparison" pt="xl">
        <ComparisonTab />
      </Tabs.Panel>

      <Tabs.Panel value="recommendations" pt="xl">
        <TrainingRecommendations />
      </Tabs.Panel>

      <Tabs.Panel value="analytics" pt="xl">
        <TrainingAnalytics />
      </Tabs.Panel>
    </Tabs>
  );
}
