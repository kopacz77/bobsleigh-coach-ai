"use client";

import {
  Card,
  Grid,
  Group,
  Progress,
  RingProgress,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useMemo } from "react";
import { usePerformanceMetrics } from "@/hooks/usePerformance";

interface PerformanceMetricsProps {
  athleteId: string;
}

interface MetricRow {
  metric_type?: string;
  metric_name: string;
  value: number;
  unit?: string;
  test_date?: string;
  [key: string]: unknown;
}

interface MetricGroup {
  label: string;
  color: string;
  items: { name: string; value: number; unit: string }[];
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  strength: { label: "Strength", color: "blue" },
  speed: { label: "Speed", color: "green" },
  sprint: { label: "Speed", color: "green" },
  power: { label: "Power", color: "orange" },
  endurance: { label: "Endurance", color: "violet" },
  technique: { label: "Technique", color: "cyan" },
};

function formatMetricName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/1rm/gi, "1RM")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PerformanceMetrics({ athleteId }: PerformanceMetricsProps) {
  const { data: metrics, isLoading } = usePerformanceMetrics(athleteId);

  const groups: MetricGroup[] = useMemo(() => {
    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) return [];

    // Group by metric_type (or "other" if missing), keeping only latest value per metric_name
    const byType: Record<string, Map<string, MetricRow>> = {};

    for (const row of metrics as MetricRow[]) {
      const type = (row.metric_type || "other").toLowerCase();
      if (!byType[type]) byType[type] = new Map();
      // Data is ordered desc by test_date from API, so first occurrence is latest
      if (!byType[type].has(row.metric_name)) {
        byType[type].set(row.metric_name, row);
      }
    }

    return Object.entries(byType).map(([type, metricsMap]) => {
      const config = TYPE_CONFIG[type] || {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        color: "gray",
      };
      return {
        label: config.label,
        color: config.color,
        items: Array.from(metricsMap.values()).map((m) => ({
          name: formatMetricName(m.metric_name),
          value: m.value,
          unit: m.unit || "",
        })),
      };
    });
  }, [metrics]);

  // Overall score: average of group average values normalized to 0-100
  // Since we do not have historical bests in a single API call, just show the count of metrics
  const totalMetrics = groups.reduce((sum, g) => sum + g.items.length, 0);

  if (isLoading) {
    return (
      <Card withBorder p="md" radius="md">
        <Stack>
          <Title order={3}>Performance Metrics</Title>
          <Grid>
            {[1, 2, 3, 4].map((n) => (
              <Grid.Col key={n} span={{ base: 12, md: 3 }}>
                <Skeleton height={200} radius="md" />
              </Grid.Col>
            ))}
          </Grid>
        </Stack>
      </Card>
    );
  }

  if (groups.length === 0) {
    return (
      <Card withBorder p="md" radius="md">
        <Stack>
          <Title order={3}>Performance Metrics</Title>
          <Stack ta="center" py="xl" gap="xs">
            <Text size="lg" fw={500} c="dimmed">
              No performance tests recorded yet
            </Text>
            <Text size="sm" c="dimmed">
              Complete performance assessments to see your metrics here.
            </Text>
          </Stack>
        </Stack>
      </Card>
    );
  }

  return (
    <Card withBorder p={{ base: "sm", md: "md" }} radius="md">
      <Stack>
        <Title order={3} fz={{ base: "md", md: "lg" }}>
          Performance Metrics
        </Title>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Stack ta="center" gap="xs">
              <RingProgress
                size={100}
                thickness={10}
                roundCaps
                sections={[{ value: Math.min(totalMetrics * 10, 100), color: "blue" }]}
                label={
                  <Text fw={700} ta="center" size="lg">
                    {totalMetrics}
                  </Text>
                }
              />
              <Text fw={500} size="sm">
                Metrics Tracked
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                Across {groups.length} categor{groups.length === 1 ? "y" : "ies"}
              </Text>
            </Stack>
          </Grid.Col>

          {groups.map((group) => (
            <Grid.Col key={group.label} span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder h="100%" p="sm">
                <Stack>
                  <Group justify="space-between">
                    <Text fw={500} size="sm">
                      {group.label}
                    </Text>
                    <Text fw={700} size="sm">
                      {group.items.length} tests
                    </Text>
                  </Group>
                  <Progress
                    value={Math.min(group.items.length * 20, 100)}
                    color={group.color}
                    size="md"
                  />

                  <Stack gap={5} mt="xs">
                    {group.items.map((item) => (
                      <Group key={item.name} justify="space-between" wrap="nowrap">
                        <Text size="sm" style={{ minWidth: 0 }}>
                          {item.name}
                        </Text>
                        <Text size="sm" fw={500} style={{ whiteSpace: "nowrap" }}>
                          {item.value} {item.unit}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Stack>
    </Card>
  );
}
