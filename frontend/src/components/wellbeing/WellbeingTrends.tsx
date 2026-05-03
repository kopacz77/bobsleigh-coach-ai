"use client";

import { useState } from "react";
import {
  Card,
  Center,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "dayjs";
import { useWellbeingHistory } from "@/hooks/useWellbeing";

interface ChartDataPoint {
  date: string;
  sleepQuality: number;
  stressLevel: number;
  nutritionQuality: number;
  physicalReadiness: number;
  mentalClarity: number;
}

export function WellbeingTrends() {
  const [timeRange, setTimeRange] = useState("30");
  const theme = useMantineTheme();
  const { data, isLoading } = useWellbeingHistory(Number(timeRange));

  const chartData: ChartDataPoint[] | null =
    data && data.length > 0
      ? data.map(
          (d: {
            date: string;
            sleep_quality: number;
            stress_level: number;
            nutrition_quality: number;
            physical_readiness: number;
            mental_clarity: number;
          }) => ({
            date: dayjs(d.date).format("MMM D"),
            sleepQuality: d.sleep_quality,
            stressLevel: d.stress_level,
            nutritionQuality: d.nutrition_quality,
            physicalReadiness: d.physical_readiness,
            mentalClarity: d.mental_clarity,
          }),
        )
      : null;

  return (
    <Card withBorder p="md" radius="md">
      <Stack>
        <Group justify="space-between">
          <Title order={3}>Wellbeing Trends</Title>

          <Select
            value={timeRange}
            onChange={(value) => setTimeRange(value || "30")}
            data={[
              { label: "7 Days", value: "7" },
              { label: "30 Days", value: "30" },
              { label: "90 Days", value: "90" },
              { label: "180 Days", value: "180" },
              { label: "365 Days", value: "365" },
            ]}
            style={{ width: 120 }}
          />
        </Group>

        <Text c="dimmed" size="sm">
          Track your subjective wellbeing metrics over time to identify trends and patterns.
        </Text>

        {isLoading ? (
          <Center h={400}>
            <Loader />
          </Center>
        ) : chartData ? (
          <div style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  domain={[0, 10]}
                  label={{ value: "Score (0-10)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sleepQuality"
                  stroke={theme.colors.blue[6]}
                  name="Sleep Quality"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="stressLevel"
                  stroke={theme.colors.red[6]}
                  name="Stress Level"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="nutritionQuality"
                  stroke={theme.colors.green[6]}
                  name="Nutrition Quality"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="physicalReadiness"
                  stroke={theme.colors.orange[6]}
                  name="Physical Readiness"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="mentalClarity"
                  stroke={theme.colors.violet[6]}
                  name="Mental Clarity"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Center h={400}>
            <Text c="dimmed">No wellbeing data yet. Complete your first daily check-in!</Text>
          </Center>
        )}
      </Stack>
    </Card>
  );
}
