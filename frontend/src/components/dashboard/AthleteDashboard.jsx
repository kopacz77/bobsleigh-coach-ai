import React, { useState, useEffect } from 'react';
import {
  Box,
  Title,
  Text,
  Group,
  Paper,
  Button,
  SimpleGrid,
  Card,
  Stack,
  RingProgress,
  Progress,
  Divider,
  useMantineTheme,
  Badge,
  ActionIcon,
  Menu,
  ThemeIcon,
  Avatar,
  Timeline
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  IconHeartbeat, // workout
  IconUser, // profile
  IconClipboardCheck, // check-in
  IconNotes, // review
  IconChartLine, // progress
  IconTrophy, // goals
  IconCalendarEvent, // calendar
  IconBell, // notifications
  IconArrowRight,
  IconBarbell,
  IconHeartFilled,
  IconWeight,
  IconRun,
  IconArrowUp,
  IconArrowDown,
  IconDots,
  IconPencil,
  IconSettings,
  IconStethoscope,
  IconZzz,
  IconHourglassHigh,
  IconSchool,
  IconBook
} from '@tabler/icons-react';

/**
 * AthleteDashboard Component
 * Personalized dashboard for athletes showing their training schedule,
 * wellbeing metrics, progress, and reminders.
 */
const AthleteDashboard = ({ userId }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userProfile, setUserProfile] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    readinessScore: 0,
    workoutsCompleted: 0,
    currentStreak: 0,
    checkInCompliance: 0,
    pendingWorkouts: [],
    recentCheckIns: [],
    upcomingEvents: [],
    performanceMetrics: [],
    weeklyTrainingLoad: 0,
    personalRecords: [],
    goals: [],
    notifications: []
  });

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [supabase, selectedDate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // In a real implementation, these would be actual Supabase queries
      // Mocking the data for demonstration purposes
      
      // Mock user profile
      const mockUserProfile = {
        id: userId || '1',
        firstName: 'Alex',
        lastName: 'Johnson',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        team: 'National Team',
        position: 'Driver',
        coach: 'Sarah Williams',
        joinDate: '2022-05-15'
      };
      
      setUserProfile(mockUserProfile);
      
      // Mock dashboard data
      const mockDashboardData = {
        readinessScore: 8.5,
        workoutsCompleted: 18,
        currentStreak: 5,
        checkInCompliance: 92,
        pendingWorkouts: [
          {
            id: '1',
            title: 'Sprint Training',
            scheduledTime: '09:00 AM',
            duration: 60,
            type: 'sprint_training'
          },
          {
            id: '2',
            title: 'Weight Room',
            scheduledTime: '02:00 PM',
            duration: 90,
            type: 'strength_training'
          }
        ],
        recentCheckIns: [
          {
            date: '2023-11-15',
            readiness: 9,
            sleep: 8,
            energy: 9,
            soreness: 3
          },
          {
            date: '2023-11-14',
            readiness: 7,
            sleep: 6,
            energy: 7,
            soreness: 5
          },
          {
            date: '2023-11-13',
            readiness: 8,
            sleep: 7,
            energy: 8,
            soreness: 4
          },
          {
            date: '2023-11-12',
            readiness: 9,
            sleep: 9,
            energy: 8,
            soreness: 2
          },
          {
            date: '2023-11-11',
            readiness: 8,
            sleep: 8,
            energy: 7,
            soreness: 3
          },
          {
            date: '2023-11-10',
            readiness: 7,
            sleep: 7,
            energy: 6,
            soreness: 4
          },
          {
            date: '2023-11-09',
            readiness: 8,
            sleep: 7,
            energy: 8,
            soreness: 3
          }
        ],
        upcomingEvents: [
          {
            id: '1',
            title: 'Team Training Camp',
            date: '2023-12-05',
            location: 'Lake Placid, NY',
            type: 'camp'
          },
          {
            id: '2',
            title: 'World Cup Race 1',
            date: '2023-12-15',
            location: 'Winterberg, Germany',
            type: 'competition'
          },
          {
            id: '3',
            title: 'Performance Testing',
            date: '2023-11-25',
            location: 'National Training Center',
            type: 'testing'
          }
        ],
        performanceMetrics: [
          {
            name: 'Push Time (s)',
            value: 5.12,
            change: -0.05,
            goal: 5.05,
            unit: 's'
          },
          {
            name: 'Squat 1RM (kg)',
            value: 142,
            change: 7,
            goal: 150,
            unit: 'kg'
          },
          {
            name: 'Sprint 30m (s)',
            value: 4.03,
            change: -0.08,
            goal: 3.95,
            unit: 's'
          },
          {
            name: 'Broad Jump (cm)',
            value: 282,
            change: 4,
            goal: 290,
            unit: 'cm'
          }
        ],
        weeklyTrainingLoad: [
          { day: 'Mon', planned: 700, actual: 650 },
          { day: 'Tue', planned: 800, actual: 800 },
          { day: 'Wed', planned: 600, actual: 550 },
          { day: 'Thu', planned: 800, actual: 800 },
          { day: 'Fri', planned: 700, actual: 720 },
          { day: 'Sat', planned: 300, actual: 300 },
          { day: 'Sun', planned: 200, actual: 180 }
        ],
        personalRecords: [
          { name: 'Squat 1RM', value: '142 kg', date: '2023-10-25' },
          { name: 'Push Start Time', value: '5.12 s', date: '2023-11-10' },
          { name: 'Power Clean', value: '115 kg', date: '2023-09-18' },
          { name: 'Broad Jump', value: '282 cm', date: '2023-10-02' }
        ],
        goals: [
          { id: '1', text: 'Improve push time to 5.0s', progress: 80, dueDate: '2023-12-31', priority: 'high' },
          { id: '2', text: 'Increase squat 1RM to 150kg', progress: 65, dueDate: '2023-12-15', priority: 'medium' },
          { id: '3', text: 'Perfect loading technique', progress: 50, dueDate: '2023-11-30', priority: 'high' },
          { id: '4', text: 'Improve driving line in turn 4', progress: 40, dueDate: '2023-12-20', priority: 'medium' }
        ],
        notifications: [
          { id: '1', type: 'reminder', message: 'Complete your daily check-in', time: '2 hours ago', read: false },
          { id: '2', type: 'coach', message: 'Coach added comments to your training plan', time: '1 day ago', read: true },
          { id: '3', type: 'system', message: 'Weekly review now available', time: '2 days ago', read: false },
          { id: '4', type: 'achievement', message: 'New personal record: Squat 1RM!', time: '5 days ago', read: true }
        ]
      };
      
      setDashboardData(mockDashboardData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to daily check-in
  const navigateToCheckIn = () => {
    // In a real app this would use router navigation
    console.log('Navigate to daily check-in');
  };

  // Navigate to weekly review
  const navigateToWeeklyReview = () => {
    // In a real app this would use router navigation
    console.log('Navigate to weekly review');
  };

  // Start a workout
  const startWorkout = (workoutId) => {
    // In a real app this would navigate to the workout page
    console.log(`Starting workout ${workoutId}`);
  };

  // View notifications
  const viewAllNotifications = () => {
    // In a real app this would navigate to notifications page
    console.log('View all notifications');
  };

  // Mark notification as read
  const markNotificationAsRead = (notificationId) => {
    setDashboardData(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    }));
  };

  // Get a color based on metric change (positive is good for most metrics, except timed ones where lower is better)
  const getMetricChangeColor = (metricName, change) => {
    const isTimedMetric = metricName.toLowerCase().includes('time') || metricName.toLowerCase().includes('sprint');
    
    if (isTimedMetric) {
      return change < 0 ? theme.colors.green[6] : change > 0 ? theme.colors.red[6] : theme.colors.gray[6];
    } else {
      return change > 0 ? theme.colors.green[6] : change < 0 ? theme.colors.red[6] : theme.colors.gray[6];
    }
  };

  // Calculate percentage to goal
  const calculateGoalProgress = (metric) => {
    const isTimedMetric = metric.name.toLowerCase().includes('time') || metric.name.toLowerCase().includes('sprint');
    
    if (isTimedMetric) {
      // For timed metrics, lower is better
      const startValue = metric.value + metric.change; // Previous value
      const totalChange = startValue - metric.goal; // Total change needed
      const currentChange = startValue - metric.value; // Current change achieved
      return Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
    } else {
      // For other metrics, higher is better
      return Math.min(100, Math.max(0, (metric.value / metric.goal) * 100));
    }
  };

  // Calculate weekly training load summary
  const getTrainingLoadSummary = () => {
    const totalPlanned = dashboardData.weeklyTrainingLoad.reduce((sum, day) => sum + day.planned, 0);
    const totalActual = dashboardData.weeklyTrainingLoad.reduce((sum, day) => sum + day.actual, 0);
    const completion = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
    
    return {
      totalPlanned,
      totalActual,
      completion: Math.round(completion)
    };
  };

  const trainingLoadSummary = getTrainingLoadSummary();

  // Prepare the check-in data for the chart
  const prepareCheckInData = () => {
    return dashboardData.recentCheckIns.map(checkIn => ({
      date: new Date(checkIn.date).toLocaleDateString('en-US', { weekday: 'short' }),
      readiness: checkIn.readiness,
      sleep: checkIn.sleep,
      energy: checkIn.energy,
      soreness: checkIn.soreness
    })).reverse();
  };

  // Function to determine readiness status text and color
  const getReadinessStatus = (score) => {
    if (score >= 8) return { text: 'Ready for high intensity', color: 'green' };
    if (score >= 6) return { text: 'Ready for moderate training', color: 'blue' };
    if (score >= 4) return { text: 'Light training advised', color: 'yellow' };
    return { text: 'Recovery day recommended', color: 'red' };
  };

  const readinessStatus = getReadinessStatus(dashboardData.readinessScore);

  // Notification dot for unread notifications
  const hasUnreadNotifications = dashboardData.notifications.some(notification => !notification.read);

  // Get icon for workout type
  const getWorkoutTypeIcon = (type) => {
    switch (type) {
      case 'sprint_training':
        return <IconRun size={18} />;
      case 'strength_training':
        return <IconBarbell size={18} />;
      case 'recovery_session':
        return <IconHeartFilled size={18} />;
      case 'technical_drills':
        return <IconSchool size={18} />;
      default:
        return <IconHeartbeat size={18} />;
    }
  };

  // Get icon for event type
  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'competition':
        return <IconTrophy size={18} />;
      case 'camp':
        return <IconUsers size={18} />;
      case 'testing':
        return <IconStethoscope size={18} />;
      default:
        return <IconCalendarEvent size={18} />;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Render notification item
  const renderNotificationItem = (notification) => {
    const getNotificationIcon = (type) => {
      switch (type) {
        case 'reminder':
          return <IconBell size={18} />;
        case 'coach':
          return <IconUser size={18} />;
        case 'system':
          return <IconSettings size={18} />;
        case 'achievement':
          return <IconTrophy size={18} />;
        default:
          return <IconBell size={18} />;
      }
    };

    return (
      <Group key={notification.id} position="apart" py="xs" px="sm" style={{ 
        backgroundColor: notification.read ? 'transparent' : theme.colors.blue[0],
        borderRadius: theme.radius.sm
      }}>
        <Group>
          <ThemeIcon size="md" radius="xl" variant="light">
            {getNotificationIcon(notification.type)}
          </ThemeIcon>
          <Box>
            <Text size="sm">{notification.message}</Text>
            <Text size="xs" color="dimmed">{notification.time}</Text>
          </Box>
        </Group>
        {!notification.read && (
          <ActionIcon size="sm" onClick={() => markNotificationAsRead(notification.id)}>
            <IconCheck size={16} />
          </ActionIcon>
        )}
      </Group>
    );
  };

  // Render performance metric card
  const renderPerformanceMetric = (metric) => {
    const changeColor = getMetricChangeColor(metric.name, metric.change);
    const progressPercentage = calculateGoalProgress(metric);
    
    return (
      <Card key={metric.name} p="md" radius="md" withBorder>
        <Group position="apart" mb="xs">
          <Text size="sm" weight={500}>{metric.name}</Text>
          <Group spacing={4}>
            <Text size="sm" weight={700}>{metric.value} {metric.unit}</Text>
            <Text size="xs" color={changeColor}>
              {metric.change > 0 ? '+' : ''}{metric.change} {metric.unit}
            </Text>
          </Group>
        </Group>
        
        <Progress 
          value={progressPercentage} 
          color={progressPercentage >= 90 ? 'green' : progressPercentage >= 60 ? 'blue' : 'grape'}
          size="md"
          mb="xs"
        />
        
        <Group position="apart">
          <Text size="xs" color="dimmed">Current</Text>
          <Text size="xs" color="dimmed">Goal: {metric.goal} {metric.unit}</Text>
        </Group>
      </Card>
    );
  };

  // Radar chart data for athlete's performance profile
  const performanceProfileData = [
    {
      subject: 'Speed',
      value: 85,
      fullMark: 100,
    },
    {
      subject: 'Strength',
      value: 90,
      fullMark: 100,
    },
    {
      subject: 'Technique',
      value: 75,
      fullMark: 100,
    },
    {
      subject: 'Recovery',
      value: 80,
      fullMark: 100,
    },
    {
      subject: 'Mental',
      value: 85,
      fullMark: 100,
    },
    {
      subject: 'Endurance',
      value: 70,
      fullMark: 100,
    },
  ];

  return (
    <Box>
      <Paper p="md" radius="md" withBorder mb="xl">
        <Group position="apart" mb="xl">
          <Group>
            <Avatar src={userProfile?.avatar} size="lg" radius="xl" />
            <Box>
              <Title order={2}>Welcome, {userProfile?.firstName}</Title>
              <Text color="dimmed">{userProfile?.team} • {userProfile?.position}</Text>
            </Box>
          </Group>
          
          <Group spacing="md">
            <Button
              leftIcon={<IconClipboardCheck size={18} />}
              variant="light"
              onClick={navigateToCheckIn}
            >
              Daily Check-in
            </Button>
            
            <Button
              leftIcon={<IconNotes size={18} />}
              variant="light"
              onClick={navigateToWeeklyReview}
            >
              Weekly Review
            </Button>
            
            <Menu>
              <Menu.Target>
                <ActionIcon size="lg" radius="xl" variant="light" color="blue" sx={{ position: 'relative' }}>
                  <IconBell size={20} />
                  {hasUnreadNotifications && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: theme.colors.red[6]
                      }}
                    />
                  )}
                </ActionIcon>
              </Menu.Target>
              
              <Menu.Dropdown w={300}>
                <Menu.Label>Notifications</Menu.Label>
                {dashboardData.notifications.slice(0, 3).map(renderNotificationItem)}
                {dashboardData.notifications.length > 3 && (
                  <Menu.Item color="blue" icon={<IconArrowRight size={14} />} onClick={viewAllNotifications}>
                    View all notifications
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="md">
          <Card p="md" radius="md" withBorder>
            <Group position="apart">
              <Box>
                <Text size="sm" color="dimmed" mb="xs">Today's Readiness</Text>
                <RingProgress
                  size={80}
                  thickness={8}
                  roundCaps
                  sections={[{ value: dashboardData.readinessScore * 10, color: readinessStatus.color }]}
                  label={<Text weight={700} align="center" size="lg">{dashboardData.readinessScore}</Text>}
                />
              </Box>
              <Stack spacing={0} align="flex-end">
                <Badge color={readinessStatus.color} mb="xs">
                  {readinessStatus.text}
                </Badge>
                <Text size="xs" color="dimmed">
                  Based on recent check-ins
                </Text>
              </Stack>
            </Group>
          </Card>
          
          <Card p="md" radius="md" withBorder>
            <Text size="sm" color="dimmed" mb="xs">Training Compliance</Text>
            <Group position="apart" align="center" noWrap spacing="xs">
              <RingProgress
                size={80}
                thickness={8}
                roundCaps
                sections={[{ 
                  value: dashboardData.checkInCompliance, 
                  color: dashboardData.checkInCompliance < 70 ? 'red' : dashboardData.checkInCompliance < 85 ? 'yellow' : 'green' 
                }]}
                label={<Text weight={700} align="center" size="lg">{dashboardData.checkInCompliance}%</Text>}
              />
              <Box>
                <Group>
                  <ThemeIcon color="blue" variant="light" size="md" radius="xl">
                    <IconClipboardCheck size={16} />
                  </ThemeIcon>
                  <Text weight={500}>{dashboardData.workoutsCompleted} Workouts</Text>
                </Group>
                <Group mt="xs">
                  <ThemeIcon color="green" variant="light" size="md" radius="xl">
                    <IconCalendarEvent size={16} />
                  </ThemeIcon>
                  <Text weight={500}>{dashboardData.currentStreak} Day Streak</Text>
                </Group>
              </Box>
            </Group>
          </Card>
          
          <Card p="md" radius="md" withBorder>
            <Text size="sm" color="dimmed" mb="xs">Weekly Load</Text>
            <Group position="apart" align="center" spacing="xs">
              <RingProgress
                size={80}
                thickness={8}
                roundCaps
                sections={[{ 
                  value: trainingLoadSummary.completion, 
                  color: trainingLoadSummary.completion < 80 ? 'yellow' : 'blue' 
                }]}
                label={<Text weight={700} align="center" size="lg">{trainingLoadSummary.completion}%</Text>}
              />
              <Stack spacing={4}>
                <Group spacing="xs">
                  <Text size="sm">Planned:</Text>
                  <Text weight={500}>{trainingLoadSummary.totalPlanned} AU</Text>
                </Group>
                <Group spacing="xs">
                  <Text size="sm">Completed:</Text>
                  <Text weight={500}>{trainingLoadSummary.totalActual} AU</Text>
                </Group>
                <Text size="xs" color="dimmed">Weekly training units</Text>
              </Stack>
            </Group>
          </Card>
          
          <Card p="md" radius="md" withBorder>
            <Text size="sm" color="dimmed" mb="xs">Upcoming Event</Text>
            {dashboardData.upcomingEvents.length > 0 ? (
              <Group position="apart" align="flex-start" noWrap>
                <ThemeIcon size={36} radius="xl" color="grape">
                  {getEventTypeIcon(dashboardData.upcomingEvents[0].type)}
                </ThemeIcon>
                <Box>
                  <Text weight={500}>{dashboardData.upcomingEvents[0].title}</Text>
                  <Text size="xs">{formatDate(dashboardData.upcomingEvents[0].date)}</Text>
                  <Text size="xs" color="dimmed">{dashboardData.upcomingEvents[0].location}</Text>
                </Box>
              </Group>
            ) : (
              <Text>No upcoming events</Text>
            )}
          </Card>
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} mt="xl" spacing="md">
          <Box>
            <Stack spacing="md">
              <Paper p="md" radius="md" withBorder>
                <Group position="apart" mb="md">
                  <Title order={3}>Today's Schedule</Title>
                  <Text color="dimmed">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                </Group>
                
                {dashboardData.pendingWorkouts.length > 0 ? (
                  <Stack spacing="sm">
                    {dashboardData.pendingWorkouts.map(workout => (
                      <Card key={workout.id} p="sm" withBorder>
                        <Group position="apart">
                          <Group>
                            <ThemeIcon size="lg" radius="md" color="blue">
                              {getWorkoutTypeIcon(workout.type)}
                            </ThemeIcon>
                            <Box>
                              <Text weight={500}>{workout.title}</Text>
                              <Text size="xs" color="dimmed">{workout.scheduledTime} • {workout.duration} min</Text>
                            </Box>
                          </Group>
                          <Button
                            variant="light"
                            size="xs"
                            onClick={() => startWorkout(workout.id)}
                            rightIcon={<IconArrowRight size={14} />}
                          >
                            Start
                          </Button>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Text color="dimmed" align="center" py="md">
                    No workouts scheduled for today
                  </Text>
                )}
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Title order={3} mb="md">Recent Wellbeing</Title>
                <Box style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={prepareCheckInData()} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="readiness" name="Readiness" stroke={theme.colors.blue[6]} strokeWidth={2} />
                      <Line type="monotone" dataKey="sleep" name="Sleep" stroke={theme.colors.violet[6]} strokeWidth={2} />
                      <Line type="monotone" dataKey="energy" name="Energy" stroke={theme.colors.green[6]} strokeWidth={2} />
                      <Line type="monotone" dataKey="soreness" name="Soreness" stroke={theme.colors.red[6]} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Title order={3} mb="md">Current Goals</Title>
                <Stack spacing="xs">
                  {dashboardData.goals.map(goal => (
                    <Box key={goal.id}>
                      <Group position="apart" mb={2}>
                        <Text size="sm">{goal.text}</Text>
                        <Badge 
                          color={goal.priority === 'high' ? 'red' : goal.priority === 'medium' ? 'yellow' : 'blue'}
                          size="sm"
                        >
                          {goal.priority}
                        </Badge>
                      </Group>
                      <Group position="apart">
                        <Progress 
                          value={goal.progress} 
                          color={goal.progress < 50 ? 'red' : goal.progress < 80 ? 'yellow' : 'green'}
                          size="sm" 
                          style={{ width: '85%' }}
                        />
                        <Text size="xs" weight={500}>{goal.progress}%</Text>
                      </Group>
                      <Text size="xs" color="dimmed" mb="sm">Due: {new Date(goal.dueDate).toLocaleDateString()}</Text>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          </Box>

          <Box>
            <Stack spacing="md">
              <Paper p="md" radius="md" withBorder>
                <Title order={3} mb="md">Performance Progress</Title>
                <SimpleGrid cols={2} spacing="md" mb="sm">
                  {dashboardData.performanceMetrics.map(renderPerformanceMetric)}
                </SimpleGrid>
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Title order={3} mb="md">Training Load</Title>
                <Box style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.weeklyTrainingLoad}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="planned" name="Planned" fill={theme.colors.blue[5]} />
                      <Bar dataKey="actual" name="Actual" fill={theme.colors.green[6]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Group position="apart" mb="md">
                  <Title order={3}>Athlete Profile</Title>
                  <ActionIcon>
                    <IconPencil size={16} />
                  </ActionIcon>
                </Group>

                <SimpleGrid cols={2} spacing="xl">
                  <Box>
                    <Text weight={500} mb="xs">Performance Metrics</Text>
                    <Box style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceProfileData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <Radar name="Performance Profile" dataKey="value" stroke={theme.colors.blue[7]} fill={theme.colors.blue[3]} fillOpacity={0.6} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>

                  <Box>
                    <Text weight={500} mb="xs">Personal Records</Text>
                    <Stack spacing="xs">
                      {dashboardData.personalRecords.map((record, index) => (
                        <Group key={index} position="apart">
                          <Text size="sm">{record.name}</Text>
                          <Text size="sm" weight={500}>{record.value}</Text>
                        </Group>
                      ))}
                    </Stack>
                    <Divider my="sm" />
                    <Timeline active={1} bulletSize={24} lineWidth={2}>
                      {dashboardData.personalRecords.slice(0, 2).map((record, index) => (
                        <Timeline.Item
                          key={index}
                          bullet={<IconTrophy size={12} />}
                          title={record.name}
                        >
                          <Text color="dimmed" size="sm">{record.value} on {new Date(record.date).toLocaleDateString()}</Text>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </Box>
                </SimpleGrid>
              </Paper>
            </Stack>
          </Box>
        </SimpleGrid>
      </Paper>
    </Box>
  );
};

export default AthleteDashboard;