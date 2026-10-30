"use client";

import { Container, Paper, Skeleton, Tabs, Text, Title } from "@mantine/core";
import { IconChartLine, IconClipboardCheck, IconTrendingUp } from "@tabler/icons-react";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { PerformanceMetrics, PerformanceTrends } from "@/components/performance";
import { useAuth } from "@/providers/AuthProvider";

/**
 * Performance page with PMC chart, metrics, and trends tabs.
 */
export default function PerformancePage() {
  const { user, loading } = useAuth();
  const athleteId = (user as { id?: string } | null | undefined)?.id ?? "";

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Skeleton height={400} />
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Paper p="md" radius="md" withBorder mb="xl">
        <Title order={1} mb="sm">
          Performance
        </Title>
        <Text c="dimmed">Track your training load, fitness metrics, and progress over time.</Text>
      </Paper>

      <Tabs defaultValue="pmc">
        <Tabs.List mb="md">
          <Tabs.Tab value="pmc" leftSection={<IconChartLine size={14} />}>
            PMC Chart
          </Tabs.Tab>
          <Tabs.Tab value="metrics" leftSection={<IconClipboardCheck size={14} />}>
            Metrics
          </Tabs.Tab>
          <Tabs.Tab value="trends" leftSection={<IconTrendingUp size={14} />}>
            Trends
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="pmc">
          <PerformanceChart athleteId={athleteId} />
        </Tabs.Panel>

        <Tabs.Panel value="metrics">
          <PerformanceMetrics athleteId={athleteId} />
        </Tabs.Panel>

        <Tabs.Panel value="trends">
          <PerformanceTrends athleteId={athleteId} />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
