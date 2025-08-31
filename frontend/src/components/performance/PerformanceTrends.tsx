"use client";

import { Card, Group, SegmentedControl, Stack, Text, Title, useMantineTheme } from "@mantine/core";
import {
  CategoryScale,
  Chart as ChartJS,
  Title as ChartTitle,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { useState } from "react";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend
);

export function PerformanceTrends() {
  const theme = useMantineTheme();
  const [metricType, setMetricType] = useState("strength");
  const [specificMetric, setSpecificMetric] = useState("squat_1rm");

  // In a real app, this data would come from an API call
  // based on the selected metric

  // Placeholder data for different metrics
  const strengthData = {
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

  const speedData = {
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

  const powerData = {
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
  const metricOptions = {
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
  const getSelectedData = () => {
    switch (metricType) {
      case "strength":
        return strengthData[specificMetric];
      case "speed":
        return speedData[specificMetric];
      case "power":
        return powerData[specificMetric];
      default:
        return strengthData.squat_1rm;
    }
  };

  // When the metric type changes, update the specific metric to the first option
  const handleMetricTypeChange = (value) => {
    setMetricType(value);
    setSpecificMetric(metricOptions[value][0].value);
  };

  const selectedData = getSelectedData();

  const chartData = {
    labels: selectedData.dates,
    datasets: [
      {
        label: selectedData.label,
        data: selectedData.values,
        borderColor: selectedData.color,
        backgroundColor: "rgba(0, 0, 0, 0)",
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        title: {
          display: true,
          text: selectedData.label,
        },
        beginAtZero: false,
      },
    },
  };

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
          <Line data={chartData} options={chartOptions} />
        </div>
      </Stack>
    </Card>
  );
}
