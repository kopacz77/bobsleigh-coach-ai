import React, { useState, useEffect } from 'react';
import {
  Box,
  Title,
  Text,
  Group,
  Paper,
  Button,
  Slider,
  MultiSelect,
  Textarea,
  Progress,
  useMantineTheme,
  Stack,
  Card,
  Grid,
  SimpleGrid,
  Select,
  Divider,
  Tabs,
  RingProgress
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { showNotification } from '@mantine/notifications';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  IconTrophy,
  IconActivityHeartbeat,
  IconTarget,
  IconPencil,
  IconCalendarStats,
  IconChartLine,
  IconCheck
} from '@tabler/icons-react';

/**
 * WeeklyReview component allows athletes to reflect on their week,
 * review training data, set goals for the upcoming week, and track progress.
 */
const WeeklyReview = ({ userId }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dailyCheckIns, setDailyCheckIns] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [previousReview, setPreviousReview] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);
  
  // Form state
  const [review, setReview] = useState({
    date: new Date(),
    week_ending: new Date(),
    overall_satisfaction: 5,
    training_quality: 5,
    physical_progress: 5,
    recovery_quality: 5,
    goals_progress: 5,
    positive_aspects: [],
    improvement_areas: [],
    goals_completed: [],
    new_goals: [],
    mental_state: 5,
    key_learning: '',
    coach_feedback: '',
    next_week_focus: '',
    custom_metrics: {}
  });

  // Get the start and end dates for the current week
  const getWeekDates = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return { monday, sunday };
  };

  const { monday: weekStart, sunday: weekEnd } = getWeekDates();

  // Areas for improvement and positive aspects
  const trainingAreas = [
    { value: 'push_technique', label: 'Push Technique' },
    { value: 'loading_technique', label: 'Loading Technique' },
    { value: 'driving_technique', label: 'Driving Technique' },
    { value: 'track_awareness', label: 'Track Awareness' },
    { value: 'turn_execution', label: 'Turn Execution' },
    { value: 'start_speed', label: 'Start Speed' },
    { value: 'team_coordination', label: 'Team Coordination' },
    { value: 'physical_strength', label: 'Physical Strength' },
    { value: 'explosive_power', label: 'Explosive Power' },
    { value: 'speed', label: 'Speed' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'mental_focus', label: 'Mental Focus' },
    { value: 'decision_making', label: 'Decision Making' },
    { value: 'equipment_setup', label: 'Equipment Setup' },
    { value: 'recovery', label: 'Recovery Strategies' },
    { value: 'sleep', label: 'Sleep Quality' },
    { value: 'nutrition', label: 'Nutrition' },
    { value: 'hydration', label: 'Hydration' },
    { value: 'stress_management', label: 'Stress Management' }
  ];

  // Goals for tracking
  const commonGoals = [
    { value: 'improve_push_time', label: 'Improve Push Time' },
    { value: 'perfect_loading', label: 'Perfect Loading Technique' },
    { value: 'increase_squat', label: 'Increase Squat Strength' },
    { value: 'improve_sprint', label: 'Improve Sprint Speed' },
    { value: 'consistent_start', label: 'More Consistent Start' },
    { value: 'track_lines', label: 'Better Track Lines' },
    { value: 'equipment_tweak', label: 'Equipment Optimization' },
    { value: 'team_sync', label: 'Team Synchronization' },
    { value: 'sleep_improvement', label: 'Improve Sleep Quality' },
    { value: 'nutrition_plan', label: 'Follow Nutrition Plan' },
    { value: 'mental_prep', label: 'Mental Preparation Routine' },
    { value: 'recovery_routine', label: 'Consistent Recovery Routine' }
  ];

  // Fetch daily check-ins for the current week
  useEffect(() => {
    const fetchWeekData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        
        // Fetch daily check-ins
        const { data: checkInData, error: checkInError } = await supabase
          .from('daily_check_ins')
          .select('*')
          .eq('user_id', userId)
          .gte('date', weekStart.toISOString().split('T')[0])
          .lte('date', weekEnd.toISOString().split('T')[0])
          .order('date', { ascending: true });

        if (checkInError) {
          console.error('Error fetching daily check-ins:', checkInError);
          return;
        }

        setDailyCheckIns(checkInData || []);

        // Fetch workouts
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', userId)
          .gte('date', weekStart.toISOString().split('T')[0])
          .lte('date', weekEnd.toISOString().split('T')[0])
          .order('date', { ascending: true });

        if (workoutError) {
          console.error('Error fetching workouts:', workoutError);
          return;
        }

        setWorkouts(workoutData || []);

        // Check if there's already a review for this week
        const { data: reviewData, error: reviewError } = await supabase
          .from('weekly_reviews')
          .select('*')
          .eq('user_id', userId)
          .eq('week_ending', weekEnd.toISOString().split('T')[0])
          .single();

        if (reviewError && reviewError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error checking for existing review:', reviewError);
          return;
        }

        if (reviewData) {
          setHasExistingReview(true);
          setReview({
            ...review,
            ...reviewData,
            date: new Date(reviewData.date),
            week_ending: new Date(reviewData.week_ending),
            positive_aspects: reviewData.positive_aspects || [],
            improvement_areas: reviewData.improvement_areas || [],
            goals_completed: reviewData.goals_completed || [],
            new_goals: reviewData.new_goals || [],
            custom_metrics: reviewData.custom_metrics || {}
          });
        } else {
          // Set default values based on the week's data
          setReview(prev => ({
            ...prev,
            week_ending: weekEnd,
            date: new Date(),
          }));
        }

        // Get previous review for comparison
        const previousSunday = new Date(weekStart);
        previousSunday.setDate(previousSunday.getDate() - 1);
        previousSunday.setHours(23, 59, 59, 999);

        const previousMonday = new Date(previousSunday);
        previousMonday.setDate(previousSunday.getDate() - 6);
        previousMonday.setHours(0, 0, 0, 0);

        const { data: prevReviewData } = await supabase
          .from('weekly_reviews')
          .select('*')
          .eq('user_id', userId)
          .eq('week_ending', previousSunday.toISOString().split('T')[0])
          .single();

        if (prevReviewData) {
          setPreviousReview(prevReviewData);
        }

      } catch (error) {
        console.error('Error in fetching weekly data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekData();
  }, [userId, supabase]);

  // Handle form field changes
  const handleSatisfactionChange = (value) => setReview(prev => ({ ...prev, overall_satisfaction: value }));
  const handleTrainingQualityChange = (value) => setReview(prev => ({ ...prev, training_quality: value }));
  const handlePhysicalProgressChange = (value) => setReview(prev => ({ ...prev, physical_progress: value }));
  const handleRecoveryQualityChange = (value) => setReview(prev => ({ ...prev, recovery_quality: value }));
  const handleGoalsProgressChange = (value) => setReview(prev => ({ ...prev, goals_progress: value }));
  const handlePositiveAspectsChange = (value) => setReview(prev => ({ ...prev, positive_aspects: value }));
  const handleImprovementAreasChange = (value) => setReview(prev => ({ ...prev, improvement_areas: value }));
  const handleGoalsCompletedChange = (value) => setReview(prev => ({ ...prev, goals_completed: value }));
  const handleNewGoalsChange = (value) => setReview(prev => ({ ...prev, new_goals: value }));
  const handleMentalStateChange = (value) => setReview(prev => ({ ...prev, mental_state: value }));
  const handleKeyLearningChange = (event) => setReview(prev => ({ ...prev, key_learning: event.target.value }));
  const handleNextWeekFocusChange = (event) => setReview(prev => ({ ...prev, next_week_focus: event.target.value }));

  // Submit weekly review
  const handleSubmit = async () => {
    setSaving(true);
    
    try {
      const reviewData = {
        user_id: userId,
        date: review.date.toISOString().split('T')[0],
        week_ending: review.week_ending.toISOString().split('T')[0],
        overall_satisfaction: review.overall_satisfaction,
        training_quality: review.training_quality,
        physical_progress: review.physical_progress,
        recovery_quality: review.recovery_quality,
        goals_progress: review.goals_progress,
        positive_aspects: review.positive_aspects,
        improvement_areas: review.improvement_areas,
        goals_completed: review.goals_completed,
        new_goals: review.new_goals,
        mental_state: review.mental_state,
        key_learning: review.key_learning || null,
        coach_feedback: review.coach_feedback || null,
        next_week_focus: review.next_week_focus || null,
        custom_metrics: review.custom_metrics || {}
      };

      let query;
      
      if (hasExistingReview) {
        // Update existing review
        query = supabase
          .from('weekly_reviews')
          .update(reviewData)
          .eq('id', review.id);
      } else {
        // Insert new review
        query = supabase
          .from('weekly_reviews')
          .insert(reviewData);
      }

      const { error } = await query;
      
      if (error) {
        throw error;
      }

      showNotification({
        title: 'Success',
        message: hasExistingReview ? 'Weekly review updated successfully' : 'Weekly review completed successfully',
        color: 'green',
      });

      setCompleted(true);
    } catch (error) {
      console.error('Error saving weekly review:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to save weekly review',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    setCompleted(false);
  };

  // Helper function to get slider color based on value
  const getSliderColor = (value) => {
    if (value <= 3) return theme.colors.red[6];
    if (value <= 6) return theme.colors.yellow[6];
    return theme.colors.green[6];
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Calculate week stats
  const calculateWeekStats = () => {
    if (dailyCheckIns.length === 0) return null;

    const avgSleep = dailyCheckIns.reduce((sum, item) => sum + item.sleep_quality, 0) / dailyCheckIns.length;
    const avgEnergy = dailyCheckIns.reduce((sum, item) => sum + item.energy_level, 0) / dailyCheckIns.length;
    const avgReadiness = dailyCheckIns.reduce((sum, item) => sum + item.readiness, 0) / dailyCheckIns.length;
    
    const checkInCount = dailyCheckIns.length;
    const workoutCount = workouts.length;
    const complianceRate = checkInCount / 7; // Assuming 7 days per week
    
    return {
      avgSleep: avgSleep.toFixed(1),
      avgEnergy: avgEnergy.toFixed(1),
      avgReadiness: avgReadiness.toFixed(1),
      checkInCount,
      workoutCount,
      complianceRate: (complianceRate * 100).toFixed(0)
    };
  };

  const weekStats = calculateWeekStats();

  // Prepare chart data for weekly trends
  const prepareChartData = () => {
    return dailyCheckIns.map(item => ({
      date: formatDate(item.date),
      readiness: item.readiness,
      sleep: item.sleep_quality,
      energy: item.energy_level,
      soreness: item.muscle_soreness
    }));
  };

  // If weekly review is completed, show success message
  if (completed) {
    return (
      <Box>
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" spacing="lg">
            <IconCheck size={48} color={theme.colors.green[6]} />
            <Title order={2} align="center">Weekly Review Complete!</Title>
            <Text align="center" color="dimmed">
              Thank you for completing your weekly review. Your reflection helps optimize
              your training program and track your progress over time.
            </Text>
            
            <SimpleGrid cols={3} spacing="md" style={{ width: '100%' }}>
              <Card withBorder p="md" radius="md">
                <Text weight={700} align="center" mb="xs">Weekly Satisfaction</Text>
                <RingProgress
                  size={90}
                  thickness={12}
                  roundCaps
                  sections={[{ value: review.overall_satisfaction * 10, color: getSliderColor(review.overall_satisfaction) }]}
                  label={<Text weight={700} align="center" size="lg">{review.overall_satisfaction}</Text>}
                  mx="auto"
                />
              </Card>
              
              <Card withBorder p="md" radius="md">
                <Text weight={700} align="center" mb="xs">Training Quality</Text>
                <RingProgress
                  size={90}
                  thickness={12}
                  roundCaps
                  sections={[{ value: review.training_quality * 10, color: getSliderColor(review.training_quality) }]}
                  label={<Text weight={700} align="center" size="lg">{review.training_quality}</Text>}
                  mx="auto"
                />
              </Card>
              
              <Card withBorder p="md" radius="md">
                <Text weight={700} align="center" mb="xs">Progress Rating</Text>
                <RingProgress
                  size={90}
                  thickness={12}
                  roundCaps
                  sections={[{ value: review.physical_progress * 10, color: getSliderColor(review.physical_progress) }]}
                  label={<Text weight={700} align="center" size="lg">{review.physical_progress}</Text>}
                  mx="auto"
                />
              </Card>
            </SimpleGrid>
            
            <Button onClick={handleReset} variant="light" mt="lg">
              {hasExistingReview ? 'Edit Review' : 'Start New Review'}
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Paper p="md" radius="md" withBorder mb="xl">
        <Group position="apart" mb="md">
          <Title order={2}>Weekly Training Review</Title>
          <Text color="dimmed">
            Week of {weekStart.toLocaleDateString()} - {weekEnd.toLocaleDateString()}
          </Text>
        </Group>
        
        <Text color="dimmed" mb="xl">
          Reflect on your training week, set goals for the upcoming week, and track your progress
          over time. This weekly review helps optimize your training program and ensures you're
          making consistent progress.
        </Text>

        {hasExistingReview && (
          <Paper p="sm" radius="md" bg="blue.0" mb="xl">
            <Text size="sm" color="blue.8">
              You've already completed a review for this week. You can review or update your responses below.
            </Text>
          </Paper>
        )}

        <Tabs defaultValue="summary">
          <Tabs.List mb="lg">
            <Tabs.Tab value="summary" icon={<IconCalendarStats size={16} />}>Week Summary</Tabs.Tab>
            <Tabs.Tab value="assessment" icon={<IconActivityHeartbeat size={16} />}>Weekly Assessment</Tabs.Tab>
            <Tabs.Tab value="goals" icon={<IconTarget size={16} />}>Goals & Progress</Tabs.Tab>
            <Tabs.Tab value="reflection" icon={<IconPencil size={16} />}>Reflection & Learning</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="summary">
            <Title order={3} mb="lg">Weekly Overview</Title>

            {weekStats ? (
              <>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" mb="xl">
                  <Paper p="md" radius="md" withBorder>
                    <Text weight={500} size="lg" align="center" mb="md">Check-in Compliance</Text>
                    <RingProgress
                      size={120}
                      thickness={16}
                      roundCaps
                      sections={[{ value: parseInt(weekStats.complianceRate), color: theme.colors.blue[6] }]}
                      label={<Text weight={700} align="center" size="xl">{weekStats.complianceRate}%</Text>}
                      mx="auto"
                    />
                    <Text align="center" mt="md" color="dimmed">
                      {weekStats.checkInCount} of 7 days logged
                    </Text>
                  </Paper>

                  <Paper p="md" radius="md" withBorder>
                    <Text weight={500} size="lg" align="center" mb="md">Training Volume</Text>
                    <Box style={{ height: 120, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                      <Text weight={700} size="3xl">{weekStats.workoutCount}</Text>
                      <Text color="dimmed">Workouts Completed</Text>
                    </Box>
                  </Paper>

                  <Paper p="md" radius="md" withBorder>
                    <Text weight={500} size="lg" align="center" mb="md">Weekly Averages</Text>
                    <Stack spacing="xs" align="center" justify="center" style={{ height: 120 }}>
                      <Group position="apart" style={{ width: '100%' }}>
                        <Text>Readiness</Text>
                        <Text weight={500}>{weekStats.avgReadiness}/10</Text>
                      </Group>
                      <Group position="apart" style={{ width: '100%' }}>
                        <Text>Sleep Quality</Text>
                        <Text weight={500}>{weekStats.avgSleep}/10</Text>
                      </Group>
                      <Group position="apart" style={{ width: '100%' }}>
                        <Text>Energy Level</Text>
                        <Text weight={500}>{weekStats.avgEnergy}/10</Text>
                      </Group>
                    </Stack>
                  </Paper>
                </SimpleGrid>

                <Paper p="md" radius="md" withBorder mb="xl">
                  <Text weight={500} size="lg" mb="md">Weekly Trends</Text>
                  <Box style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={prepareChartData()}
                        margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="readiness" name="Readiness" stroke={theme.colors.blue[6]} strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="sleep" name="Sleep Quality" stroke={theme.colors.violet[6]} strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="energy" name="Energy" stroke={theme.colors.green[6]} strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="soreness" name="Soreness" stroke={theme.colors.red[6]} strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
                
                {workouts.length > 0 && (
                  <Paper p="md" radius="md" withBorder>
                    <Text weight={500} size="lg" mb="md">Completed Workouts</Text>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {workouts.map((workout, index) => (
                        <Card key={index} p="xs" mb="xs" withBorder>
                          <Group position="apart">
                            <Group>
                              <Text size="sm">{formatDate(workout.date)}</Text>
                              <Text weight={500}>{workout.title || workout.workout_type}</Text>
                            </Group>
                            <Text size="sm">{workout.duration_minutes} min</Text>
                          </Group>
                        </Card>
                      ))}
                    </Box>
                  </Paper>
                )}
              </>
            ) : (
              <Paper p="xl" withBorder radius="md">
                <Text align="center" color="dimmed">
                  No check-in data available for this week. Complete daily check-ins
                  to see your weekly summary.
                </Text>
              </Paper>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="assessment">
            <Title order={3} mb="lg">Week Assessment</Title>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
              <Stack spacing="lg">
                <Paper p="md" radius="md" withBorder>
                  <Text weight={500} mb="md">Overall Week Satisfaction</Text>
                  <Slider
                    value={review.overall_satisfaction}
                    onChange={handleSatisfactionChange}
                    min={1}
                    max={10}
                    step={1}
                    marks={[
                      { value: 1, label: 'Poor' },
                      { value: 5, label: 'Average' },
                      { value: 10, label: 'Excellent' },
                    ]}
                    color={getSliderColor(review.overall_satisfaction)}
                    mb="lg"
                  />
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Text weight={500} mb="md">Training Quality</Text>
                  <Slider
                    value={review.training_quality}
                    onChange={handleTrainingQualityChange}
                    min={1}
                    max={10}
                    step={1}
                    marks={[
                      { value: 1, label: 'Poor' },
                      { value: 5, label: 'Average' },
                      { value: 10, label: 'Excellent' },
                    ]}
                    color={getSliderColor(review.training_quality)}
                    mb="lg"
                  />
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Text weight={500} mb="md">Physical Progress</Text>
                  <Slider
                    value={review.physical_progress}
                    onChange={handlePhysicalProgressChange}
                    min={1}
                    max={10}
                    step={1}
                    marks={[
                      { value: 1, label: 'None' },
                      { value: 5, label: 'Some' },
                      { value: 10, label: 'Significant' },
                    ]}
                    color={getSliderColor(review.physical_progress)}
                    mb="lg"
                  />
                </Paper>
              </Stack>

              <Stack spacing="lg">
                <Paper p="md" radius="md" withBorder>
                  <Text weight={500} mb="md">Recovery Quality</Text>
                  <Slider
                    value={review.recovery_quality}
                    onChange={handleRecoveryQualityChange}
                    min={1}
                    max={10}
                    step={1}
                    marks={[
                      { value: 1, label: 'Poor' },
                      { value: 5, label: 'Average' },
                      { value: 10, label: 'Excellent' },
                    ]}
                    color={getSliderColor(review.recovery_quality)}
                    mb="lg"
                  />
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Text weight={500} mb="md">Mental State</Text>
                  <Slider
                    value={review.mental_state}
                    onChange={handleMentalStateChange}
                    min={1}
                    max={10}
                    step={1}
                    marks={[
                      { value: 1, label: 'Struggling' },
                      { value: 5, label: 'Stable' },
                      { value: 10, label: 'Excellent' },
                    ]}
                    color={getSliderColor(review.mental_state)}
                    mb="lg"
                  />
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Text weight={500} mb="md">Areas That Went Well</Text>
                  <MultiSelect
                    data={trainingAreas}
                    value={review.positive_aspects}
                    onChange={handlePositiveAspectsChange}
                    placeholder="Select areas that went well"
                    searchable
                    mb="md"
                  />
                  
                  <Text weight={500} mb="md">Areas For Improvement</Text>
                  <MultiSelect
                    data={trainingAreas}
                    value={review.improvement_areas}
                    onChange={handleImprovementAreasChange}
                    placeholder="Select areas to improve"
                    searchable
                    mb="md"
                  />
                </Paper>
              </Stack>
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="goals">
            <Title order={3} mb="lg">Goals & Progress</Title>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
              <Stack spacing="lg">
                <Paper p="md" radius="md" withBorder>
                  <Text weight={500} mb="md">Goals Progress Rating</Text>
                  <Slider
                    value={review.goals_progress}
                    onChange={handleGoalsProgressChange}
                    min={1}
                    max={10}
                    step={1}
                    marks={[
                      { value: 1, label: 'Off Track' },
                      { value: 5, label: 'Progressing' },
                      { value: 10, label: 'Exceeded' },
                    ]}
                    color={getSliderColor(review.goals_progress)}
                    mb="md"
                  />
                  
                  {previousReview && (
                    <Group position="apart">
                      <Text size="sm">Last week's rating:</Text>
                      <Text size="sm" weight={500}>{previousReview.goals_progress}/10</Text>
                    </Group>
                  )}
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Text weight={500} mb="md">Goals Accomplished</Text>
                  <MultiSelect
                    data={commonGoals}
                    value={review.goals_completed}
                    onChange={handleGoalsCompletedChange}
                    placeholder="Select goals you accomplished"
                    searchable
                    creatable
                    getCreateLabel={(query) => `+ Add "${query}"`}
                    mb="lg"
                  />
                </Paper>
                
                <Paper p="md" radius="md" withBorder>
                  <Text weight={500} mb="md">Focus for Next Week</Text>
                  <Textarea
                    placeholder="What's your main focus for the upcoming week?"
                    value={review.next_week_focus}
                    onChange={handleNextWeekFocusChange}
                    minRows={4}
                  />
                </Paper>
              </Stack>

              <Stack spacing="lg">
                <Paper p="md" radius="md" withBorder>
                  <Text weight={500} mb="md">Goals for Next Week</Text>
                  <MultiSelect
                    data={commonGoals}
                    value={review.new_goals}
                    onChange={handleNewGoalsChange}
                    placeholder="Set goals for the upcoming week"
                    searchable
                    creatable
                    getCreateLabel={(query) => `+ Add "${query}"`}
                    mb="lg"
                  />
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Text weight={500} mb="md">Progress Visualization</Text>
                  {workouts.length > 0 ? (
                    <Box>
                      <Group position="apart" mb="sm">
                        <Text color="dimmed">Weekly workouts completed:</Text>
                        <Text weight={500}>{workouts.length}</Text>
                      </Group>
                      <Progress 
                        value={(workouts.length / 7) * 100}
                        color="blue"
                        size="xl"
                        radius="xl"
                        mb="md"
                      />

                      <Divider my="md" />

                      <Group position="apart" mb="sm">
                        <Text color="dimmed">Goal progress:</Text>
                        <Text weight={500}>{review.goals_progress}/10</Text>
                      </Group>
                      <Progress 
                        value={review.goals_progress * 10}
                        color={getSliderColor(review.goals_progress)}
                        size="xl"
                        radius="xl"
                        mb="md"
                      />
                    </Box>
                  ) : (
                    <Text color="dimmed" align="center" py="md">
                      No workout data available for this week.
                    </Text>
                  )}
                </Paper>

                {previousReview && previousReview.new_goals && previousReview.new_goals.length > 0 && (
                  <Paper p="md" radius="md" withBorder>
                    <Text weight={500} mb="md">Last Week's Goals</Text>
                    <Box>
                      {previousReview.new_goals.map((goal, index) => {
                        const goalObj = commonGoals.find(g => g.value === goal) || { label: goal };
                        const isCompleted = review.goals_completed.includes(goal);
                        
                        return (
                          <Group key={index} position="apart" mb="xs">
                            <Text 
                              style={{ 
                                textDecoration: isCompleted ? 'line-through' : 'none',
                                opacity: isCompleted ? 0.7 : 1 
                              }}
                            >
                              {goalObj.label}
                            </Text>
                            <Text 
                              color={isCompleted ? 'green' : 'red'}
                              weight={500}
                            >
                              {isCompleted ? 'Completed' : 'Not Completed'}
                            </Text>
                          </Group>
                        );
                      })}
                    </Box>
                  </Paper>
                )}
              </Stack>
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="reflection">
            <Title order={3} mb="lg">Reflection & Learning</Title>

            <Paper p="md" radius="md" withBorder mb="xl">
              <Text weight={500} mb="md">Key Learning or Insight</Text>
              <Textarea
                placeholder="What was your biggest learning or insight from this week?"
                value={review.key_learning}
                onChange={handleKeyLearningChange}
                minRows={4}
                mb="md"
              />

              <Text size="sm" color="dimmed">
                Reflecting on your experiences helps reinforce learning and identify patterns in your training.
              </Text>
            </Paper>

            {/* Coach feedback section - typically read-only for athletes */}
            <Paper p="md" radius="md" withBorder>
              <Group mb="md">
                <IconTrophy size={24} color={theme.colors.amber[6]} />
                <Text weight={600} size="lg">Coach Feedback</Text>
              </Group>
              
              {review.coach_feedback ? (
                <Box p="md" bg="gray.0" radius="md">
                  <Text>{review.coach_feedback}</Text>
                </Box>
              ) : (
                <Text color="dimmed" align="center" py="lg">
                  No coach feedback available yet. Your coach will provide feedback after reviewing your submission.
                </Text>
              )}
            </Paper>
          </Tabs.Panel>
        </Tabs>

        <Group position="right" mt="xl">
          <Button
            onClick={handleSubmit}
            loading={saving}
            size="lg"
          >
            {hasExistingReview ? 'Update Review' : 'Complete Review'}
          </Button>
        </Group>
      </Paper>
    </Box>
  );
};

export default WeeklyReview;