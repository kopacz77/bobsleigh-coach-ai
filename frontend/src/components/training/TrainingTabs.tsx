"use client";

import { rem, Tabs } from "@mantine/core";
import { IconCalendarStats, IconChartLine, IconListCheck, IconRobot } from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TrainingAnalytics } from "./TrainingAnalytics";
import { TrainingRecommendations } from "./TrainingRecommendations";
import { WorkoutCalendar } from "./WorkoutCalendar";
import { WorkoutList } from "./WorkoutList";

export function TrainingTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string | null>("calendar");

  // On component mount, check for tab in URL query params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["calendar", "list", "recommendations", "analytics"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (value: string | null) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams);
    params.set("tab", value || "calendar");
    router.push(`${pathname}?${params.toString()}`);
  };

  const iconStyle = { width: rem(16), height: rem(16) };

  return (
    <Tabs value={activeTab} onChange={handleTabChange}>
      <Tabs.List>
        <Tabs.Tab value="calendar" leftSection={<IconCalendarStats style={iconStyle} />}>
          Calendar
        </Tabs.Tab>
        <Tabs.Tab value="list" leftSection={<IconListCheck style={iconStyle} />}>
          Workout List
        </Tabs.Tab>
        <Tabs.Tab value="recommendations" leftSection={<IconRobot style={iconStyle} />}>
          AI Recommendations
        </Tabs.Tab>
        <Tabs.Tab value="analytics" leftSection={<IconChartLine style={iconStyle} />}>
          Analytics
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="calendar" pt="xl">
        <WorkoutCalendar />
      </Tabs.Panel>

      <Tabs.Panel value="list" pt="xl">
        <WorkoutList />
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
