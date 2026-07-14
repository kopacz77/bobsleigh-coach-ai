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
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

  // Training load data for recharts
  const loadData = [
    { week: "Week 1", load: 520 },
    { week: "Week 2", load: 580 },
    { week: "Week 3", load: 620 },
    { week: "Week 4", load: 540 },
  ];

  // Performance metrics data for recharts
  const performanceData = [
    { month: "Jan", squat: 140, sprint: 4.3 },
    { month: "Feb", squat: 145, sprint: 4.2 },
    { month: "Mar", squat: 155, sprint: 4.1 },
  ];

  return (
    <Stack gap="xl">
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || "overview")}>
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
          <Stack gap="xl">
            <Group justify="space-between">
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
                <Stack gap="md">
                  <Title order={4}>Weekly Training Load</Title>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={loadData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="load" fill="rgba(53, 162, 235, 0.7)" name="Training Load" />
                    </BarChart>
                  </ResponsiveContainer>
                </Stack>
              </Card>

              <Card withBorder shadow="sm" p="md">
                <Stack gap="md">
                  <Title order={4}>Training Type Distribution</Title>
                  <Group justify="center" align="start" gap="xl">
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
                        <Stack gap={0} ta="center">
                          <Text fw={700} size="lg">
                            30 hrs
                          </Text>
                          <Text size="xs" c="dimmed">
                            Total
                          </Text>
                        </Stack>
                      }
                    />
                    <Stack gap="xs">
                      <Group gap="xs">
                        <ThemeIcon color="red" size="sm" />
                        <Text size="sm">Strength - {trainingDistribution.strength}%</Text>
                      </Group>
                      <Group gap="xs">
                        <ThemeIcon color="blue" size="sm" />
                        <Text size="sm">Speed - {trainingDistribution.speed}%</Text>
                      </Group>
                      <Group gap="xs">
                        <ThemeIcon color="yellow" size="sm" />
                        <Text size="sm">Technical - {trainingDistribution.technical}%</Text>
                      </Group>
                      <Group gap="xs">
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
                  <Stack gap="md">
                    <Title order={4}>Key Performance Indicators</Title>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis
                          yAxisId="left"
                          label={{ value: "Weight (kg)", angle: -90, position: "insideLeft" }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          reversed
                          label={{ value: "Time (s)", angle: 90, position: "insideRight" }}
                        />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="squat"
                          stroke="#ff6384"
                          name="Squat 1RM (kg)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="sprint"
                          stroke="#36a2eb"
                          name="Sprint 30m (s)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>

            <SimpleGrid cols={{ base: 1, md: 3 }}>
              <Paper withBorder p="md" radius="md">
                <Stack gap="xs">
                  <Group>
                    <ThemeIcon color="blue" size="lg" radius="md">
                      <IconBarbell style={{ width: rem(20), height: rem(20) }} />
                    </ThemeIcon>
                    <Title order={5}>Workout Stats</Title>
                  </Group>
                  <List spacing="xs" size="sm">
                    <List.Item>Total Workouts: 24</List.Item>
                    <List.Item>Average Duration: 75 min</List.Item>
                    <List.Item>Completion Rate: 92%</List.Item>
                    <List.Item>
                      Intensity Distribution:
                      <Group gap="xs" mt={5}>
                        <Badge color="green">Low: 20%</Badge>
                        <Badge color="yellow">Med: 50%</Badge>
                        <Badge color="red">High: 30%</Badge>
                      </Group>
                    </List.Item>
                  </List>
                </Stack>
              </Paper>

              <Paper withBorder p="md" radius="md">
                <Stack gap="xs">
                  <Group>
                    <ThemeIcon color="red" size="lg" radius="md">
                      <IconActivity style={{ width: rem(20), height: rem(20) }} />
                    </ThemeIcon>
                    <Title order={5}>Progress Highlights</Title>
                  </Group>
                  <List spacing="xs" size="sm">
                    <List.Item>Squat: +15kg (10.7% increase)</List.Item>
                    <List.Item>Sprint 30m: -0.2s (4.7% improvement)</List.Item>
                    <List.Item>Total Volume: +15% vs last month</List.Item>
                    <List.Item>Recovery Score: 82% (Good)</List.Item>
                  </List>
                </Stack>
              </Paper>

              <Paper withBorder p="md" radius="md">
                <Stack gap="xs">
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
