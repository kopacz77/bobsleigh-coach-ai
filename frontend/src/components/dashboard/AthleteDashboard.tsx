import React, { useState, useEffect } from 'react';
import {
  Box,
  Title,
  Text,
  Group,
  Paper,
  Button,
  Tabs,
  SimpleGrid,
  Card,
  Select,
  Stack,
  RingProgress,
  Progress,
  Badge,
  useMantineTheme,
  Divider,
  ActionIcon,
  Tooltip,
  Avatar,
  ThemeIcon
} from '@mantine/core';
import { Calendar, DatePicker, DateValue } from '@mantine/dates';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Bar, BarChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import {
  IconActivity,
  IconBarbell,
  IconChecklist,
  IconHeartbeat,
  IconMedal,
  IconUsers,
  IconArrowRight,
  IconCalendarEvent,
  IconPencil,
  IconStar,
  IconBell,
  IconClockHour4,
  IconChartLine,
  IconDirections,
  IconMapPin,
  IconMoodHappy,
  IconTrophy,
  IconBulb,
  IconCalendarStats,
  IconArrowUp,
  IconArrowDown,
  IconMinus
} from '@tabler/icons-react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

// Type Definitions
interface AthleteProfileProps {
  userId: string;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  position: string;
  team: string;
  coachName: string;
  joinDate: string;
  nextCompetition?: {
    name: string;
    date: string;
    location: string;
  };
}

interface WellbeingData {
  date: string;
  readiness: number;
  sleep_quality: number;
  energy_level: number;
  muscle_soreness: number;
  stress_level: number;
  overall_recovery: number;
  weeklyAverage: number;
  trend: 'up' | 'down' | 'neutral';
}

interface Workout {
  id: string;
  title: string;
  date: string;
  duration: number;
  type: string;
  location: string;
  focus: string;
  status: string;
}

interface WeeklyMetric {
  day: string;
  readiness: number;
  sleep: number;
  energy: number;
  recovery: number;
  workoutIntensity: number;
}

interface PerformanceData {
  currentValues: {
    pushTime: number;
    squatMax: number;
    reaction: number;
    gripStrength: number;
    sprintSpeed: number;
    [key: string]: number;
  };
  targets: {
    pushTime: number;
    squatMax: number;
    reaction: number;
    gripStrength: number;
    sprintSpeed: number;
    [key: string]: number;
  };
  radarData: {
    metric: string;
    value: number;
    fullMark: number;
  }[];
  recentPRs: {
    metric: string;
    value: string;
    date: string;
  }[];
}

interface CalendarEvent {
  date: string;
  type: 'workout' | 'check-in' | 'event';
  intensity?: number;
  completed?: boolean;
  title?: string;
}

interface Goal {
  id: string;
  title: string;
  status: 'in-progress' | 'completed';
  progress: number;
  dueDate: string;
  category: string;
}

interface Notification {
  id: string;
  type: 'reminder' | 'coach' | 'schedule';
  message: string;
  timestamp: string;
  read: boolean;
}

interface PerformanceItem {
  key: string;
  label: string;
  unit: string;
  isLowerBetter: boolean;
  progress: number;
  color: string;
}

/**
 * AthleteDashboard Component
 * Personal dashboard for athletes to view their training schedule,
 * progress, wellbeing metrics, and performance data.
 */
const AthleteDashboard: React.FC<AthleteProfileProps> = ({ userId }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState<boolean>(false);
  const [todayDate] = useState<Date>(new Date());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wellbeingData, setWellbeingData] = useState<WellbeingData | null>(null);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<Workout[]>([]);
  const [weeklyMetrics, setWeeklyMetrics] = useState<WeeklyMetric[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [monthlyCalendarData, setMonthlyCalendarData] = useState<CalendarEvent[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId, supabase]);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      // In a real implementation, these would be actual Supabase queries
      // For this demo, we're mocking the data

      // Mock user profile
      const mockProfile: UserProfile = {
        id: userId,
        firstName: 'Alex',
        lastName: 'Johnson',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=250&q=80',
        position: 'Driver',
        team: 'National Team',
        coachName: 'Sarah Peterson',
        joinDate: '2022-05-15',
        nextCompetition: {
          name: 'World Cup - Winterberg',
          date: '2023-12-12',
          location: 'Germany'
        }
      };

      setUserProfile(mockProfile);

      // Mock wellbeing data (latest check-in)
      const mockWellbeingData: WellbeingData = {
        date: new Date().toISOString(),
        readiness: 8.5,
        sleep_quality: 7,
        energy_level: 8,
        muscle_soreness: 3,
        stress_level: 4,
        overall_recovery: 8,
        weeklyAverage: 7.8,
        trend: 'up'
      };

      setWellbeingData(mockWellbeingData);

      // Mock upcoming workouts
      const mockUpcomingWorkouts: Workout[] = [
        {
          id: '1',
          title: 'Push Start Practice',
          date: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
          duration: 90,
          type: 'push_start_practice',
          location: 'Start Track',
          focus: 'Technique',
          status: 'upcoming'
        },
        {
          id: '2',
          title: 'Strength Training',
          date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
          duration: 75,
          type: 'strength_training',
          location: 'Gym',
          focus: 'Lower Body',
          status: 'upcoming'
        },
        {
          id: '3',
          title: 'Track Analysis',
          date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
          duration: 60,
          type: 'track_walk',
          location: 'Main Track',
          focus: 'Turns 5-10',
          status: 'upcoming'
        },
        {
          id: '4',
          title: 'Team Coordination',
          date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
          duration: 120,
          type: 'on_ice_training',
          location: 'Ice Track',
          focus: 'Loading & Timing',
          status: 'upcoming'
        }
      ];

      setUpcomingWorkouts(mockUpcomingWorkouts);

      // Mock weekly metrics
      const mockWeeklyData: WeeklyMetric[] = [
        {
          day: 'Mon',
          readiness: 7,
          sleep: 8,
          energy: 7,
          recovery: 7,
          workoutIntensity: 6
        },
        {
          day: 'Tue',
          readiness: 8,
          sleep: 7,
          energy: 8,
          recovery: 8,
          workoutIntensity: 7
        },
        {
          day: 'Wed',
          readiness: 6,
          sleep: 6,
          energy: 6,
          recovery: 6,
          workoutIntensity: 8
        },
        {
          day: 'Thu',
          readiness: 7,
          sleep: 8,
          energy: 7,
          recovery: 7,
          workoutIntensity: 5
        },
        {
          day: 'Fri',
          readiness: 9,
          sleep: 9,
          energy: 9,
          recovery: 9,
          workoutIntensity: 7
        },
        {
          day: 'Sat',
          readiness: 8,
          sleep: 7,
          energy: 8,
          recovery: 8,
          workoutIntensity: 9
        },
        {
          day: 'Sun',
          readiness: 7,
          sleep: 8,
          energy: 7,
          recovery: 8,
          workoutIntensity: 3
        },
      ];

      setWeeklyMetrics(mockWeeklyData);

      // Mock performance data
      const mockPerformanceData: PerformanceData = {
        currentValues: {
          pushTime: 5.23,
          squatMax: 165,
          reaction: 0.31,
          gripStrength: 58,
          sprintSpeed: 10.8
        },
        targets: {
          pushTime: 5.0,
          squatMax: 180,
          reaction: 0.25,
          gripStrength: 65,
          sprintSpeed: 11.2
        },
        radarData: [
          { metric: 'Push Time', value: 85, fullMark: 100 },
          { metric: 'Strength', value: 75, fullMark: 100 },
          { metric: 'Speed', value: 90, fullMark: 100 },
          { metric: 'Technique', value: 80, fullMark: 100 },
          { metric: 'Reaction', value: 70, fullMark: 100 },
          { metric: 'Recovery', value: 85, fullMark: 100 },
        ],
        recentPRs: [
          { metric: 'Bench Press', value: '110kg', date: '2023-11-10' },
          { metric: 'Sprint 60m', value: '7.12s', date: '2023-11-05' }
        ]
      };

      setPerformanceData(mockPerformanceData);

      // Mock monthly calendar data (workouts, check-ins, events)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Generate random events for the current month
      const calendarEvents: CalendarEvent[] = [];
      for (let day = 1; day <= 28; day++) {
        // Add some random events
        if (day % 2 === 0) {
          calendarEvents.push({
            date: new Date(currentYear, currentMonth, day).toISOString(),
            type: 'workout',
            intensity: Math.floor(Math.random() * 3) + 1 // 1-3
          });
        }

        if (day % 3 === 0) {
          calendarEvents.push({
            date: new Date(currentYear, currentMonth, day).toISOString(),
            type: 'check-in',
            completed: true
          });
        }

        if (day === 15) {
          calendarEvents.push({
            date: new Date(currentYear, currentMonth, day).toISOString(),
            type: 'event',
            title: 'Team Meeting'
          });
        }
      }

      setMonthlyCalendarData(calendarEvents);

      // Mock goals
      const mockGoals: Goal[] = [
        {
          id: '1',
          title: 'Improve push start time by 0.2s',
          status: 'in-progress',
          progress: 65,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
          category: 'performance'
        },
        {
          id: '2',
          title: 'Consistently sleep 8+ hours nightly',
          status: 'in-progress',
          progress: 80,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
          category: 'recovery'
        },
        {
          id: '3',
          title: 'Perfect loading technique',
          status: 'completed',
          progress: 100,
          dueDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
          category: 'technique'
        }
      ];

      setGoals(mockGoals);

      // Mock notifications
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'reminder',
          message: 'Complete your daily check-in',
          timestamp: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(),
          read: false
        },
        {
          id: '2',
          type: 'coach',
          message: 'Coach left feedback on your session',
          timestamp: new Date(new Date().setHours(new Date().getHours() - 3)).toISOString(),
          read: true
        },
        {
          id: '3',
          type: 'schedule',
          message: 'Tomorrow\'s training rescheduled to 10:00 AM',
          timestamp: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString(),
          read: false
        }
      ];

      setNotifications(mockNotifications);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string, format: 'short' | 'time' | 'full' | 'day' = 'short'): string => {
    const date = new Date(dateString);
    if (format === 'short') {
      return date.toLocaleDateString();
    } else if (format === 'time') {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } else if (format === 'full') {
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } else if (format === 'day') {
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    }
    return date.toLocaleDateString();
  };

  // Get trend indicator
  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <IconArrowUp size={16} color={theme.colors.green[6]} />;
      case 'down':
        return <IconArrowDown size={16} color={theme.colors.red[6]} />;
      default:
        return <IconMinus size={16} color={theme.colors.gray[6]} />;
    }
  };

  // Get progress color
  const getProgressColor = (value: number): string => {
    if (value <= 30) return theme.colors.red[6];
    if (value <= 70) return theme.colors.yellow[6];
    return theme.colors.green[6];
  };

  // Get days until next competition
  const getDaysUntilCompetition = (): number | null => {
    if (!userProfile?.nextCompetition?.date) return null;

    const competitionDate = new Date(userProfile.nextCompetition.date);
    const today = new Date();
    const diffTime = competitionDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Calculate progress percentage based on target and current value
  const calculateProgressPercentage = (current: number, target: number, isLowerBetter = false): number => {
    if (isLowerBetter) {
      // For metrics where lower is better (e.g., sprint time)
      if (current <= target) return 100; // Already achieved target
      const maxValue = target * 1.5; // Assuming 50% worse than target is 0% progress
      return Math.max(0, Math.min(100, 100 - ((current - target) / (maxValue - target) * 100)));
    } else {
      // For metrics where higher is better (e.g., strength)
      if (current >= target) return 100; // Already achieved target
      const minValue = target * 0.5; // Assuming 50% of target is 0% progress
      return Math.max(0, Math.min(100, ((current - minValue) / (target - minValue) * 100)));
    }
  };

  // Filter events on the calendar
  const getCalendarDayEvents = (date: Date): CalendarEvent[] => {
    const dateString = date.toISOString().split('T')[0];
    return monthlyCalendarData.filter(event => {
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      return eventDate === dateString;
    });
  };

  // Render date cell in calendar
  const renderCalendarDay = (date: Date) => {
    const events = getCalendarDayEvents(date);
    if (events.length === 0) return null;

    return (
      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        <div>{date.getDate()}</div>
        <div style={{ position: 'absolute', bottom: 2, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 2 }}>
          {events.map((event, idx) => {
            if (event.type === 'workout') {
              return (
                <div
                  key={idx}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: event.intensity === 3 ? theme.colors.red[6] :
                      event.intensity === 2 ? theme.colors.yellow[6] :
                        theme.colors.green[6]
                  }}
                />
              );
            } else if (event.type === 'check-in') {
              return (
                <div
                  key={idx}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: theme.colors.blue[6]
                  }}
                />
              );
            } else if (event.type === 'event') {
              return (
                <div
                  key={idx}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: theme.colors.violet[6]
                  }}
                />
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  };

  // Render metrics cards
  const renderWellbeingMetrics = () => {
    if (!wellbeingData) return null;

    return (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm" c="dimmed">Training Readiness</Text>
            <Badge size="md" color="blue" variant="light">
              <Group gap={4}>
                <Text>{wellbeingData.readiness}</Text>
                {getTrendIcon(wellbeingData.trend)}
              </Group>
            </Badge>
          </Group>
          <Progress
            value={wellbeingData.readiness * 10}
            color="blue"
            size="xl"
            radius="xl"
            mb="sm"
          />
          <Text size="xs" c="dimmed" ta="center">
            {wellbeingData.readiness >= 8 ? 'Ready for high intensity' :
              wellbeingData.readiness >= 6 ? 'Ready for moderate training' :
                'Recovery focus recommended'}
          </Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm" c="dimmed">Sleep Quality</Text>
            <ThemeIcon color="violet" variant="light" size={24} radius="xl">
              <IconClockHour4 size={16} />
            </ThemeIcon>
          </Group>
          <RingProgress
            sections={[{ value: wellbeingData.sleep_quality * 10, color: theme.colors.violet[6] }]}
            size={80}
            thickness={8}
            label={<Text ta="center" fw={700} size="lg">{wellbeingData.sleep_quality}</Text>}
            mx="auto"
            mb="sm"
          />
          <Text size="xs" c="dimmed" ta="center">/10 rating</Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm" c="dimmed">Energy Level</Text>
            <ThemeIcon color="yellow" variant="light" size={24} radius="xl">
              <IconBulb size={16} />
            </ThemeIcon>
          </Group>
          <RingProgress
            sections={[{ value: wellbeingData.energy_level * 10, color: theme.colors.yellow[6] }]}
            size={80}
            thickness={8}
            label={<Text ta="center" fw={700} size="lg">{wellbeingData.energy_level}</Text>}
            mx="auto"
            mb="sm"
          />
          <Text size="xs" c="dimmed" ta="center">/10 rating</Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm" c="dimmed">Recovery Status</Text>
            <ThemeIcon color="green" variant="light" size={24} radius="xl">
              <IconHeartbeat size={16} />
            </ThemeIcon>
          </Group>
          <RingProgress
            sections={[{ value: wellbeingData.overall_recovery * 10, color: theme.colors.green[6] }]}
            size={80}
            thickness={8}
            label={<Text ta="center" fw={700} size="lg">{wellbeingData.overall_recovery}</Text>}
            mx="auto"
            mb="sm"
          />
          <Text size="xs" c="dimmed" ta="center">/10 rating</Text>
        </Paper>
      </SimpleGrid>
    );
  };

  // Render upcoming workout schedule
  const renderUpcomingWorkouts = () => {
    if (!upcomingWorkouts.length) {
      return (
        <Text c="dimmed" ta="center" py="md">
          No upcoming workouts scheduled.
        </Text>
      );
    }

    return (
      <Stack gap="xs">
        {upcomingWorkouts.slice(0, 4).map(workout => (
          <Card key={workout.id} p="md" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Group gap="sm">
                <ThemeIcon color="blue" variant="light" size={30} radius="xl">
                  <IconBarbell size={18} />
                </ThemeIcon>
                <Box>
                  <Text fw={500}>{workout.title}</Text>
                  <Text size="xs" c="dimmed">{formatDate(workout.date, 'full')}</Text>
                </Box>
              </Group>
              <Group gap={0}>
                <Badge size="md">{workout.duration} min</Badge>
              </Group>
            </Group>
            <Group justify="space-between" mt="xs">
              <Group gap="xs">
                <IconMapPin size={14} color={theme.colors.gray[6]} />
                <Text size="xs" c="dimmed">{workout.location}</Text>
              </Group>
              <Group gap="xs">
                <IconDirections size={14} color={theme.colors.gray[6]} />
                <Text size="xs" c="dimmed">Focus: {workout.focus}</Text>
              </Group>
            </Group>
          </Card>
        ))}
      </Stack>
    );
  };

  // Render weekly metrics chart
  const renderWeeklyMetricsChart = () => {
    if (!weeklyMetrics.length) return null;

    return (
      <Box style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weeklyMetrics} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 10]} />
            <ChartTooltip />
            <Line type="monotone" dataKey="readiness" name="Readiness" stroke={theme.colors.blue[6]} strokeWidth={2} />
            <Line type="monotone" dataKey="sleep" name="Sleep" stroke={theme.colors.violet[6]} strokeWidth={2} />
            <Line type="monotone" dataKey="energy" name="Energy" stroke={theme.colors.yellow[6]} strokeWidth={2} />
            <Line type="monotone" dataKey="recovery" name="Recovery" stroke={theme.colors.green[6]} strokeWidth={2} />
            <Line type="monotone" dataKey="workoutIntensity" name="Workout Intensity" stroke={theme.colors.red[6]} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  // Render performance radar chart
  const renderPerformanceRadar = () => {
    if (!performanceData?.radarData) return null;

    return (
      <Box style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData.radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar name="Performance" dataKey="value" stroke={theme.colors.blue[6]} fill={theme.colors.blue[6]} fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  // Render performance progress
  const renderPerformanceProgress = () => {
    if (!performanceData?.currentValues || !performanceData?.targets) return null;

    const { currentValues, targets } = performanceData;

    const performanceItems: PerformanceItem[] = [
      {
        key: 'pushTime',
        label: 'Push Time',
        unit: 's',
        isLowerBetter: true,
        progress: calculateProgressPercentage(currentValues.pushTime, targets.pushTime, true),
        color: 'blue'
      },
      {
        key: 'squatMax',
        label: 'Squat Max',
        unit: 'kg',
        isLowerBetter: false,
        progress: calculateProgressPercentage(currentValues.squatMax, targets.squatMax),
        color: 'red'
      },
      {
        key: 'reaction',
        label: 'Reaction Time',
        unit: 's',
        isLowerBetter: true,
        progress: calculateProgressPercentage(currentValues.reaction, targets.reaction, true),
        color: 'yellow'
      },
      {
        key: 'gripStrength',
        label: 'Grip Strength',
        unit: 'kg',
        isLowerBetter: false,
        progress: calculateProgressPercentage(currentValues.gripStrength, targets.gripStrength),
        color: 'green'
      },
      {
        key: 'sprintSpeed',
        label: 'Sprint Speed',
        unit: 'm/s',
        isLowerBetter: false,
        progress: calculateProgressPercentage(currentValues.sprintSpeed, targets.sprintSpeed),
        color: 'violet'
      }
    ];

    return (
      <Stack gap="xs">
        {performanceItems.map(item => (
          <Box key={item.key}>
            <Group justify="space-between" mb="xs">
              <Text size="sm">{item.label}</Text>
              <Group gap={4}>
                <Text size="sm">{currentValues[item.key]}</Text>
                <Text size="sm" c="dimmed">{item.unit}</Text>
                <Text size="sm" c="dimmed">/</Text>
                <Text size="sm" c="dimmed">{targets[item.key]} {item.unit}</Text>
              </Group>
            </Group>
            <Progress
              value={item.progress}
              color={theme.colors[item.color][6]}
              size="md"
              radius="xl"
              mb="sm"
            />
          </Box>
        ))}
      </Stack>
    );
  };

  // Render recent personal records
  const renderRecentPRs = () => {
    if (!performanceData?.recentPRs?.length) return null;

    return (
      <Stack gap="xs">
        {performanceData.recentPRs.map((pr, index) => (
          <Group key={index} justify="space-between">
            <Group gap="xs">
              <ThemeIcon color="yellow" variant="light" size={24} radius="xl">
                <IconStar size={16} />
              </ThemeIcon>
              <Text>{pr.metric}</Text>
            </Group>
            <Badge color="yellow" variant="light">
              <Group gap={4}>
                <Text>{pr.value}</Text>
                <Text c="dimmed">({formatDate(pr.date)})</Text>
              </Group>
            </Badge>
          </Group>
        ))}
      </Stack>
    );
  };

  // Render goals
  const renderGoals = () => {
    if (!goals.length) {
      return (
        <Text c="dimmed" ta="center" py="md">
          No goals set yet.
        </Text>
      );
    }

    return (
      <Stack gap="xs">
        {goals.map(goal => (
          <Card key={goal.id} p="md" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Group gap="sm">
                <ThemeIcon
                  color={goal.status === 'completed' ? 'green' : 'blue'}
                  variant={goal.status === 'completed' ? 'filled' : 'light'}
                  size={30}
                  radius="xl"
                >
                  <IconTrophy size={18} />
                </ThemeIcon>
                <Text fw={500}>{goal.title}</Text>
              </Group>
              <Badge color={goal.status === 'completed' ? 'green' : 'blue'}>
                {goal.status === 'completed' ? 'Completed' : 'In Progress'}
              </Badge>
            </Group>
            <Progress
              value={goal.progress}
              color={getProgressColor(goal.progress)}
              size="md"
              mb="xs"
              radius="xl"
            />
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Category: {goal.category}</Text>
              {goal.status !== 'completed' && (
                <Text size="xs" c="dimmed">Due: {formatDate(goal.dueDate)}</Text>
              )}
            </Group>
          </Card>
        ))}
      </Stack>
    );
  };

  // Render notifications
  const renderNotifications = () => {
    if (!notifications.length) {
      return (
        <Text c="dimmed" ta="center" py="md">
          No notifications.
        </Text>
      );
    }

    return (
      <Stack gap="xs">
        {notifications.map(notification => {
          const notificationIcon = {
            'reminder': <IconBell size={16} />,
            'coach': <IconUsers size={16} />,
            'schedule': <IconCalendarEvent size={16} />,
          }[notification.type] || <IconBell size={16} />;

          const notificationColor = {
            'reminder': 'yellow',
            'coach': 'blue',
            'schedule': 'green',
          }[notification.type] || 'gray';

          return (
            <Group key={notification.id} justify="space-between">
              <Group gap="sm">
                <ThemeIcon color={notificationColor} variant="light" size={24} radius="xl">
                  {notificationIcon}
                </ThemeIcon>
                <Box>
                  <Text size="sm">{notification.message}</Text>
                  <Text size="xs" c="dimmed">{new Date(notification.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</Text>
                </Box>
              </Group>
              {!notification.read && (
                <Badge color="red" variant="dot" size="sm">New</Badge>
              )}
            </Group>
          );
        })}
      </Stack>
    );
  };

  return (
    <Box>
      <Paper p="md" radius="md" withBorder mb="xl">
        <Group justify="space-between" mb="xl">
          <Group>
            {userProfile && (
              <Avatar src={userProfile.avatar} size={50} radius={50} />
            )}
            <Box>
              <Title order={2}>Athlete Dashboard</Title>
              <Text c="dimmed">
                {userProfile ? `${userProfile.firstName} ${userProfile.lastName} | ${userProfile.position}` : 'Loading...'}
              </Text>
            </Box>
          </Group>

          {userProfile?.nextCompetition && (
            <Card p="sm" radius="md" withBorder>
              <Group gap="sm">
                <ThemeIcon color="red" variant="light" size={38} radius="md">
                  <IconMedal size={20} />
                </ThemeIcon>
                <Box>
                  <Text fw={500}>{userProfile.nextCompetition.name}</Text>
                  <Group gap={4}>
                    <Text size="xs" c="dimmed">{formatDate(userProfile.nextCompetition.date)}</Text>
                    <Text size="xs" c="dimmed">•</Text>
                    <Text size="xs" c="dimmed">{userProfile.nextCompetition.location}</Text>
                  </Group>
                </Box>
                <Badge color="red" size="lg">{getDaysUntilCompetition()} days</Badge>
              </Group>
            </Card>
          )}
        </Group>

        {renderWellbeingMetrics()}

        <Box mt="xl">
          <Tabs defaultValue="dashboard">
            <Tabs.List mb="md">
              <Tabs.Tab value="dashboard" leftSection={<IconActivity size={16} />}>Dashboard</Tabs.Tab>
              <Tabs.Tab value="calendar" leftSection={<IconCalendarStats size={16} />}>Calendar</Tabs.Tab>
              <Tabs.Tab value="performance" leftSection={<IconChartLine size={16} />}>Performance</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="dashboard">
              <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                <Stack gap="lg">
                  <Paper p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="md">
                      <Text fw={600} size="lg">Upcoming Workouts</Text>
                      <Button variant="subtle" rightSection={<IconArrowRight size={16} />} size="xs">View All</Button>
                    </Group>
                    {renderUpcomingWorkouts()}
                  </Paper>

                  <Paper p="md" radius="md" withBorder>
                    <Text fw={600} size="lg" mb="md">Weekly Metrics</Text>
                    {renderWeeklyMetricsChart()}
                  </Paper>
                </Stack>

                <Stack gap="lg">
                  <Paper p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="md">
                      <Text fw={600} size="lg">Goals</Text>
                      <Button variant="subtle" rightSection={<IconArrowRight size={16} />} size="xs">View All</Button>
                    </Group>
                    {renderGoals()}
                  </Paper>

                  <Paper p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="md">
                      <Text fw={600} size="lg">Today's Check-in</Text>
                      <Button variant="filled" size="xs">Complete</Button>
                    </Group>
                    {!wellbeingData ? (
                      <Text c="dimmed" ta="center" py="md">
                        You haven't completed your daily check-in yet.
                      </Text>
                    ) : (
                      <Text c="dimmed" ta="center" py="md">
                        You've completed your daily check-in at {formatDate(wellbeingData.date, 'time')}.
                      </Text>
                    )}
                  </Paper>

                  <Paper p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="md">
                      <Text fw={600} size="lg">Notifications</Text>
                      <Text size="xs" c="dimmed">{notifications.filter(n => !n.read).length} unread</Text>
                    </Group>
                    {renderNotifications()}
                  </Paper>
                </Stack>
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="calendar">
              <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
                <Paper p="md" radius="md" withBorder style={{ gridColumn: 'span 2' }}>
                  <Text fw={600} size="lg" mb="md">Monthly Schedule</Text>
                  <Calendar
                    size="lg"
                    w="100%"
                    renderDay={renderCalendarDay}
                  />
                  <Group justify="center" mt="sm" gap="xs">
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.colors.green[6] }} />
                      <Text size="xs">Light Workout</Text>
                    </Box>
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.colors.yellow[6] }} />
                      <Text size="xs">Medium Workout</Text>
                    </Box>
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.colors.red[6] }} />
                      <Text size="xs">Intense Workout</Text>
                    </Box>
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.colors.blue[6] }} />
                      <Text size="xs">Check-in</Text>
                    </Box>
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.colors.violet[6] }} />
                      <Text size="xs">Event</Text>
                    </Box>
                  </Group>
                </Paper>

                <Stack gap="lg">
                  <Paper p="md" radius="md" withBorder>
                    <Text fw={600} size="lg" mb="md">Today's Schedule</Text>
                    {upcomingWorkouts.filter(workout => {
                      const workoutDate = new Date(workout.date).toDateString();
                      const today = new Date().toDateString();
                      return workoutDate === today;
                    }).length ? (
                      renderUpcomingWorkouts()
                    ) : (
                      <Text c="dimmed" ta="center" py="md">
                        No workouts scheduled for today.
                      </Text>
                    )}
                  </Paper>

                  <Paper p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="md">
                      <Text fw={600} size="lg">Weekly Overview</Text>
                      <Select
                        placeholder="This Week"
                        data={[
                          { value: 'this-week', label: 'This Week' },
                          { value: 'next-week', label: 'Next Week' },
                          { value: 'previous-week', label: 'Previous Week' }
                        ]}
                        defaultValue="this-week"
                        style={{ width: 130 }}
                      />
                    </Group>
                    <Stack gap="xs">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                        const isToday = new Date().getDay() === (index + 1) % 7;
                        return (
                          <Group key={day} justify="space-between" p="xs" bg={isToday ? 'blue.0' : undefined} style={{ borderRadius: 4 }}>
                            <Text fw={isToday ? 500 : 400}>{day}</Text>
                            <Badge color={weeklyMetrics[index].workoutIntensity > 7 ? 'red' :
                              weeklyMetrics[index].workoutIntensity > 4 ? 'yellow' :
                                weeklyMetrics[index].workoutIntensity > 0 ? 'green' : 'gray'}
                            >
                              {weeklyMetrics[index].workoutIntensity > 0 ?
                                `${weeklyMetrics[index].workoutIntensity}/10` : 'Rest'}
                            </Badge>
                          </Group>
                        );
                      })}
                    </Stack>
                  </Paper>
                </Stack>
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="performance">
              <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                <Paper p="md" radius="md" withBorder>
                  <Text fw={600} size="lg" mb="md">Performance Overview</Text>
                  {renderPerformanceRadar()}
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Text fw={600} size="lg" mb="md">Progress to Targets</Text>
                  {renderPerformanceProgress()}
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Group justify="space-between" mb="md">
                    <Text fw={600} size="lg">Recent Personal Records</Text>
                    <Button variant="subtle" rightSection={<IconArrowRight size={16} />} size="xs">View All</Button>
                  </Group>
                  {renderRecentPRs()}
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Group justify="space-between" mb="md">
                    <Text fw={600} size="lg">Performance Tests</Text>
                    <Button variant="subtle" rightSection={<IconArrowRight size={16} />} size="xs">Schedule Test</Button>
                  </Group>
                  <Box>
                    {/* Placeholder for performance tests */}
                    <Text c="dimmed" ta="center" py="md">
                      No upcoming performance tests scheduled.
                    </Text>
                  </Box>
                </Paper>
              </SimpleGrid>
            </Tabs.Panel>
          </Tabs>
        </Box>
      </Paper>
    </Box>
  );
};

export default AthleteDashboard;