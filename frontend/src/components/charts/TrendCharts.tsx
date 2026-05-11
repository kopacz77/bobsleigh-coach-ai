"use client";

import {
  Alert,
  Badge,
  Box,
  Card,
  Grid,
  Group,
  ScrollArea,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconMinus,
  IconTarget,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyFeedback } from "@/lib/types/training";

interface TrendChartsProps {
  feedbackHistory: DailyFeedback[];
  timeRange?: "7d" | "14d" | "30d" | "90d";
  onTimeRangeChange?: (range: "7d" | "14d" | "30d" | "90d") => void;
}

export function TrendCharts({
  feedbackHistory,
  timeRange = "14d",
  onTimeRangeChange,
}: TrendChartsProps) {
  const processedData = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "14d" ? 14 : timeRange === "30d" ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filteredData = feedbackHistory
      .filter((feedback) => new Date(feedback.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((feedback) => ({
        date: new Date(feedback.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        rpe: feedback.sessionRpe,
        soreness: feedback.muscleSoreness,
        energy: feedback.energyLevel,
        motivation: feedback.motivationLevel,
        // Calculate derived metrics
        fatigue: feedback.sessionRpe + feedback.muscleSoreness,
        readiness: (feedback.energyLevel + feedback.motivationLevel) / 2,
        // Training stress balance approximation
        tsb: feedback.energyLevel - (feedback.sessionRpe + feedback.muscleSoreness) / 2,
      }));

    return filteredData;
  }, [feedbackHistory, timeRange]);

  const trendAnalysis = useMemo(() => {
    if (processedData.length < 3) return null;

    const recent = processedData.slice(-3);
    const earlier = processedData.slice(0, Math.max(1, processedData.length - 3));

    const recentAvg = {
      rpe: recent.reduce((sum, d) => sum + d.rpe, 0) / recent.length,
      soreness: recent.reduce((sum, d) => sum + d.soreness, 0) / recent.length,
      energy: recent.reduce((sum, d) => sum + d.energy, 0) / recent.length,
      readiness: recent.reduce((sum, d) => sum + d.readiness, 0) / recent.length,
    };

    const earlierAvg = {
      rpe: earlier.reduce((sum, d) => sum + d.rpe, 0) / earlier.length,
      soreness: earlier.reduce((sum, d) => sum + d.soreness, 0) / earlier.length,
      energy: earlier.reduce((sum, d) => sum + d.energy, 0) / earlier.length,
      readiness: earlier.reduce((sum, d) => sum + d.readiness, 0) / earlier.length,
    };

    return {
      rpe: recentAvg.rpe - earlierAvg.rpe,
      soreness: recentAvg.soreness - earlierAvg.soreness,
      energy: recentAvg.energy - earlierAvg.energy,
      readiness: recentAvg.readiness - earlierAvg.readiness,
    };
  }, [processedData]);

  const getTrendIcon = (value: number) => {
    if (value > 0.5) return <IconTrendingUp size={16} color="green" />;
    if (value < -0.5) return <IconTrendingDown size={16} color="red" />;
    return <IconMinus size={16} color="gray" />;
  };

  const getTrendColor = (value: number, inverted = false) => {
    if (inverted) {
      return value > 0.5 ? "red" : value < -0.5 ? "green" : "blue";
    }
    return value > 0.5 ? "green" : value < -0.5 ? "red" : "blue";
  };

  const formatTooltipValue = (value: number, name: string) => {
    const labels: Record<string, string> = {
      rpe: "RPE",
      soreness: "Soreness",
      energy: "Energy",
      motivation: "Motivation",
      readiness: "Readiness",
      tsb: "Training Stress Balance",
    };
    return [`${value.toFixed(1)}`, labels[name] || name];
  };

  const getCurrentReadiness = () => {
    if (processedData.length === 0) return null;
    const latest = processedData[processedData.length - 1];
    return latest.readiness;
  };

  const readiness = getCurrentReadiness();

  if (feedbackHistory.length === 0) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md" ta="center">
          <IconTarget size={48} color="gray" />
          <Stack gap="xs" ta="center">
            <Title order={4}>No Data Available</Title>
            <Text c="dimmed" ta="center">
              Submit some training feedback to see your trends and patterns
            </Text>
          </Stack>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap="lg">
      {/* Controls */}
      <Stack gap="sm">
        <Title order={3} fz={{ base: "md", md: "lg" }}>Training Trends</Title>
        <SegmentedControl
          value={timeRange}
          onChange={(value) => onTimeRangeChange?.(value as any)}
          data={[
            { label: "7D", value: "7d" },
            { label: "14D", value: "14d" },
            { label: "30D", value: "30d" },
            { label: "90D", value: "90d" },
          ]}
          fullWidth
        />
      </Stack>

      {/* Current Status */}
      {readiness && (
        <Alert
          color={readiness >= 7 ? "green" : readiness >= 5 ? "yellow" : "red"}
          title="Current Training Readiness"
          icon={readiness >= 7 ? <IconTrendingUp size={16} /> : <IconAlertTriangle size={16} />}
        >
          <Text size="sm">
            Your current readiness score is {readiness.toFixed(1)}/10
            {readiness >= 7 && " - Excellent! Ready for intense training."}
            {readiness >= 5 && readiness < 7 && " - Moderate. Consider balanced training."}
            {readiness < 5 && " - Low. Focus on recovery and lighter training."}
          </Text>
        </Alert>
      )}

      {/* Trend Analysis */}
      {trendAnalysis && (
        <Grid>
          <Grid.Col span={{ base: 12, xs: 6 }}>
            <Card p="sm" withBorder>
              <Group justify="space-between" wrap="wrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">
                    RPE Trend
                  </Text>
                  <Group gap="xs">
                    {getTrendIcon(trendAnalysis.rpe)}
                    <Text size="sm" fw={500}>
                      {trendAnalysis.rpe > 0 ? "+" : ""}
                      {trendAnalysis.rpe.toFixed(1)}
                    </Text>
                  </Group>
                </Stack>
                <Badge color={getTrendColor(trendAnalysis.rpe, true)} variant="light" size="sm">
                  {Math.abs(trendAnalysis.rpe) < 0.5
                    ? "Stable"
                    : trendAnalysis.rpe > 0
                      ? "Increasing"
                      : "Decreasing"}
                </Badge>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, xs: 6 }}>
            <Card p="sm" withBorder>
              <Group justify="space-between" wrap="wrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">
                    Energy Trend
                  </Text>
                  <Group gap="xs">
                    {getTrendIcon(trendAnalysis.energy)}
                    <Text size="sm" fw={500}>
                      {trendAnalysis.energy > 0 ? "+" : ""}
                      {trendAnalysis.energy.toFixed(1)}
                    </Text>
                  </Group>
                </Stack>
                <Badge color={getTrendColor(trendAnalysis.energy)} variant="light" size="sm">
                  {Math.abs(trendAnalysis.energy) < 0.5
                    ? "Stable"
                    : trendAnalysis.energy > 0
                      ? "Improving"
                      : "Declining"}
                </Badge>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      )}

      {/* Main Trends Chart */}
      <Card shadow="sm" p={{ base: "sm", md: "lg" }} radius="md" withBorder>
        <Stack gap="md">
          <Title order={4} fz={{ base: "sm", md: "md" }}>Daily Metrics Trends</Title>
          <ScrollArea type="auto">
            <Box style={{ width: "100%", minWidth: 350, height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis domain={[1, 10]} tick={{ fontSize: 12 }} tickLine={false} />
                <Tooltip
                  formatter={formatTooltipValue}
                  labelStyle={{ color: "#333" }}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
                <ReferenceLine y={5} stroke="#888" strokeDasharray="2 2" opacity={0.5} />
                <Line
                  type="monotone"
                  dataKey="rpe"
                  stroke="#ff6b6b"
                  strokeWidth={2}
                  dot={{ fill: "#ff6b6b", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, stroke: "#ff6b6b" }}
                />
                <Line
                  type="monotone"
                  dataKey="energy"
                  stroke="#51cf66"
                  strokeWidth={2}
                  dot={{ fill: "#51cf66", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, stroke: "#51cf66" }}
                />
                <Line
                  type="monotone"
                  dataKey="soreness"
                  stroke="#ffa94d"
                  strokeWidth={2}
                  dot={{ fill: "#ffa94d", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, stroke: "#ffa94d" }}
                />
                <Line
                  type="monotone"
                  dataKey="motivation"
                  stroke="#339af0"
                  strokeWidth={2}
                  dot={{ fill: "#339af0", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, stroke: "#339af0" }}
                />
              </LineChart>
            </ResponsiveContainer>
            </Box>
          </ScrollArea>
          <Group justify="center" gap="sm" wrap="wrap">
            <Group gap="xs">
              <div style={{ width: 12, height: 2, backgroundColor: "#ff6b6b" }} />
              <Text size="sm">RPE</Text>
            </Group>
            <Group gap="xs">
              <div style={{ width: 12, height: 2, backgroundColor: "#51cf66" }} />
              <Text size="sm">Energy</Text>
            </Group>
            <Group gap="xs">
              <div style={{ width: 12, height: 2, backgroundColor: "#ffa94d" }} />
              <Text size="sm">Soreness</Text>
            </Group>
            <Group gap="xs">
              <div style={{ width: 12, height: 2, backgroundColor: "#339af0" }} />
              <Text size="sm">Motivation</Text>
            </Group>
          </Group>
        </Stack>
      </Card>

      {/* Training Stress Balance */}
      <Card shadow="sm" p={{ base: "sm", md: "lg" }} radius="md" withBorder>
        <Stack gap="md">
          <Title order={4} fz={{ base: "sm", md: "md" }}>Training Stress Balance</Title>
          <Text size="sm" c="dimmed">
            Positive values indicate good recovery, negative values suggest accumulated fatigue
          </Text>
          <ScrollArea type="auto">
            <Box style={{ width: "100%", minWidth: 350, height: 200 }}>
              <ResponsiveContainer>
                <AreaChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}`, "TSB"]}
                    labelStyle={{ color: "#333" }}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                  <ReferenceLine y={0} stroke="#333" strokeDasharray="2 2" />
                  <Area
                    type="monotone"
                    dataKey="tsb"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </ScrollArea>
        </Stack>
      </Card>

      {/* Readiness Radar */}
      {processedData.length > 0 && (
        <Card shadow="sm" p={{ base: "sm", md: "lg" }} radius="md" withBorder>
          <Stack gap="md">
            <Title order={4} fz={{ base: "sm", md: "md" }}>Current Training Profile</Title>
            <Box style={{ width: "100%", minHeight: 250, height: 300 }}>
              <ResponsiveContainer>
                <RadarChart
                  data={[
                    {
                      metric: "Energy",
                      value: processedData[processedData.length - 1]?.energy || 5,
                      fullMark: 10,
                    },
                    {
                      metric: "Motivation",
                      value: processedData[processedData.length - 1]?.motivation || 5,
                      fullMark: 10,
                    },
                    {
                      metric: "Low RPE",
                      value: 10 - (processedData[processedData.length - 1]?.rpe || 5),
                      fullMark: 10,
                    },
                    {
                      metric: "Low Soreness",
                      value: 10 - (processedData[processedData.length - 1]?.soreness || 5),
                      fullMark: 10,
                    },
                  ]}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tickCount={6}
                    tick={{ fontSize: 10 }}
                  />
                  <Radar
                    name="Current State"
                    dataKey="value"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
            <Text size="sm" c="dimmed" ta="center">
              Larger area indicates better training readiness
            </Text>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
