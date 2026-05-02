"use client";

import { Card, Group, Stack, Text, Title, useMantineTheme } from "@mantine/core";
import { useEffect, useState } from "react";
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

interface PerformanceChartProps {
  athleteId?: number;
  days?: number;
}

interface ChartDataPoint {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
  dailyLoad: number;
}

export function PerformanceChart({ athleteId = 1, days = 14 }: PerformanceChartProps) {
  const theme = useMantineTheme();
  const [chartData, setChartData] = useState<ChartDataPoint[] | null>(null);

  useEffect(() => {
    // Generate dates for the x-axis
    const dates = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });

    // Sample data for PMC metrics
    const ctlValues = [
      78.2, 79.5, 80.0, 80.5, 81.2, 82.0, 82.3, 82.5, 83.0, 83.7, 84.5, 85.0, 85.7, 86.1,
    ];
    const atlValues = [
      70.5, 72.8, 75.5, 76.8, 80.5, 83.2, 85.7, 83.4, 85.8, 88.2, 90.4, 93.4, 95.2, 96.8,
    ];
    const tsbValues = [
      7.7, 6.7, 4.5, 3.7, 0.7, -1.2, -3.4, -0.9, -2.8, -4.5, -5.9, -8.4, -9.5, -10.7,
    ];
    const dailyLoadValues = [60, 70, 85, 55, 95, 85, 110, 40, 90, 100, 95, 120, 105, 90];

    const data: ChartDataPoint[] = dates.map((date, i) => ({
      date,
      ctl: ctlValues[i],
      atl: atlValues[i],
      tsb: tsbValues[i],
      dailyLoad: dailyLoadValues[i],
    }));

    setChartData(data);
  }, [athleteId, days]);

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
          {chartData ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" label={{ value: "Training Load", angle: -90, position: "insideLeft" }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: "TSB (Form)", angle: 90, position: "insideRight" }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="dailyLoad" fill={theme.colors.gray[3]} name="Daily Load" />
                <Line yAxisId="left" type="monotone" dataKey="ctl" stroke={theme.colors.blue[6]} name="CTL (Fitness)" dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="atl" stroke={theme.colors.red[6]} name="ATL (Fatigue)" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="tsb" stroke={theme.colors.green[6]} name="TSB (Form)" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <Text>Loading chart data...</Text>
          )}
        </div>
      </Stack>
    </Card>
  );
}
