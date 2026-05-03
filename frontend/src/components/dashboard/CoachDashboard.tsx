"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Menu,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  ThemeIcon,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useSupabase } from '@/providers/SupabaseProvider';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBarbell,
  IconBell,
  IconCalendarEvent,
  IconChartBar,
  IconCheckbox,
  IconChevronDown,
  IconClipboardCheck,
  IconClock,
  IconDots,
  IconEye,
  IconFileAnalytics,
  IconFilter,
  IconMessageCircle,
  IconPencil,
  IconStar,
  IconTarget,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { CoachWorkoutView } from "@/components/training";
import CoachReadiness from "@/components/dashboard/CoachReadiness";

/**
 * CoachDashboard component provides coaches with a comprehensive view of all athletes,
 * their wellbeing status, training progress, and alerts
 */
interface CoachDashboardProps {
  userId: string;
  userProfile: any;
}

const CoachDashboard = ({ userId, userProfile }: CoachDashboardProps) => {
  const theme = useMantineTheme();
  const router = useRouter();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const [athletes, setAthletes] = useState<any[]>([]);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("today");

  // Fetch data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!supabase) return;
      setLoading(true);
      try {
        // Fetch all athletes coached by this user
        const { data: athletesData, error: athletesError } = await supabase
          .from("athlete_coaches")
          .select(`
            athlete_id,
            athletes:athlete_id(id, first_name, last_name, avatar_url, primary_sport)
          `)
          .eq("coach_id", userId);

        if (athletesError) {
          console.error("Error fetching athletes:", athletesError);
          return;
        }

        const athleteList = athletesData?.flatMap((item) => item.athletes) || [];
        setAthletes(athleteList);

        if (athleteList.length > 0) {
          const athleteIds = athleteList.map((athlete) => athlete.id);

          // Get date filters
          const today = new Date();
          let startDate;

          switch (timeFilter) {
            case "today":
              startDate = new Date(today);
              break;
            case "week":
              startDate = new Date(today);
              startDate.setDate(today.getDate() - 7);
              break;
            case "month":
              startDate = new Date(today);
              startDate.setMonth(today.getMonth() - 1);
              break;
            default:
              startDate = new Date(today);
              break;
          }

          const todayStr = today.toISOString().split("T")[0];

          // Readiness check-ins now handled by CoachReadiness component
          // via useCoachReadiness hook (React Query, not direct Supabase)

          // Fetch upcoming workouts
          const { data: workoutsData, error: workoutsError } = await supabase
            .from("workouts")
            .select(`
              id, date, start_time, end_time, workout_type, location, user_id, 
              is_team_training, assigned_by
            `)
            .in("user_id", athleteIds)
            .gte("date", todayStr)
            .order("date")
            .limit(5);

          if (workoutsError) {
            console.error("Error fetching workouts:", workoutsError);
          } else {
            // Enrich workouts with athlete data
            const enrichedWorkouts = workoutsData.map((workout) => {
              const athlete = athleteList.find((a) => a.id === workout.user_id);
              return {
                ...workout,
                athlete_name: athlete
                  ? `${athlete.first_name} ${athlete.last_name}`
                  : "Unknown Athlete",
                avatar_url: athlete?.avatar_url || null,
              };
            });

            setUpcomingWorkouts(enrichedWorkouts);
          }

        }
      } catch (error) {
        console.error("Error in dashboard data fetch:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchDashboardData();
    }
  }, [userId, timeFilter, supabase]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return "No time set";
    return timeString.substring(0, 5); // Extract HH:MM from HH:MM:SS
  };

  // Get workout type label
  const getWorkoutTypeLabel = (type: string) => {
    const workoutTypes = {
      on_ice_training: "On-Ice Training",
      push_start_practice: "Push Start Practice",
      track_walk: "Track Analysis",
      strength_training: "Strength Training",
      sprint_training: "Sprint Training",
      technical_drills: "Technical Drills",
      recovery_session: "Recovery Session",
    };

    return workoutTypes[type as keyof typeof workoutTypes] || type;
  };

  // Get alert icon based on type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "injury":
        return <IconAlertTriangle size={16} color={theme.colors.red[6]} />;
      case "readiness":
        return <IconBell size={16} color={theme.colors.yellow[6]} />;
      case "missed":
        return <IconX size={16} color={theme.colors.orange[6]} />;
      default:
        return <IconBell size={16} />;
    }
  };

  // Handle athlete click
  const handleAthleteClick = (athleteId: string) => {
    router.push(`/athletes/${athleteId}`);
  };

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <Box>
          <Title order={2}>Coach Dashboard</Title>
          <Text c="dimmed">Monitor your athletes' wellbeing and performance</Text>
        </Box>

        <Select
          value={timeFilter}
          onChange={(value) => setTimeFilter(value || "today")}
          leftSection={<IconFilter size={16} />}
          data={[
            { value: "today", label: "Today's Data" },
            { value: "week", label: "Last 7 Days" },
            { value: "month", label: "Last 30 Days" },
          ]}
          styles={{ root: { width: 200 } }}
        />
      </Group>

      <Tabs defaultValue="athletes">
        <Tabs.List mb="md">
          <Tabs.Tab value="athletes" leftSection={<IconUsers size={14} />}>
            Athletes
          </Tabs.Tab>
          <Tabs.Tab value="check-ins" leftSection={<IconClipboardCheck size={14} />}>
            Check-Ins
          </Tabs.Tab>
          <Tabs.Tab value="workouts" leftSection={<IconBarbell size={14} />}>
            Workouts
          </Tabs.Tab>
          <Tabs.Tab
            value="alerts"
            leftSection={<IconAlertTriangle size={14} />}
            rightSection={
              alerts.length > 0 ? (
                <Badge size="xs" p={3}>
                  {alerts.length}
                </Badge>
              ) : null
            }
          >
            Alerts
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="athletes">
          <Stack gap="lg">
            <CoachReadiness />

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Box>
              <Paper p="md" radius="md" withBorder mb="lg">
                <Group justify="space-between" mb="md">
                  <Group>
                    <ThemeIcon size={36} radius="md" color="red">
                      <IconAlertTriangle size={20} />
                    </ThemeIcon>
                    <Text fw={600} size="lg">
                      Alerts
                    </Text>
                  </Group>

                  <Badge>{alerts.length}</Badge>
                </Group>

                <Box>
                  {alerts.length > 0 ? (
                    alerts.slice(0, 5).map((alert) => (
                      <Paper key={alert.id} p="sm" withBorder radius="md" mb="sm">
                        <Group justify="space-between" mb="xs">
                          <Group>
                            {getAlertIcon(alert.type)}
                            <Text fw={500}>{alert.message}</Text>
                          </Group>
                          <Text size="xs" c="dimmed">
                            {formatDate(alert.date)}
                          </Text>
                        </Group>
                        <Text size="sm" c="dimmed">
                          {alert.details}
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

              <Paper p="md" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Group>
                    <ThemeIcon size={36} radius="md" color="orange">
                      <IconTarget size={20} />
                    </ThemeIcon>
                    <Text fw={600} size="lg">
                      Team Performance
                    </Text>
                  </Group>
                </Group>

                <Box>
                  <Group justify="space-between" mb="xs">
                    <Text fw={500}>Average Start Time</Text>
                    <Group gap={4}>
                      <Text>5.24s</Text>
                      <Badge color="green" size="sm">
                        -0.12s
                      </Badge>
                    </Group>
                  </Group>

                  <Group justify="space-between" mb="xs">
                    <Text fw={500}>Team Coordination Score</Text>
                    <Group gap={4}>
                      <Text>7.8/10</Text>
                      <Badge color="green" size="sm">
                        +0.5
                      </Badge>
                    </Group>
                  </Group>

                  <Group justify="space-between" mb="xs">
                    <Text fw={500}>Avg. Weight Room Attendance</Text>
                    <Group gap={4}>
                      <Text>92%</Text>
                      <Badge color="green" size="sm">
                        +4%
                      </Badge>
                    </Group>
                  </Group>

                  <Divider my="sm" />

                  <Group justify="space-between">
                    <Text fw={500}>Next Team Training</Text>
                    <Badge>Tomorrow, 9:00 AM</Badge>
                  </Group>
                </Box>
              </Paper>
            </Box>
          </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="check-ins">
          <CoachReadiness />
        </Tabs.Panel>

        <Tabs.Panel value="workouts">
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Group>
                <ThemeIcon size={36} radius="md" color="orange">
                  <IconCalendarEvent size={20} />
                </ThemeIcon>
                <Text fw={600} size="lg">
                  Upcoming Workouts
                </Text>
              </Group>

              <Button
                size="sm"
                leftSection={<IconBarbell size={16} />}
                onClick={() => router.push("/workouts/create")}
              >
                Assign Workout
              </Button>
            </Group>

            <Table>
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Group</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcomingWorkouts.map((workout) => (
                  <tr key={workout.id}>
                    <td>
                      <Group gap="sm">
                        <Avatar src={workout.avatar_url} radius="xl" size="sm" color="blue">
                          {workout.athlete_name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </Avatar>
                        <Text>{workout.athlete_name}</Text>
                      </Group>
                    </td>
                    <td>
                      <Text fw={500}>{formatDate(workout.date)}</Text>
                      <Text size="xs" c="dimmed">
                        {formatTime(workout.start_time)} - {formatTime(workout.end_time)}
                      </Text>
                    </td>
                    <td>
                      <Badge>{getWorkoutTypeLabel(workout.workout_type)}</Badge>
                    </td>
                    <td>
                      <Text size="sm">{workout.location || "No location set"}</Text>
                    </td>
                    <td>
                      {workout.is_team_training ? (
                        <Badge color="blue">Team</Badge>
                      ) : (
                        <Badge color="gray" variant="outline">
                          Individual
                        </Badge>
                      )}
                    </td>
                    <td>
                      <Group gap={0}>
                        <ActionIcon
                          color="blue"
                          onClick={() => router.push(`/workouts/${workout.id}`)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon color="orange">
                          <IconPencil size={16} />
                        </ActionIcon>
                      </Group>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {upcomingWorkouts.length === 0 && (
              <Text c="dimmed" ta="center" py="xl">
                No upcoming workouts scheduled
              </Text>
            )}

            <Button
              variant="subtle"
              rightSection={<IconArrowRight size={16} />}
              mt="md"
              onClick={() => router.push("/workouts")}
            >
              View All Workouts
            </Button>
          </Paper>
        </Tabs.Panel>

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
                    { value: "injury", label: "Injuries" },
                    { value: "readiness", label: "Low Readiness" },
                    { value: "missed", label: "Missed Check-ins" },
                  ]}
                  defaultValue="all"
                  styles={{ root: { width: 200 } }}
                />

                <Badge size="lg">{alerts.length} Alerts</Badge>
              </Group>
            </Group>

            {alerts.length > 0 ? (
              <SimpleGrid cols={1} spacing="md">
                {alerts.map((alert) => (
                  <Paper key={alert.id} p="md" withBorder radius="md">
                    <Group justify="space-between" mb="xs">
                      <Group>
                        {alert.type === "injury" && (
                          <ThemeIcon color="red" size={28} radius="xl">
                            <IconAlertTriangle size={18} />
                          </ThemeIcon>
                        )}
                        {alert.type === "readiness" && (
                          <ThemeIcon color="yellow" size={28} radius="xl">
                            <IconBell size={18} />
                          </ThemeIcon>
                        )}
                        {alert.type === "missed" && (
                          <ThemeIcon color="orange" size={28} radius="xl">
                            <IconX size={18} />
                          </ThemeIcon>
                        )}
                        <Box>
                          <Text fw={600}>{alert.message}</Text>
                          <Text size="sm" c="dimmed">
                            {formatDate(alert.date)}
                          </Text>
                        </Box>
                      </Group>

                      <Badge
                        color={
                          alert.level === "high"
                            ? "red"
                            : alert.level === "medium"
                              ? "yellow"
                              : "blue"
                        }
                      >
                        {alert.level.charAt(0).toUpperCase() + alert.level.slice(1)} Priority
                      </Badge>
                    </Group>

                    <Text size="sm">{alert.details}</Text>

                    <Group justify="flex-end" mt="sm">
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() => handleAthleteClick(alert.athlete_id)}
                      >
                        View Athlete
                      </Button>
                      <Button variant="light" size="xs">
                        Mark as Resolved
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
