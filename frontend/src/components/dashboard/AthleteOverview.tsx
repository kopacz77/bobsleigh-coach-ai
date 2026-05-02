import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Text,
  ThemeIcon,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useSupabase } from '@/providers/SupabaseProvider';
import {
  IconArrowRight,
  IconAward,
  IconBarbell,
  IconBolt,
  IconCalendarEvent,
  IconChartLine,
  IconCheckbox,
  IconClipboardText,
  IconClock,
  IconPercentage,
  IconRun,
  IconTarget,
  IconTrophy,
  IconUser,
} from "@tabler/icons-react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { DailyCheckIn } from "../check-in";

/**
 * AthleteOverview component serves as the main dashboard for athletes
 * to see their training status, upcoming sessions, and quick access to key features
 */
interface AthleteOverviewProps {
  userId: string;
  userProfile: any;
}

const AthleteOverview = ({ userId, userProfile }: AthleteOverviewProps) => {
  const theme = useMantineTheme();
  const router = useRouter();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const [todayCheckIn, setTodayCheckIn] = useState<any>(null);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<any[]>([]);
  const [recentPerformance, setRecentPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckIn, setShowCheckIn] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!supabase) return;
      setLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];

        // Fetch today's check-in
        const { data: checkInData, error: checkInError } = await supabase
          .from("daily_checkins")
          .select("*")
          .eq("user_id", userId)
          .eq("date", today)
          .single();

        if (checkInError && checkInError.code !== "PGRST116") {
          console.error("Error fetching check-in:", checkInError);
        }

        setTodayCheckIn(checkInData || null);

        // Fetch upcoming workouts
        const { data: workoutsData, error: workoutsError } = await supabase
          .from("workouts")
          .select("*")
          .eq("user_id", userId)
          .gte("date", today)
          .order("date")
          .limit(3);

        if (workoutsError) {
          console.error("Error fetching workouts:", workoutsError);
        }

        setUpcomingWorkouts(workoutsData || []);

        // Fetch recent performance data
        const { data: performanceData, error: performanceError } = await supabase
          .from("performance_assessments")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .limit(1);

        if (performanceError) {
          console.error("Error fetching performance data:", performanceError);
        }

        setRecentPerformance(performanceData && performanceData[0] ? performanceData[0] : null);
      } catch (error) {
        console.error("Error in dashboard data fetch:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchDashboardData();
    }
  }, [userId, supabase]);

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
    const workoutTypes: Record<string, string> = {
      on_ice_training: "On-Ice Training",
      push_start_practice: "Push Start Practice",
      track_walk: "Track Analysis",
      strength_training: "Strength Training",
      sprint_training: "Sprint Training",
      technical_drills: "Technical Drills",
      recovery_session: "Recovery Session",
    };

    return workoutTypes[type] || type;
  };

  // Get progress color based on value
  const getProgressColor = (value: number) => {
    if (value < 30) return theme.colors.red[6];
    if (value < 70) return theme.colors.yellow[6];
    return theme.colors.green[6];
  };

  // Get training readiness badge color
  const getReadinessColor = (status: string) => {
    switch (status) {
      case "ready":
        return "green";
      case "limited":
        return "yellow";
      case "recovery":
        return "orange";
      case "not_ready":
        return "red";
      default:
        return "blue";
    }
  };

  // Get training readiness label
  const getReadinessLabel = (status: string) => {
    switch (status) {
      case "ready":
        return "Ready to Train";
      case "limited":
        return "Limited Training";
      case "recovery":
        return "Recovery Needed";
      case "not_ready":
        return "Not Ready to Train";
      default:
        return "Unknown";
    }
  };

  // Navigate to check-in page
  const handleGoToCheckIn = () => {
    router.push("/check-in");
  };

  // Navigate to weekly review page
  const handleGoToWeeklyReview = () => {
    router.push("/weekly-review");
  };

  // Navigate to workouts page
  const handleGoToWorkouts = () => {
    router.push("/workouts");
  };

  // Toggle check-in form visibility
  const toggleCheckIn = () => {
    setShowCheckIn(!showCheckIn);
  };

  return (
    <Box>
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
        <Box>
          <Paper p="md" radius="md" withBorder mb="lg">
            <Group justify="space-between" mb="md">
              <Group>
                <ThemeIcon size={40} radius="md" color="blue">
                  <IconUser size={24} />
                </ThemeIcon>
                <Box>
                  <Text size="xl" fw={700}>
                    {userProfile?.firstName} {userProfile?.lastName}
                  </Text>
                  <Text c="dimmed" size="sm">
                    Bobsleigh Athlete{" "}
                    {userProfile?.role === "athlete" ? "" : `• ${userProfile?.role}`}
                  </Text>
                </Box>
              </Group>

              {todayCheckIn ? (
                <Badge
                  size="lg"
                  color={getReadinessColor(todayCheckIn.training_readiness)}
                  variant="filled"
                >
                  {getReadinessLabel(todayCheckIn.training_readiness)}
                </Badge>
              ) : (
                <Button
                  onClick={toggleCheckIn}
                  leftSection={<IconClipboardText size={20} />}
                  variant="light"
                >
                  {showCheckIn ? "Hide Check-In" : "Quick Check-In"}
                </Button>
              )}
            </Group>

            {showCheckIn && !todayCheckIn && (
              <Box mb="md">
                <DailyCheckIn userId={userId} />
              </Box>
            )}

            {!showCheckIn && (
              <>
                <Text fw={500} mb="xs">
                  Current Training Phase
                </Text>
                <Group justify="space-between" mb="lg">
                  <Badge size="lg" color="orange" variant="filled">
                    Competition Season
                  </Badge>
                  <Text size="sm" c="dimmed">
                    Week 4 of 12
                  </Text>
                </Group>

                <Group grow mb="md">
                  <Box>
                    <Text fw={500} mb="xs">
                      Next Competition
                    </Text>
                    <Group gap={6}>
                      <IconCalendarEvent size={16} color={theme.colors.blue[6]} />
                      <Text>Mar 23 - World Cup Round 6</Text>
                    </Group>
                  </Box>

                  <Box>
                    <Text fw={500} mb="xs">
                      Recent Performance
                    </Text>
                    <Group gap={6}>
                      <IconChartLine size={16} color={theme.colors.green[6]} />
                      <Text>Start Time: 5.12s (↓0.08s)</Text>
                    </Group>
                  </Box>
                </Group>

                <Divider my="md" />

                <Text fw={500} mb="xs">
                  Weekly Goals Progress
                </Text>
                <SimpleGrid cols={3} mb="md">
                  <Box>
                    <Group justify="space-between" mb={5}>
                      <Group gap={6}>
                        <IconBolt size={16} color={theme.colors.yellow[6]} />
                        <Text size="sm">Start Speed</Text>
                      </Group>
                      <Text size="sm" fw={500}>
                        75%
                      </Text>
                    </Group>
                    <Progress value={75} color="yellow" size="md" radius="xl" />
                  </Box>

                  <Box>
                    <Group justify="space-between" mb={5}>
                      <Group gap={6}>
                        <IconBarbell size={16} color={theme.colors.red[6]} />
                        <Text size="sm">Power Clean</Text>
                      </Group>
                      <Text size="sm" fw={500}>
                        60%
                      </Text>
                    </Group>
                    <Progress value={60} color="red" size="md" radius="xl" />
                  </Box>

                  <Box>
                    <Group justify="space-between" mb={5}>
                      <Group gap={6}>
                        <IconRun size={16} color={theme.colors.blue[6]} />
                        <Text size="sm">Technique</Text>
                      </Group>
                      <Text size="sm" fw={500}>
                        90%
                      </Text>
                    </Group>
                    <Progress value={90} color="blue" size="md" radius="xl" />
                  </Box>
                </SimpleGrid>
              </>
            )}
          </Paper>

          <Paper p="md" radius="md" withBorder mb="lg">
            <Group justify="space-between" mb="md">
              <Group>
                <ThemeIcon size={36} radius="md" color="orange">
                  <IconCalendarEvent size={20} />
                </ThemeIcon>
                <Text fw={600} size="lg">
                  Upcoming Training
                </Text>
              </Group>

              <Button
                variant="subtle"
                rightSection={<IconArrowRight size={16} />}
                onClick={handleGoToWorkouts}
              >
                View All
              </Button>
            </Group>

            {upcomingWorkouts.length > 0 ? (
              <Box>
                {upcomingWorkouts.map((workout, index) => (
                  <Paper
                    key={workout.id}
                    p="sm"
                    withBorder={index !== 0}
                    radius="md"
                    mb="sm"
                    style={index === 0 ? { backgroundColor: theme.colors.blue[0] } : {}}
                  >
                    <Group justify="space-between">
                      <Box>
                        <Group gap={6} mb={2}>
                          <IconCalendarEvent size={16} />
                          <Text fw={500}>{formatDate(workout.date)}</Text>
                        </Group>
                        <Group gap={6}>
                          <IconClock size={16} />
                          <Text size="sm">
                            {formatTime(workout.start_time)} - {formatTime(workout.end_time)}
                          </Text>
                        </Group>
                      </Box>

                      <Box>
                        <Badge mb={2}>{getWorkoutTypeLabel(workout.workout_type)}</Badge>
                        <Text size="sm" ta="right">
                          {workout.location || "No location set"}
                        </Text>
                      </Box>
                    </Group>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                No upcoming training sessions scheduled
              </Text>
            )}

            <Button
              fullWidth
              leftSection={<IconCalendarEvent size={16} />}
              mt="md"
              variant="light"
              onClick={handleGoToWorkouts}
            >
              Schedule Training
            </Button>
          </Paper>
        </Box>

        <Box>
          <Paper p="md" radius="md" withBorder mb="lg">
            <Text fw={600} size="lg" mb="lg">
              Quick Actions
            </Text>

            <Button
              fullWidth
              leftSection={<IconClipboardText size={20} />}
              mb="md"
              disabled={todayCheckIn !== null}
              onClick={handleGoToCheckIn}
            >
              {todayCheckIn ? "Daily Check-In Completed" : "Complete Daily Check-In"}
            </Button>

            <Button
              fullWidth
              leftSection={<IconTarget size={20} />}
              mb="md"
              variant="outline"
              onClick={handleGoToWeeklyReview}
            >
              Weekly Performance Review
            </Button>

            <Button
              fullWidth
              leftSection={<IconBarbell size={20} />}
              mb="md"
              variant="outline"
              onClick={() => router.push("/workouts/log")}
            >
              Log Training Session
            </Button>

            <Button
              fullWidth
              leftSection={<IconChartLine size={20} />}
              variant="outline"
              onClick={() => router.push("/performance")}
            >
              Record Performance Metrics
            </Button>
          </Paper>

          <Paper p="md" radius="md" withBorder mb="lg">
            <Group justify="space-between" mb="md">
              <Group>
                <ThemeIcon size={36} radius="md" color="green">
                  <IconCheckbox size={20} />
                </ThemeIcon>
                <Text fw={600} size="lg">
                  Weekly Overview
                </Text>
              </Group>
            </Group>

            <Box mb="md">
              <Group justify="space-between" mb={5}>
                <Text>Check-ins Completed</Text>
                <Badge>3/7</Badge>
              </Group>
              <Progress value={(3 / 7) * 100} color="blue" size="md" radius="xl" />
            </Box>

            <Box mb="md">
              <Group justify="space-between" mb={5}>
                <Text>Training Sessions</Text>
                <Badge>4/5</Badge>
              </Group>
              <Progress value={(4 / 5) * 100} color="green" size="md" radius="xl" />
            </Box>

            <Box mb="md">
              <Group justify="space-between" mb={5}>
                <Text>Recovery Sessions</Text>
                <Badge>1/2</Badge>
              </Group>
              <Progress value={(1 / 2) * 100} color="orange" size="md" radius="xl" />
            </Box>

            <Button
              fullWidth
              variant="light"
              leftSection={<IconTrophy size={16} />}
              onClick={handleGoToWeeklyReview}
            >
              Complete Weekly Review
            </Button>
          </Paper>

          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Group>
                <ThemeIcon size={36} radius="md" color="violet">
                  <IconAward size={20} />
                </ThemeIcon>
                <Text fw={600} size="lg">
                  Season Goals
                </Text>
              </Group>

              <ActionIcon color="blue" variant="subtle">
                <IconArrowRight size={18} />
              </ActionIcon>
            </Group>

            <Box mb="md">
              <Group justify="space-between" mb={5}>
                <Text>Reduce Start Time</Text>
                <Text fw={500} size="sm">
                  5.12s / 5.00s
                </Text>
              </Group>
              <Progress value={76} color={getProgressColor(76)} size="md" radius="xl" />
            </Box>

            <Box mb="md">
              <Group justify="space-between" mb={5}>
                <Text>Power Clean Max</Text>
                <Text fw={500} size="sm">
                  110kg / 120kg
                </Text>
              </Group>
              <Progress value={92} color={getProgressColor(92)} size="md" radius="xl" />
            </Box>

            <Box mb="md">
              <Group justify="space-between" mb={5}>
                <Text>World Cup Qualification</Text>
                <Text fw={500} size="sm">
                  2/3 Criteria Met
                </Text>
              </Group>
              <Progress value={67} color={getProgressColor(67)} size="md" radius="xl" />
            </Box>
          </Paper>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default AthleteOverview;
