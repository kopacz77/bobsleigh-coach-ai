"use client";

import {
  Badge,
  Card,
  Grid,
  Group,
  List,
  Paper,
  RingProgress,
  rem,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconActivity, IconBarbell, IconChartBar, IconRun, IconWeight } from "@tabler/icons-react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Title as ChartTitle,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { useState } from "react";
import { Bar, Line } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

export function TrainingAnalytics() {
  const [timeRange, setTimeRange] = useState("4w");
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for training distribution
  const trainingDistribution = {
    strength: 40,
    speed: 30,
    technical: 20,
    recovery: 10,
  };

  // Training load chart data
  const loadChartData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Training Load",
        data: [520, 580, 620, 540],
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        borderColor: "rgba(53, 162, 235, 1)",
        borderWidth: 2,
      },
    ],
  };

  // Training distribution chart data
  const distributionChartData = {
    labels: ["Strength", "Speed", "Technical", "Recovery"],
    datasets: [
      {
        label: "Hours",
        data: [12, 9, 6, 3],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Intensity distribution chart data
  const intensityChartData = {
    labels: ["Low", "Medium", "High"],
    datasets: [
      {
        label: "Hours",
        data: [6, 15, 9],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(255, 99, 132, 0.6)",
        ],
        borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 206, 86, 1)", "rgba(255, 99, 132, 1)"],
        borderWidth: 1,
      },
    ],
  };

  // Performance metrics chart data
  const performanceChartData = {
    labels: ["Jan", "Feb", "Mar"],
    datasets: [
      {
        label: "Squat 1RM (kg)",
        data: [140, 145, 155],
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.4,
        yAxisID: "y",
      },
      {
        label: "Sprint 30m (s)",
        data: [4.3, 4.2, 4.1],
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Weight (kg)",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Time (s)",
        },
        grid: {
          drawOnChartArea: false,
        },
        reverse: true, // Lower times are better for sprint
      },
    },
  };

  return (
    <Stack spacing="xl">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab
            value="overview"
            leftSection={<IconChartBar style={{ width: rem(16), height: rem(16) }} />}
          >
            Overview
          </Tabs.Tab>
          <Tabs.Tab
            value="performance"
            leftSection={<IconActivity style={{ width: rem(16), height: rem(16) }} />}
          >
            Performance
          </Tabs.Tab>
          <Tabs.Tab
            value="strength"
            leftSection={<IconWeight style={{ width: rem(16), height: rem(16) }} />}
          >
            Strength
          </Tabs.Tab>
          <Tabs.Tab
            value="speed"
            leftSection={<IconRun style={{ width: rem(16), height: rem(16) }} />}
          >
            Speed
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="xl">
          <Stack spacing="xl">
            <Group position="apart">
              <Title order={3}>Training Overview</Title>
              <SegmentedControl
                value={timeRange}
                onChange={setTimeRange}
                data={[
                  { label: "4W", value: "4w" },
                  { label: "3M", value: "3m" },
                  { label: "6M", value: "6m" },
                  { label: "1Y", value: "1y" },
                ]}
                size="xs"
              />
            </Group>

            <SimpleGrid cols={{ base: 1, md: 2 }}>
              <Card withBorder shadow="sm" p="md">
                <Stack spacing="md">
                  <Title order={4}>Weekly Training Load</Title>
                  <Bar
                    data={loadChartData}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: "Training Load Units",
                          },
                        },
                      },
                    }}
                  />
                </Stack>
              </Card>

              <Card withBorder shadow="sm" p="md">
                <Stack spacing="md">
                  <Title order={4}>Training Type Distribution</Title>
                  <Group position="center" align="start" spacing="xl">
                    <RingProgress
                      size={180}
                      thickness={20}
                      sections={[
                        { value: trainingDistribution.strength, color: "red" },
                        { value: trainingDistribution.speed, color: "blue" },
                        { value: trainingDistribution.technical, color: "yellow" },
                        { value: trainingDistribution.recovery, color: "teal" },
                      ]}
                      label={
                        <Stack spacing={0} align="center">
                          <Text fw={700} size="lg">
                            30 hrs
                          </Text>
                          <Text size="xs" c="dimmed">
                            Total
                          </Text>
                        </Stack>
                      }
                    />
                    <Stack spacing="xs">
                      <Group spacing="xs">
                        <ThemeIcon color="red" size="sm" />
                        <Text size="sm">Strength - {trainingDistribution.strength}%</Text>
                      </Group>
                      <Group spacing="xs">
                        <ThemeIcon color="blue" size="sm" />
                        <Text size="sm">Speed - {trainingDistribution.speed}%</Text>
                      </Group>
                      <Group spacing="xs">
                        <ThemeIcon color="yellow" size="sm" />
                        <Text size="sm">Technical - {trainingDistribution.technical}%</Text>
                      </Group>
                      <Group spacing="xs">
                        <ThemeIcon color="teal" size="sm" />
                        <Text size="sm">Recovery - {trainingDistribution.recovery}%</Text>
                      </Group>
                    </Stack>
                  </Group>
                </Stack>
              </Card>
            </SimpleGrid>

            <Grid gutter="md">
              <Grid.Col span={12}>
                <Card withBorder shadow="sm" p="md">
                  <Stack spacing="md">
                    <Title order={4}>Key Performance Indicators</Title>
                    <Line data={performanceChartData} options={options} />
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>

            <SimpleGrid cols={{ base: 1, md: 3 }}>
              <Paper withBorder p="md" radius="md">
                <Stack spacing="xs">
                  <Group>
                    <ThemeIcon color="blue" size="lg" radius="md">
                      <IconBarbell style={{ width: rem(20), height: rem(20) }} />
                    </ThemeIcon>
                    <Title order={5}>Workout Stats</Title>
                  </Group>
                  <List spacing="xs" size="sm" center>
                    <List.Item>Total Workouts: 24</List.Item>
                    <List.Item>Average Duration: 75 min</List.Item>
                    <List.Item>Completion Rate: 92%</List.Item>
                    <List.Item>
                      Intensity Distribution:
                      <Group spacing="xs" mt={5}>
                        <Badge color="green">Low: 20%</Badge>
                        <Badge color="yellow">Med: 50%</Badge>
                        <Badge color="red">High: 30%</Badge>
                      </Group>
                    </List.Item>
                  </List>
                </Stack>
              </Paper>

              <Paper withBorder p="md" radius="md">
                <Stack spacing="xs">
                  <Group>
                    <ThemeIcon color="red" size="lg" radius="md">
                      <IconActivity style={{ width: rem(20), height: rem(20) }} />
                    </ThemeIcon>
                    <Title order={5}>Progress Highlights</Title>
                  </Group>
                  <List spacing="xs" size="sm" center>
                    <List.Item>Squat: +15kg (10.7% increase)</List.Item>
                    <List.Item>Sprint 30m: -0.2s (4.7% improvement)</List.Item>
                    <List.Item>Total Volume: +15% vs last month</List.Item>
                    <List.Item>Recovery Score: 82% (Good)</List.Item>
                  </List>
                </Stack>
              </Paper>

              <Paper withBorder p="md" radius="md">
                <Stack spacing="xs">
                  <Group>
                    <ThemeIcon color="green" size="lg" radius="md">
                      <IconRun style={{ width: rem(20), height: rem(20) }} />
                    </ThemeIcon>
                    <Title order={5}>Training Balance</Title>
                  </Group>
                  <Text size="sm">
                    Your training balance is looking good with a proper mix of high-intensity and
                    recovery sessions. Consider slightly increasing technical training sessions to
                    enhance skill development.
                  </Text>
                  <Group mt="sm">
                    <Badge color="green" size="lg">
                      Well Balanced
                    </Badge>
                  </Group>
                </Stack>
              </Paper>
            </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="performance" pt="xl">
          <Text>Performance metrics analysis would be displayed here.</Text>
        </Tabs.Panel>

        <Tabs.Panel value="strength" pt="xl">
          <Text>Detailed strength training analytics would be displayed here.</Text>
        </Tabs.Panel>

        <Tabs.Panel value="speed" pt="xl">
          <Text>Speed and sprint performance analytics would be displayed here.</Text>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
