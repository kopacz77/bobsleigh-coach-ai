"use client";

import {
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconBarbell,
  IconBell,
  IconCheckbox,
  IconClipboardCheck,
  IconFilter,
  IconTrendingUp,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import CoachReadiness from "@/components/dashboard/CoachReadiness";
import { CoachWorkoutView } from "@/components/training";
import {
  useCoachAlerts,
  useCoachPMCSummary,
  useCoachRoster,
} from "@/hooks/useCoachDashboard";

/**
 * CoachDashboard component provides coaches with a comprehensive view of all athletes,
 * their wellbeing status, training progress, and alerts.
 *
 * All data flows through React Query hooks backed by /api/coach/* endpoints.
 * No direct Supabase queries.
 */
interface CoachDashboardProps {
  userId: string;
  userProfile: any;
}

// Helper: TSB color coding
function tsbColor(tsb: number | null | undefined): string {
  if (tsb == null) return "gray";
  if (tsb > 0) return "green";
  if (tsb >= -10) return "yellow";
  return "red";
}

// Helper: TSB label
function tsbLabel(tsb: number | null | undefined): string {
  if (tsb == null) return "N/A";
  if (tsb > 0) return "Good form";
  if (tsb >= -10) return "Slight fatigue";
  return "Significant fatigue";
}

// Helper: format date for display
function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

// Helper: alert type to icon
function getAlertIcon(type: string) {
  switch (type) {
    case "fatigue_spike":
    case "overtraining_risk":
      return (
        <ThemeIcon color="red" size={28} radius="xl">
          <IconAlertTriangle size={18} />
        </ThemeIcon>
      );
    case "missed_checkin":
      return (
        <ThemeIcon color="orange" size={28} radius="xl">
          <IconX size={18} />
        </ThemeIcon>
      );
    case "low_readiness":
      return (
        <ThemeIcon color="yellow" size={28} radius="xl">
          <IconBell size={18} />
        </ThemeIcon>
      );
    default:
      return (
        <ThemeIcon color="gray" size={28} radius="xl">
          <IconBell size={18} />
        </ThemeIcon>
      );
  }
}

// Helper: severity to badge color
function severityColor(severity: string): string {
  switch (severity) {
    case "high":
      return "red";
    case "medium":
      return "yellow";
    case "low":
      return "blue";
    default:
      return "gray";
  }
}

const CoachDashboard = ({ userId, userProfile }: CoachDashboardProps) => {
  const router = useRouter();
  const [alertFilter, setAlertFilter] = useState("all");

  // React Query hooks -- all data from /api/coach/* endpoints
  const {
    data: roster,
    isLoading: rosterLoading,
  } = useCoachRoster();
  const {
    data: pmcSummary,
    isLoading: pmcLoading,
  } = useCoachPMCSummary();
  const {
    data: alerts,
    isLoading: alertsLoading,
  } = useCoachAlerts();

  const alertList: any[] = alerts || [];
  const filteredAlerts =
    alertFilter === "all"
      ? alertList
      : alertList.filter((a: any) => a.type === alertFilter);

  // Handle athlete click
  const handleAthleteClick = (athleteId: string) => {
    router.push(`/athletes/${athleteId}`);
  };

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <Box>
          <Title order={2}>Coach Dashboard</Title>
          <Text c="dimmed">
            Monitor your athletes&apos; wellbeing and performance
          </Text>
        </Box>
      </Group>

      <Tabs defaultValue="athletes">
        <Tabs.List mb="md">
          <Tabs.Tab value="athletes" leftSection={<IconUsers size={14} />}>
            Athletes
          </Tabs.Tab>
          <Tabs.Tab
            value="check-ins"
            leftSection={<IconClipboardCheck size={14} />}
          >
            Check-Ins
          </Tabs.Tab>
          <Tabs.Tab value="workouts" leftSection={<IconBarbell size={14} />}>
            Workouts
          </Tabs.Tab>
          <Tabs.Tab
            value="alerts"
            leftSection={<IconAlertTriangle size={14} />}
            rightSection={
              alertList.length > 0 ? (
                <Badge size="xs" p={3} color="red">
                  {alertList.length}
                </Badge>
              ) : null
            }
          >
            Alerts
          </Tabs.Tab>
        </Tabs.List>

        {/* Athletes Tab */}
        <Tabs.Panel value="athletes">
          <Stack gap="lg">
            <CoachReadiness />

            {/* PMC Summary Table */}
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Group>
                  <ThemeIcon size={36} radius="md" color="blue">
                    <IconTrendingUp size={20} />
                  </ThemeIcon>
                  <Text fw={600} size="lg">
                    Team PMC Summary
                  </Text>
                </Group>
              </Group>

              {pmcLoading ? (
                <Stack gap="sm">
                  <Skeleton height={30} />
                  <Skeleton height={30} />
                  <Skeleton height={30} />
                </Stack>
              ) : pmcSummary && pmcSummary.length > 0 ? (
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Athlete</Table.Th>
                      <Table.Th ta="right">CTL (Fitness)</Table.Th>
                      <Table.Th ta="right">ATL (Fatigue)</Table.Th>
                      <Table.Th ta="right">TSB (Form)</Table.Th>
                      <Table.Th ta="right">Last Load</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pmcSummary.map((athlete: any) => (
                      <Table.Tr
                        key={athlete.athlete_id}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleAthleteClick(athlete.athlete_id)}
                      >
                        <Table.Td>
                          <Text fw={500}>{athlete.athlete_name}</Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text>
                            {athlete.ctl != null
                              ? athlete.ctl.toFixed(1)
                              : "--"}
                          </Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text>
                            {athlete.atl != null
                              ? athlete.atl.toFixed(1)
                              : "--"}
                          </Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Badge
                            color={tsbColor(athlete.tsb)}
                            variant="light"
                            size="lg"
                          >
                            {athlete.tsb != null
                              ? athlete.tsb.toFixed(1)
                              : "--"}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {tsbLabel(athlete.tsb)}
                          </Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text>
                            {athlete.last_load != null
                              ? athlete.last_load.toFixed(0)
                              : "--"}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  No PMC data available. Athletes need training history for PMC
                  calculations.
                </Text>
              )}
            </Paper>

            {/* Quick Alerts Summary on Athletes Tab */}
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Group>
                  <ThemeIcon size={36} radius="md" color="red">
                    <IconAlertTriangle size={20} />
                  </ThemeIcon>
                  <Text fw={600} size="lg">
                    Active Alerts
                  </Text>
                </Group>
                <Badge>{alertList.length}</Badge>
              </Group>

              <Box>
                {alertsLoading ? (
                  <Stack gap="sm">
                    <Skeleton height={50} />
                    <Skeleton height={50} />
                  </Stack>
                ) : alertList.length > 0 ? (
                  alertList.slice(0, 5).map((alert: any, idx: number) => (
                    <Paper
                      key={`${alert.athlete_id}-${alert.type}-${idx}`}
                      p="sm"
                      withBorder
                      radius="md"
                      mb="sm"
                    >
                      <Group justify="space-between" mb="xs">
                        <Group>
                          {getAlertIcon(alert.type)}
                          <Text fw={500}>{alert.message}</Text>
                        </Group>
                        <Group gap="xs">
                          <Badge
                            color={severityColor(alert.severity)}
                            size="sm"
                          >
                            {alert.severity}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {alert.date ? formatDate(alert.date) : ""}
                          </Text>
                        </Group>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {alert.athlete_name}
                      </Text>
                    </Paper>
                  ))
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No active alerts at this time
                  </Text>
                )}
              </Box>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Check-Ins Tab */}
        <Tabs.Panel value="check-ins">
          <CoachReadiness />
        </Tabs.Panel>

        {/* Workouts Tab */}
        <Tabs.Panel value="workouts">
          <CoachWorkoutView />
        </Tabs.Panel>

        {/* Alerts Tab */}
        <Tabs.Panel value="alerts">
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Group>
                <ThemeIcon size={36} radius="md" color="red">
                  <IconAlertTriangle size={20} />
                </ThemeIcon>
                <Text fw={600} size="lg">
                  Athlete Alerts
                </Text>
              </Group>

              <Group>
                <Select
                  placeholder="Filter alerts"
                  leftSection={<IconFilter size={16} />}
                  data={[
                    { value: "all", label: "All Alerts" },
                    { value: "fatigue_spike", label: "Fatigue Spikes" },
                    { value: "overtraining_risk", label: "Overtraining Risk" },
                    { value: "low_readiness", label: "Low Readiness" },
                    { value: "missed_checkin", label: "Missed Check-ins" },
                  ]}
                  value={alertFilter}
                  onChange={(value) => setAlertFilter(value || "all")}
                  styles={{ root: { width: 200 } }}
                />

                <Badge size="lg">{filteredAlerts.length} Alerts</Badge>
              </Group>
            </Group>

            {alertsLoading ? (
              <Stack gap="md">
                <Skeleton height={80} />
                <Skeleton height={80} />
                <Skeleton height={80} />
              </Stack>
            ) : filteredAlerts.length > 0 ? (
              <SimpleGrid cols={1} spacing="md">
                {filteredAlerts.map((alert: any, idx: number) => (
                  <Paper
                    key={`${alert.athlete_id}-${alert.type}-${idx}`}
                    p="md"
                    withBorder
                    radius="md"
                  >
                    <Group justify="space-between" mb="xs">
                      <Group>
                        {getAlertIcon(alert.type)}
                        <Box>
                          <Text fw={600}>{alert.message}</Text>
                          <Text size="sm" c="dimmed">
                            {alert.athlete_name}
                            {alert.date ? ` - ${formatDate(alert.date)}` : ""}
                          </Text>
                        </Box>
                      </Group>

                      <Badge color={severityColor(alert.severity)}>
                        {alert.severity.charAt(0).toUpperCase() +
                          alert.severity.slice(1)}{" "}
                        Priority
                      </Badge>
                    </Group>

                    <Group justify="flex-end" mt="sm">
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() => handleAthleteClick(alert.athlete_id)}
                      >
                        View Athlete
                      </Button>
                    </Group>
                  </Paper>
                ))}
              </SimpleGrid>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                No active alerts at this time
              </Text>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {/* Workout Compliance Section */}
      <Paper p="md" radius="md" withBorder mt="lg">
        <Group justify="space-between" mb="md">
          <Group>
            <ThemeIcon size={36} radius="md" color="teal">
              <IconCheckbox size={20} />
            </ThemeIcon>
            <Text fw={600} size="lg">
              Athlete Workout Compliance (Last 7 Days)
            </Text>
          </Group>
        </Group>
        <CoachWorkoutView />
      </Paper>
    </Box>
  );
};

export default CoachDashboard;
