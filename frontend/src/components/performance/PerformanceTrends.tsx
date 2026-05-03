"use client";

import {
  Card,
  Group,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useMemo, useState } from "react";
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
import { usePerformanceTrends } from "@/hooks/usePerformance";

interface PerformanceTrendsProps {
  athleteId: string;
}

// Metric options grouped by category
const metricOptions: Record<string, { value: string; label: string }[]> = {
  strength: [
    { value: "back_squat_1rm", label: "Back Squat 1RM" },
    { value: "bench_press_1rm", label: "Bench Press 1RM" },
    { value: "deadlift_1rm", label: "Deadlift 1RM" },
    { value: "power_clean_1rm", label: "Power Clean 1RM" },
  ],
  speed: [
    { value: "30m_sprint", label: "30m Sprint" },
    { value: "60m_sprint", label: "60m Sprint" },
  ],
  power: [
    { value: "vertical_jump", label: "Vertical Jump" },
    { value: "broad_jump", label: "Broad Jump" },
    { value: "med_ball_throw", label: "Med Ball Throw" },
  ],
};

interface TrendRow {
  test_date?: string;
  date?: string;
  metric_name: string;
  value: number;
  unit?: string;
}

export function PerformanceTrends({ athleteId }: PerformanceTrendsProps) {
  const theme = useMantineTheme();
  const [metricType, setMetricType] = useState("strength");
  const [specificMetric, setSpecificMetric] = useState("back_squat_1rm");

  const { data: trendData, isLoading } = usePerformanceTrends(athleteId, specificMetric, 180);

  const chartData = useMemo(() => {
    if (!trendData || !Array.isArray(trendData) || trendData.length === 0) return [];
    return (trendData as TrendRow[]).map((item) => ({
      date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
        new Date(item.test_date || item.date || ""),
      ),
      value: item.value,
    }));
  }, [trendData]);

  const selectedLabel =
    metricOptions[metricType]?.find((m) => m.value === specificMetric)?.label || specificMetric;

  const unit = useMemo(() => {
    if (!trendData || !Array.isArray(trendData) || trendData.length === 0) return "";
    return (trendData as TrendRow[])[0]?.unit || "";
  }, [trendData]);

  const handleMetricTypeChange = (value: string) => {
    setMetricType(value);
    setSpecificMetric(metricOptions[value][0].value);
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
          Track your progress over time. This chart shows how your {selectedLabel}
          {unit ? ` (${unit})` : ""} has changed over the last six months.
        </Text>

        <div style={{ height: 300 }}>
          {isLoading ? (
            <Skeleton height={300} radius="md" />
          ) : chartData.length === 0 ? (
            <Stack ta="center" justify="center" h="100%" gap="xs">
              <Text size="lg" fw={500} c="dimmed">
                No data for this metric
              </Text>
              <Text size="sm" c="dimmed">
                Record performance assessments for {selectedLabel} to see trends.
              </Text>
            </Stack>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  label={{
                    value: `${selectedLabel}${unit ? ` (${unit})` : ""}`,
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={theme.colors.blue[6]}
                  name={selectedLabel}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Stack>
    </Card>
  );
}
