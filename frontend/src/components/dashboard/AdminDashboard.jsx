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
  Stack,
  RingProgress,
  Progress,
  Table,
  Avatar,
  Badge,
  useMantineTheme,
  Divider,
  ActionIcon,
  ScrollArea,
  Tooltip,
  Select
} from '@mantine/showMe';
import { DateRangePicker } from '@mantine/dates';
imLineChart, { Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, Bar, BarChart, Rectangle, ComposedChart, Area } from 'recharts';
import {
  IconUsers,
  IconCalendarEvent,
  IconClipboardCheck,
  IconFlag,
  IconChartLine,
  IconMessage2, //messages
  IconMessages, //alerts
  IconClipboard, //compliance
  IconVinyl, //intensity
  IconCheckboxes, //performance
  IconTrees, // teams
  IconEye,
  IconPencil,
  IconX,
  IconCheck,
  IconArrowDown,
  IconArrowUp,
  IconFilter,
  IconMaximize,
  IconChevronDown,
  IconChevronUp,
  IconMail
} from '@tabler/icons-react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

/**
 * AdminDashboard Component
 * Dashboard for coaches/administrators to monitor athlete performance,
 * wellbeing, and compliance across the team.
 */
const AdminDashboard = () => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [athletes, setAthletes] = useState([]);
  const [teamStats, setTeamStats] = useState({
    totalAthletes: 0,
    activeAthletes: 0,
    complianceRate: 0,
    alertCount: 0,
    checkInsToday: 0,
    weeklyReviewsSubmitted: 0
  });
  const [dateRange, setDateRange] = useState([new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [expandedAthlete, setExpandedAthlete] = useState(null);
  const [expandedAthleteData, setExpandedAthleteData] = useState(null);

  const teams = [
    { value: 'all', label: 'All Teams' },
    { value: 'team1', label: 'National Team' },
    { value: 'team2', label: 'Development Team' },
    { value: 'team3', label: 'Junior Team' },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [supabase, dateRange, selectedTeam]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // In a real implementation, these would be actual Supabase queries
      // Mocking the data for demonstration purposes
      
      // Fetch athletes
      const mockAthletes = [
        {
          id: '1',
          name: 'John Smith',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=250&q=80',
          team: 'team1',
          position: 'Driver',
          compliance: 92,
          readiness: 8.5,
          recovery: 7.8,
          performanceTrend: 'up',
          lastCheckIn: new Date().toISOString(),
          weeklyReviewSubmitted: true,
          alerts: 0
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=250&q=80',
          team: 'team1',
          position: 'Brakeman',
          compliance: 85,
          readiness: 7.2,
          recovery: 6.5,
          performanceTrend: 'neutral',
          lastCheckIn: new Date().toISOString(),
          weeklyReviewSubmitted: false,
          alerts: 1
        },
        {
          id: '3',
          name: 'Michael Lee',
          avatar: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=250&q=80',
          team: 'team2',
          position: 'Brakeman',
          compliance: 78,
          readiness: 6.8,
          recovery: 5.2,
          performanceTrend: 'down',
          lastCheckIn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          weeklyReviewSubmitted: true,
          alerts: 2
        },
        {
          id: '4',
          name: 'Emma Wilson',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=250&q=80',
          team: 'team2',
          position: 'Driver',
          compliance: 95,
          readiness: 9.0,
          recovery: 8.7,
          performanceTrend: 'up',
          lastCheckIn: new Date().toISOString(),
          weeklyReviewSubmitted: true,
          alerts: 0
        },
        {
          id: '5',
          name: 'Daniel Brown',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=250&q=80',
          team: 'team3',
          position: 'Brakeman',
          compliance: 67,
          readiness: 5.8,
          recovery: 6.1,
          performanceTrend: 'down',
          lastCheckIn: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          weeklyReviewSubmitted: false,
          alerts: 3
        },
      ];

      // Filter by team if necessary
      const filteredAthletes = selectedTeam === 'all' ? 
        mockAthletes : 
        mockAthletes.filter(athlete => athlete.team === selectedTeam);

      setAthletes(filteredAthletes);

      // Calculate team statistics
      const totalAthletes = filteredAthletes.length;
      const activeAthletes = filteredAthletes.filter(
        athlete => new Date(athlete.lastCheckIn) > new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      ).length;
      const complianceRate = filteredAthletes.reduce((sum, athlete) => sum + athlete.compliance, 0) / totalAthletes;
      const alertCount = filteredAthletes.reduce((sum, athlete) => sum + athlete.alerts, 0);
      const checkInsToday = filteredAthletes.filter(
        athlete => new Date(athlete.lastCheckIn).toDateString() === new Date().toDateString()
      ).length;
      const weeklyReviewsSubmitted = filteredAthletes.filter(athlete => athlete.weeklyReviewSubmitted).length;

      setTeamStats({
        totalAthletes,
        activeAthletes,
        complianceRate,
        alertCount,
        checkInsToday,
        weeklyReviewsSubmitted
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAthleteDetails = async (athleteId) => {
    setExpandedAthlete(athleteId);

    try {
      // In a real implementation, this would fetch detailed data for the athlete
      // Mocking the data for demonstration purposes
      const mockAthleteData = {
        personalInfo: {
          id: athleteId,
          name: athletes.find(a => a.id === athleteId)?.name || 'Unknown Athlete',
          email: 'athlete@example.com',
          phone: '+1 (555) 123-4567',
          dateOfBirth: '1995-05-15',
          height: '183 cm',
          weight: '82 kg',
          team: athletes.find(a => a.id === athleteId)?.team || 'Unknown Team',
          position: athletes.find(a => a.id === athleteId)?.position || 'Unknown Position',
          experience: '5 years'
        },
        weeklyData: [
          { day: 'Mon', readiness: 7, sleep: 8, energy: 7, soreness: 4 },
          { day: 'Tue', readiness: 8, sleep: 7, energy: 8, soreness: 3 },
          { day: 'Wed', readiness: 6, sleep: 6, energy: 6, soreness: 5 },
          { day: 'Thu', readiness: 7, sleep: 8, energy: 7, soreness: 4 },
          { day: 'Fri', readiness: 9, sleep: 9, energy: 9, soreness: 2 },
          { day: 'Sat', readiness: 8, sleep: 7, energy: 8, soreness: 3 },
          { day: 'Sun', readiness: 7, sleep: 8, energy: 7, soreness: 4 },
        ],
        trainingLoad: [
          { week: 'Week 1', acute: 600, chronic: 550 },
          { week: 'Week 2', acute: 650, chronic: 570 },
          { week: 'Week 3', acute: 500, chronic: 580 },
          { week: 'Week 4', acute: 700, chronic: 590 },
          { week: 'Week 5', acute: 600, chronic: 600 },
          { week: 'Week 6', acute: 650, chronic: 610 },
        ],
        recentGoals: [
          { goal: 'Improve push time by 0.1s', status: 'completed', dueDate: '2023-11-15' },
          { goal: 'Increase squat 1RM to 150kg', status: 'in-progress', dueDate: '2023-12-01' },
          { goal: 'Perfect loading technique', status: 'in-progress', dueDate: '2023-11-30' },
        ],
        recentAlerts: [
          { type: 'high-soreness', date: '2023-11-14', message: 'Reported high soreness in lower back', severity: 'medium' },
          { type: 'missed-check-in', date: '2023-11-10', message: 'Missed daily check-in', severity: 'low' },
          { type: 'sleep-quality', date: '2023-11-05', message: 'Poor sleep quality for 3 consecutive days', severity: 'high' },
        ],
        upcomingEvents: [
          { name: 'Team Training Camp', date: '2023-12-05', location: 'Lake Placid, NY' },
          { name: 'World Cup Race 1', date: '2023-12-15', location: 'Winterberg, Germany' },
        ]
      };

      setExpandedAthleteData(mockAthleteData);

    } catch (error) {
      console.error('Error fetching athlete details:', error);
    }
  };

  const handleCloseAthleteDetails = () => {
    setExpandedAthlete(null);
    setExpandedAthleteData(null);
  };

  const handleContactAthlete = (athleteId, method) => {
    // In a real application, this would open a modal to send a message or email
    alert(`Contact athlete ${athleteId} via ${method}`);
  };

  // Get trend icon based on trend direction
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <IconArrowUp size={16} color={theme.colors.green[6]} />;
      case 'down':
        return <IconArrowDown size={16} color={theme.colors.red[6]} />;
      default:
        return <IconMinus size={16} color={theme.colors.gray[6]} />;
    }
  };

  // Get alert severity color
  const getAlertColor = (count) => {
    if (count === 0) return 'green';
    if (count === 1) return 'yellow';
    if (count === 2) return 'orange';
    return 'red';
  };

  // Get last check-in status
  const getCheckInStatus = (lastCheckIn) => {
    const lastDate = new Date(lastCheckIn);
    const now = new Date();
    const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    
    if (lastDate.toDateString() === now.toDateString()) {
      return { status: 'today', color: 'green', text: 'Today' };
    } else if (diffDays === 1) {
      return { status: 'yesterday', color: 'blue', text: 'Yesterday' };
    } else if (diffDays <= 3) {
      return { status: 'recent', color: 'yellow', text: `${diffDays} days ago` };
    } else {
      return { status: 'overdue', color: 'red', text: `${diffDays} days ago` };
    }
  };

  // Generate athletes list with readiness indicators
  const renderAthletesList = () => {
    if (athletes.length === 0) {
      return (
        <Text align="center" color="dimmed" py="xl">
          No athletes found with the current filters.
        </Text>
      );
    }

    return (
      <Table horizontalSpacing="md" verticalSpacing="sm" fontSize="sm">
        <thead>
          <tr>
            <th>Athlete</th>
            <th>Readiness</th>
            <th>Check-in</th>
            <th>Compliance</th>
            <th>Alerts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {athletes.map((athlete) => {
            const checkInStatus = getCheckInStatus(athlete.lastCheckIn);
            
            return (
              <tr key={athlete.id}>
                <td>
                  <Group spacing="sm">
                    <Avatar size={30} src={athlete.avatar} radius={30} />
                    <Box>
                      <Text size="sm" weight={500}>{athlete.name}</Text>
                      <Text size="xs" color="dimmed">{athlete.position}</Text>
                    </Box>
                  </Group>
                </td>
                <td>
                  <Group spacing="xs">
                    <Text weight={500}>{athlete.readiness}</Text>
                    {getTrendIcon(athlete.performanceTrend)}
                  </Group>
                </td>
                <td>
                  <Badge color={checkInStatus.color} variant="light">
                    {checkInStatus.text}
                  </Badge>
                </td>
                <td>
                  <Group spacing="xs" noWrap>
                    <Box style={{ flex: 1 }}>
                      <Progress 
                        value={athlete.compliance} 
                        color={athlete.compliance < 70 ? 'red' : athlete.compliance < 85 ? 'yellow' : 'green'} 
                        size="sm"
                      />
                    </Box>
                    <Text size="xs" weight={500}>{athlete.compliance}%</Text>
                  </Group>
                </td>
                <td>
                  <Badge 
                    color={getAlertColor(athlete.alerts)} 
                    variant={athlete.alerts > 0 ? 'filled' : 'light'}
                  >
                    {athlete.alerts}
                  </Badge>
                </td>
                <td>
                  <Group spacing={0}>
                    <Tooltip label="View Details">
                      <ActionIcon
                        onClick={() => handleViewAthleteDetails(athlete.id)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Message">
                      <ActionIcon
                        onClick={() => handleContactAthlete(athlete.id, 'message')}
                      >
                        <IconMessage2 size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Email">
                      <ActionIcon
                        onClick={() => handleContactAthlete(athlete.id, 'email')}
                      >
                        <IconMail size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  };

  // Create overview metric cards
  const OverviewMetricCard = ({ title, value, icon, color, subtitle, progress }) => (
    <Card p="md" radius="md" withBorder>
      <Group position="apart" mb="xs">
        <Text weight={500} size="sm" color="dimmed">{title}</Text>
        <ThemeIcon color={color} variant="light" size={38} radius="md">
          {icon}
        </ThemeIcon>
      </Group>
      <Group position="apart" align="flex-end" spacing="xs">
        <Text weight={700} size="xl">{value}</Text>
        {subtitle && <Text size="xs" color="dimmed">{subtitle}</Text>}
      </Group>
      {progress !== undefined && (
        <Progress 
          value={progress} 
          size="sm" 
          color={color} 
          mt="md" 
        />
      )}
    </Card>
  );

  // Render team summary metrics
  const renderTeamSummary = () => (
    <SimpleGrid cols={{ base: 1, xs: 2, md: 3, xl: 6 }} spacing="md">
      <OverviewMetricCard
        title="Total Athletes"
        value={teamStats.totalAthletes}
        icon={<IconUsers size={20} stroke={1.5} />}
        color="blue"
      />
      <OverviewMetricCard
        title="Active Athletes"
        value={`${teamStats.activeAthletes}/${teamStats.totalAthletes}`}
        icon={<IconCalendarEvent size={20} stroke={1.5} />}
        color="green"
        progress={(teamStats.activeAthletes / teamStats.totalAthletes) * 100}
      />
      <OverviewMetricCard
        title="Today's Check-ins"
        value={`${teamStats.checkInsToday}/${teamStats.totalAthletes}`}
        icon={<IconClipboardCheck size={20} stroke={1.5} />}
        color="teal"
        progress={(teamStats.checkInsToday / teamStats.totalAthletes) * 100}
      />
      <OverviewMetricCard
        title="Compliance Rate"
        value={`${Math.round(teamStats.complianceRate)}%`}
        icon={<IconClipboard size={20} stroke={1.5} />}
        color={teamStats.complianceRate < 70 ? 'red' : teamStats.complianceRate < 85 ? 'yellow' : 'blue'}
        progress={teamStats.complianceRate}
      />
      <OverviewMetricCard
        title="Weekly Reviews"
        value={`${teamStats.weeklyReviewsSubmitted}/${teamStats.totalAthletes}`}
        icon={<IconChartLine size={20} stroke={1.5} />}
        color="violet"
        progress={(teamStats.weeklyReviewsSubmitted / teamStats.totalAthletes) * 100}
      />
      <OverviewMetricCard
        title="Active Alerts"
        value={teamStats.alertCount}
        icon={<IconMessages size={20} stroke={1.5} />}
        color={getAlertColor(teamStats.alertCount)}
        subtitle="Requiring attention"
      />
    </SimpleGrid>
  );

  // Render expanded athlete detail view
  const renderExpandedAthleteView = () => {
    if (!expandedAthlete || !expandedAthleteData) return null;

    const { personalInfo, weeklyData, trainingLoad, recentGoals, recentAlerts, upcomingEvents } = expandedAthleteData;

    return (
      <Paper p="md" radius="md" withBorder mb="xl">
        <Group position="apart" mb="md">
          <Group>
            <Avatar size={50} src={athletes.find(a => a.id === expandedAthlete)?.avatar} radius={50} />
            <Box>
              <Title order={3}>{personalInfo.name}</Title>
              <Group spacing="xs">
                <Text size="sm">{personalInfo.position}</Text>
                <Text size="sm" color="dimmed">•</Text>
                <Text size="sm">{teams.find(t => t.value === personalInfo.team)?.label || personalInfo.team}</Text>
              </Group>
            </Box>
          </Group>
          
          <Group>
            <Button variant="outline" onClick={() => handleContactAthlete(expandedAthlete, 'message')}>
              Message
            </Button>
            <ActionIcon onClick={handleCloseAthleteDetails}>
              <IconX size={20} />
            </ActionIcon>
          </Group>
        </Group>

        <Divider mb="md" />

        <Tabs defaultValue="overview">
          <Tabs.List mb="md">
            <Tabs.Tab value="overview" icon={<IconChartLine size={16} />}>Overview</Tabs.Tab>
            <Tabs.Tab value="metrics" icon={<IconCheckboxes size={16} />}>Metrics</Tabs.Tab>
            <Tabs.Tab value="goals" icon={<IconTarget size={16} />}>Goals</Tabs.Tab>
            <Tabs.Tab value="alerts" icon={<IconMessages size={16} />}>Alerts</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview">
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Paper p="md" withBorder>
                <Title order={4} mb="md">Weekly Readiness</Title>
                <Box style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 10]} />
                      <ChartTooltip />
                      <Line type="monotone" dataKey="readiness" name="Readiness" stroke={theme.colors.blue[6]} strokeWidth={2} />
                      <Line type="monotone" dataKey="sleep" name="Sleep" stroke={theme.colors.violet[6]} strokeWidth={2} />
                      <Line type="monotone" dataKey="energy" name="Energy" stroke={theme.colors.green[6]} strokeWidth={2} />
                      <Line type="monotone" dataKey="soreness" name="Soreness" stroke={theme.colors.red[6]} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              <Paper p="md" withBorder>
                <Title order={4} mb="md">Training Load</Title>
                <Box style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trainingLoad}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <ChartTooltip />
                      <Area type="monotone" dataKey="chronic" name="Chronic Load" fill={theme.colors.blue[1]} stroke={theme.colors.blue[6]} />
                      <Bar dataKey="acute" name="Acute Load" barSize={20} fill={theme.colors.grape[6]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              <Paper p="md" withBorder>
                <Title order={4} mb="md">Upcoming Events</Title>
                {upcomingEvents.length > 0 ? (
                  <Stack spacing="xs">
                    {upcomingEvents.map((event, index) => (
                      <Card key={index} p="sm" withBorder>
                        <Group position="apart">
                          <Box>
                            <Text weight={500}>{event.name}</Text>
                            <Text size="xs" color="dimmed">{event.location}</Text>
                          </Box>
                          <Badge>{new Date(event.date).toLocaleDateString()}</Badge>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Text color="dimmed">No upcoming events.</Text>
                )}
              </Paper>

              <Paper p="md" withBorder>
                <Title order={4} mb="md">Personal Information</Title>
                <Stack spacing="xs">
                  <Group position="apart">
                    <Text weight={500}>Date of Birth:</Text>
                    <Text>{personalInfo.dateOfBirth}</Text>
                  </Group>
                  <Group position="apart">
                    <Text weight={500}>Height:</Text>
                    <Text>{personalInfo.height}</Text>
                  </Group>
                  <Group position="apart">
                    <Text weight={500}>Weight:</Text>
                    <Text>{personalInfo.weight}</Text>
                  </Group>
                  <Group position="apart">
                    <Text weight={500}>Experience:</Text>
                    <Text>{personalInfo.experience}</Text>
                  </Group>
                  <Group position="apart">
                    <Text weight={500}>Email:</Text>
                    <Text>{personalInfo.email}</Text>
                  </Group>
                  <Group position="apart">
                    <Text weight={500}>Phone:</Text>
                    <Text>{personalInfo.phone}</Text>
                  </Group>
                </Stack>
              </Paper>
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="metrics">
            {/* Metrics content */}
            <Text>Detailed metrics view would go here.</Text>
          </Tabs.Panel>

          <Tabs.Panel value="goals">
            <Title order={4} mb="md">Athlete Goals</Title>
            <Stack spacing="md">
              {recentGoals.map((goal, index) => (
                <Card key={index} p="sm" withBorder>
                  <Group position="apart">
                    <Group spacing="md">
                      <ThemeIcon 
                        color={goal.status === 'completed' ? 'green' : 'blue'}
                        variant={goal.status === 'completed' ? 'filled' : 'light'}
                        size="lg"
                        radius="xl"
                      >
                        {goal.status === 'completed' ? <IconCheck size={20} /> : <IconFlag size={20} />}
                      </ThemeIcon>
                      <Box>
                        <Text weight={500}>{goal.goal}</Text>
                        <Text size="xs" color="dimmed">Due: {new Date(goal.dueDate).toLocaleDateString()}</Text>
                      </Box>
                    </Group>
                    <Badge color={goal.status === 'completed' ? 'green' : 'blue'}>
                      {goal.status === 'completed' ? 'Completed' : 'In Progress'}
                    </Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="alerts">
            <Title order={4} mb="md">Recent Alerts</Title>
            <Stack spacing="md">
              {recentAlerts.map((alert, index) => (
                <Card key={index} p="sm" withBorder>
                  <Group position="apart">
                    <Group spacing="md">
                      <ThemeIcon 
                        color={alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'orange' : 'yellow'}
                        variant="light"
                        size="lg"
                        radius="xl"
                      >
                        <IconMessages size={20} />
                      </ThemeIcon>
                      <Box>
                        <Text weight={500}>{alert.message}</Text>
                        <Text size="xs" color="dimmed">Date: {new Date(alert.date).toLocaleDateString()}</Text>
                      </Box>
                    </Group>
                    <Badge color={alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'orange' : 'yellow'}>
                      {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                    </Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    );
  };

  return (
    <Box>
      <Paper p="md" radius="md" withBorder mb="xl">
        <Group position="apart" mb="xl">
          <Box>
            <Title order={2}>Coach Dashboard</Title>
            <Text color="dimmed">Monitor your athletes' performance and wellbeing</Text>
          </Box>
          <Group>
            <Select
              placeholder="Select Team"
              data={teams}
              value={selectedTeam}
              onChange={setSelectedTeam}
              w={200}
              icon={<IconFilter size={14} />}
            />
            <DateRangePicker
              placeholder="Date Range"
              value={dateRange}
              onChange={setDateRange}
              w={250}
              allowSingleDateSelection={false}
              clearable={false}
            />
          </Group>
        </Group>

        {renderTeamSummary()}

        <Divider my="xl" />
        
        {expandedAthlete && expandedAthleteData && renderExpandedAthleteView()}

        <Paper p="md" radius="md" withBorder mt="xl">
          <Group position="apart" mb="md">
            <Title order={3}>Athletes</Title>
            <Select
              placeholder="Sorted by Readiness"
              data={[
                { value: 'readiness', label: 'Readiness' },
                { value: 'alerts', label: 'Alerts' },
                { value: 'compliance', label: 'Compliance' },
                { value: 'name', label: 'Name' }
              ]}
              defaultValue="readiness"
              w={200}
            />
          </Group>
          
          <ScrollArea>
            {renderAthletesList()}
          </ScrollArea>
        </Paper>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;