"use client";

import { Card, Group, Skeleton, Stack, Text, Title, useMantineTheme } from "@mantine/core";
import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTrainingLoad } from "@/hooks/usePerformance";

interface PerformanceChartProps {
  athleteId: string;
  days?: number;
}

interface ChartDataPoint {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
  dailyLoad: number;
}

export function PerformanceChart({ athleteId, days = 42 }: PerformanceChartProps) {
  const theme = useMantineTheme();
  const { data, isLoading } = useTrainingLoad(athleteId, days);

  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!data?.daily_load?.length) return [];
    return data.daily_load.map(
      (item: { date: string; load: number; ctl: number; atl: number; tsb: number }) => ({
        date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
          new Date(item.date),
        ),
        dailyLoad: Math.round(item.load),
        ctl: Math.round(item.ctl * 10) / 10,
        atl: Math.round(item.atl * 10) / 10,
        tsb: Math.round(item.tsb * 10) / 10,
      }),
    );
  }, [data]);

  return (
    <Card withBorder p="md" radius="md">
      <Stack>
        <Group justify="space-between">
          <Title order={3}>Performance Management Chart</Title>
        </Group>

        <Text size="sm" c="dimmed">
          This chart shows your training load balance over time. The CTL line shows your fitness,
          ATL shows fatigue, and TSB shows your form (the balance between fitness and fatigue).
        </Text>

        <div style={{ height: 400 }}>
          {isLoading ? (
            <Skeleton height={400} radius="md" />
          ) : chartData.length === 0 ? (
            <Stack ta="center" justify="center" h="100%" gap="xs">
              <Text size="lg" fw={500} c="dimmed">
                No training data yet
              </Text>
              <Text size="sm" c="dimmed">
                Complete workouts with RPE to see your PMC chart.
              </Text>
            </Stack>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  yAxisId="left"
                  label={{ value: "Training Load", angle: -90, position: "insideLeft" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{ value: "TSB (Form)", angle: 90, position: "insideRight" }}
                />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="dailyLoad"
                  fill={theme.colors.gray[3]}
                  name="Daily Load"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ctl"
                  stroke={theme.colors.blue[6]}
                  name="CTL (Fitness)"
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="atl"
                  stroke={theme.colors.red[6]}
                  name="ATL (Fatigue)"
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="tsb"
                  stroke={theme.colors.green[6]}
                  name="TSB (Form)"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </Stack>
    </Card>
  );
}
