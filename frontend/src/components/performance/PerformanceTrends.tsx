"use client";

import { Card, Group, SegmentedControl, Stack, Text, Title, useMantineTheme } from "@mantine/core";
import { useState } from "react";
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

interface MetricData {
  dates: string[];
  values: number[];
  label: string;
  color: string;
}

interface MetricDataMap {
  [key: string]: MetricData;
}

export function PerformanceTrends() {
  const theme = useMantineTheme();
  const [metricType, setMetricType] = useState("strength");
  const [specificMetric, setSpecificMetric] = useState("squat_1rm");

  // Placeholder data for different metrics
  const strengthData: MetricDataMap = {
    squat_1rm: {
      dates: ["Jan 15", "Jan 29", "Feb 12", "Feb 26", "Mar 12"],
      values: [140, 142.5, 145, 145, 150],
      label: "Squat 1RM (kg)",
      color: theme.colors.blue[6],
    },
    bench_1rm: {
      dates: ["Jan 15", "Jan 29", "Feb 12", "Feb 26", "Mar 12"],
      values: [90, 92.5, 95, 97.5, 100],
      label: "Bench Press 1RM (kg)",
      color: theme.colors.red[6],
    },
    deadlift_1rm: {
      dates: ["Jan 15", "Jan 29", "Feb 12", "Feb 26", "Mar 12"],
      values: [160, 165, 170, 175, 180],
      label: "Deadlift 1RM (kg)",
      color: theme.colors.green[6],
    },
  };

  const speedData: MetricDataMap = {
    "30m_best": {
      dates: ["Jan 15", "Jan 29", "Feb 12", "Feb 26", "Mar 12"],
      values: [4.3, 4.25, 4.2, 4.15, 4.1],
      label: "30m Sprint (seconds)",
      color: theme.colors.blue[6],
    },
    "60m_best": {
      dates: ["Jan 15", "Jan 29", "Feb 12", "Feb 26", "Mar 12"],
      values: [7.5, 7.45, 7.4, 7.35, 7.3],
      label: "60m Sprint (seconds)",
      color: theme.colors.red[6],
    },
  };

  const powerData: MetricDataMap = {
    vertical_jump: {
      dates: ["Jan 15", "Jan 29", "Feb 12", "Feb 26", "Mar 12"],
      values: [60, 61, 63, 64, 65],
      label: "Vertical Jump (cm)",
      color: theme.colors.blue[6],
    },
    broad_jump: {
      dates: ["Jan 15", "Jan 29", "Feb 12", "Feb 26", "Mar 12"],
      values: [260, 265, 270, 275, 280],
      label: "Broad Jump (cm)",
      color: theme.colors.red[6],
    },
    med_ball_throw: {
      dates: ["Jan 15", "Jan 29", "Feb 12", "Feb 26", "Mar 12"],
      values: [800, 815, 830, 840, 850],
      label: "Med Ball Throw (cm)",
      color: theme.colors.green[6],
    },
  };

  // Map of metric types to their specific metrics
  const metricOptions: Record<string, { value: string; label: string }[]> = {
    strength: [
      { value: "squat_1rm", label: "Squat 1RM" },
      { value: "bench_1rm", label: "Bench 1RM" },
      { value: "deadlift_1rm", label: "Deadlift 1RM" },
    ],
    speed: [
      { value: "30m_best", label: "30m Sprint" },
      { value: "60m_best", label: "60m Sprint" },
    ],
    power: [
      { value: "vertical_jump", label: "Vertical Jump" },
      { value: "broad_jump", label: "Broad Jump" },
      { value: "med_ball_throw", label: "Med Ball Throw" },
    ],
  };

  // Get the data for the currently selected metric
  const getSelectedData = (): MetricData => {
    const dataMap: Record<string, MetricDataMap> = {
      strength: strengthData,
      speed: speedData,
      power: powerData,
    };
    return dataMap[metricType]?.[specificMetric] || strengthData.squat_1rm;
  };

  // When the metric type changes, update the specific metric to the first option
  const handleMetricTypeChange = (value: string) => {
    setMetricType(value);
    setSpecificMetric(metricOptions[value][0].value);
  };

  const selectedData = getSelectedData();

  // Transform data for recharts
  const chartData = selectedData.dates.map((date, i) => ({
    date,
    value: selectedData.values[i],
  }));

  return (
    <Card withBorder p="md" radius="md">
      <Stack>
        <Group justify="space-between">
          <Title order={3}>Performance Trends</Title>
        </Group>

        <Group>
          <SegmentedControl
            value={metricType}
            onChange={handleMetricTypeChange}
            data={[
              { value: "strength", label: "Strength" },
              { value: "speed", label: "Speed" },
              { value: "power", label: "Power" },
            ]}
          />

          <SegmentedControl
            value={specificMetric}
            onChange={setSpecificMetric}
            data={metricOptions[metricType]}
          />
        </Group>

        <Text size="sm" c="dimmed">
          Track your progress over time. This chart shows how your {selectedData.label} has changed
          over the last three months.
        </Text>

        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: selectedData.label, angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke={selectedData.color}
                name={selectedData.label}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Stack>
    </Card>
  );
}
