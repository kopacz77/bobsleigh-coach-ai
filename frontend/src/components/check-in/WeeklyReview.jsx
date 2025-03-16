import React, { useState, useEffect } from 'react';
import {
  Box,
  Title,
  Text,
  Group,
  Paper,
  SimpleGrid,
  Button,
  Textarea,
  Slider,
  Select,
  MultiSelect,
  Badge,
  Tabs,
  useMantineTheme,
  Progress,
  ThemeIcon
} from '@mantine/core';
import { DatePickerInput, DatePicker } from '@mantine/dates';
import { showNotification } from '@mantine/notifications';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconEqual,
  IconCalendarStats,
  IconTarget,
  IconChartBar,
  IconNotes,
  IconMedal,
  IconArrowRight,
  IconCaretRight,
  IconRun
} from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * WeeklyReview component for athletes to assess their weekly performance,
 * set goals for the upcoming week, and review progress
 */
const WeeklyReview = ({ userId }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [weekData, setWeekData] = useState([]);
  const [selectedWeekStart, setSelectedWeekStart] = useState(getStartOfWeek(new Date()));
  const [savedReview, setSavedReview] = useState(null);
  
  // Review form state
  const [review, setReview] = useState({
    week_start: getStartOfWeek(new Date()),
    overall_performance: 5,
    achievements: '',
    challenges: '',
    technique_progress: 5,
    physical_progress: 5,
    mental_progress: 5,
    goal_progress: [],
    next_week_goals: '',
    coach_feedback: '',
    focus_areas: [],
    key_learnings: ''
  });

  // Bobsleigh-specific focus areas
  const focusAreas = [
    { value: 'push_technique', label: 'Push Technique' },
    { value: 'start_speed', label: 'Start Speed' },
    { value: 'driving_line', label: 'Driving Line' },
    { value: 'entry_exit', label: 'Entry/Exit Technique' },
    { value: 'loading', label: 'Loading Technique' },
    { value: 'team_coordination', label: 'Team Coordination' },
    { value: 'strength', label: 'Strength Training' },
    { value: 'power', label: 'Power Development' },
    { value: 'sprint_mechanics', label: 'Sprint Mechanics' },
    { value: 'recovery', label: 'Recovery Strategies' },
    { value: 'mental_focus', label: 'Mental Focus' },
    { value: 'race_strategy', label: 'Race Strategy' }
  ];

  // Helper function to get the start of a week (Sunday) from a date
  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  // Helper function to format date for display
  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Generate array of dates for the selected week
  function getWeekDates(startDate) {
    const dates = [];
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  // Fetch existing review data for the selected week
  useEffect(() => {
    const fetchReview = async () => {
      try {
        const weekStartString = selectedWeekStart.toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('weekly_reviews')
          .select('*')
          .eq('user_id', userId)
          .eq('week_start', weekStartString)
          .single();

        if (error && error.code !== 'PGRST116') { // Code for no rows returned
          console.error('Error fetching weekly review:', error);
          return;
        }

        if (data) {
          setSavedReview(data);
          setReview({
            week_start: new Date(data.week_start),
            overall_performance: data.overall_performance,
            achievements: data.achievements || '',
            challenges: data.challenges || '',
            technique_progress: data.technique_progress,
            physical_progress: data.physical_progress,
            mental_progress: data.mental_progress,
            goal_progress: data.goal_progress || [],
            next_week_goals: data.next_week_goals || '',
            coach_feedback: data.coach_feedback || '',
            focus_areas: data.focus_areas || [],
            key_learnings: data.key_learnings || ''
          });
        } else {
          // Reset form for new week
          setReview({
            week_start: selectedWeekStart,
            overall_performance: 5,
            achievements: '',
            challenges: '',
            technique_progress: 5,
            physical_progress: 5,
            mental_progress: 5,
            goal_progress: [],
            next_week_goals: '',
            coach_feedback: '',
            focus_areas: [],
            key_learnings: ''
          });
          setSavedReview(null);
        }
      } catch (error) {
        console.error('Error in weekly review fetch:', error);
      }
    };

    // Fetch daily check-in data for the week
    const fetchWeekData = async () => {
      try {
        const weekDates = getWeekDates(selectedWeekStart);
        const startDate = weekDates[0].toISOString().split('T')[0];
        const endDate = weekDates[6].toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('daily_checkins')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date');

        if (error) {
          console.error('Error fetching week data:', error);
          return;
        }

        setWeekData(data || []);
      } catch (error) {
        console.error('Error in week data fetch:', error);
      }
    };

    if (userId) {
      fetchReview();
      fetchWeekData();
    }
  }, [userId, selectedWeekStart, supabase]);

  // Handle week selection change
  const handleWeekChange = (date) => {
    setSelectedWeekStart(getStartOfWeek(date));
  };

  // Handle text input changes
  const handleTextChange = (field) => (event) => {
    setReview((prev) => ({ ...prev, [field]: event.target.value }));
  };

  // Handle slider changes
  const handleSliderChange = (field) => (value) => {
    setReview((prev) => ({ ...prev, [field]: value }));
  };

  // Handle focus areas selection
  const handleFocusAreasChange = (values) => {
    setReview((prev) => ({ ...prev, focus_areas: values }));
  };

  // Submit review
  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const reviewData = {
        user_id: userId,
        week_start: review.week_start.toISOString().split('T')[0],
        overall_performance: review.overall_performance,
        achievements: review.achievements,
        challenges: review.challenges,
        technique_progress: review.technique_progress,
        physical_progress: review.physical_progress,
        mental_progress: review.mental_progress,
        goal_progress: review.goal_progress,
        next_week_goals: review.next_week_goals,
        coach_feedback: review.coach_feedback,
        focus_areas: review.focus_areas,
        key_learnings: review.key_learnings
      };

      let query;
      
      if (savedReview) {
        // Update existing review
        query = supabase
          .from('weekly_reviews')
          .update(reviewData)
          .eq('id', savedReview.id);
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
        message: 'Weekly review saved successfully',
        color: 'green',
      });

      // Refresh data
      const { data } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', reviewData.week_start)
        .single();

      if (data) {
        setSavedReview(data);
      }
    } catch (error) {
      console.error('Error saving weekly review:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to save weekly review',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine slider color based on value
  const getSliderColor = (value) => {
    if (value <= 3) return theme.colors.red[6];
    if (value <= 6) return theme.colors.yellow[6];
    return theme.colors.green[6];
  };

  // Calculate averages from daily check-ins
  const calculateAverages = () => {
    if (!weekData.length) return null;

    const metrics = {
      sleep_quality: 0,
      fatigue_level: 0,
      muscle_soreness: 0,
      mental_readiness: 0,
      nutrition_quality: 0,
      hydration_level: 0,
      readiness_scores: []
    };

    weekData.forEach(day => {
      metrics.sleep_quality += day.sleep_quality || 0;
      metrics.fatigue_level += day.fatigue_level || 0;
      metrics.muscle_soreness += day.muscle_soreness || 0;
      metrics.mental_readiness += day.mental_readiness || 0;
      metrics.nutrition_quality += day.nutrition_quality || 0;
      metrics.hydration_level += day.hydration_level || 0;

      // Calculate readiness score for each day
      const readinessScore = Math.round(
        (day.sleep_quality * 1.2 + 
        (11 - day.fatigue_level) * 1.2 + 
        (11 - day.muscle_soreness) * 1.0 + 
        day.mental_readiness * 1.5 + 
        day.nutrition_quality * 0.7 + 
        day.hydration_level * 0.7) / 6.3
      );

      metrics.readiness_scores.push(readinessScore);
    });

    // Calculate averages
    const count = weekData.length;
    return {
      sleep_quality: (metrics.sleep_quality / count).toFixed(1),
      fatigue_level: (metrics.fatigue_level / count).toFixed(1),
      muscle_soreness: (metrics.muscle_soreness / count).toFixed(1),
      mental_readiness: (metrics.mental_readiness / count).toFixed(1),
      nutrition_quality: (metrics.nutrition_quality / count).toFixed(1),
      hydration_level: (metrics.hydration_level / count).toFixed(1),
      avg_readiness: (metrics.readiness_scores.reduce((a, b) => a + b, 0) / count).toFixed(1),
      readiness_scores: metrics.readiness_scores
    };
  };

  // Prepare chart data for weekly metrics
  const prepareChartData = () => {
    if (!weekData.length) return [];

    const weekDates = getWeekDates(selectedWeekStart);
    const formattedDates = weekDates.map(date => formatDate(date));
    
    // Prepare data with all dates, filled with null values initially
    const chartData = formattedDates.map(date => ({
      date,
      readiness: null,
      fatigue: null,
      soreness: null,
      mental: null
    }));

    // Fill in actual values from week data
    weekData.forEach(day => {
      const dayIndex = weekDates.findIndex(date => 
        date.toISOString().split('T')[0] === day.date
      );
      
      if (dayIndex !== -1) {
        // Calculate readiness score
        const readinessScore = Math.round(
          (day.sleep_quality * 1.2 + 
          (11 - day.fatigue_level) * 1.2 + 
          (11 - day.muscle_soreness) * 1.0 + 
          day.mental_readiness * 1.5 + 
          day.nutrition_quality * 0.7 + 
          day.hydration_level * 0.7) / 6.3
        );

        chartData[dayIndex] = {
          ...chartData[dayIndex],
          readiness: readinessScore,
          fatigue: day.fatigue_level,
          soreness: day.muscle_soreness,
          mental: day.mental_readiness
        };
      }
    });

    return chartData;
  };

  const averages = calculateAverages();
  const chartData = prepareChartData();

  return (
    <Box>
      <Title order={2} mb="md">Weekly Performance Review</Title>
      <Text color="dimmed" mb="xl">
        Review your past week's performance, set goals for the upcoming week, and track your progress.
        This helps identify patterns and improve your training program.
      </Text>

      <Group position="apart" mb="xl">
        <Group>
          <IconCalendarStats size={24} color={theme.colors.blue[6]} />
          <Title order={3}>Week of {formatDate(selectedWeekStart)} - {formatDate(getWeekDates(selectedWeekStart)[6])}</Title>
        </Group>
        
        <DatePicker
          type="default"
          value={selectedWeekStart}
          onChange={handleWeekChange}
          firstDayOfWeek={0}
          maxDate={new Date()}
          hideOutsideDates
          styles={{ root: { maxWidth: 300 } }}
        />
      </Group>

      <Tabs defaultValue="summary">
        <Tabs.List mb="md">
          <Tabs.Tab value="summary" icon={<IconChartBar size={14} />}>Weekly Summary</Tabs.Tab>
          <Tabs.Tab value="goals" icon={<IconTarget size={14} />}>Goals & Progress</Tabs.Tab>
          <Tabs.Tab value="notes" icon={<IconNotes size={14} />}>Reflections</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="summary">
          {weekData.length > 0 ? (
            <>
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
                <Paper p="md" radius="md" withBorder>
                  <Text weight={600} size="lg" mb="md">Weekly Readiness Trend</Text>
                  
                  <Box style={{ height: 270 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="readiness" 
                          name="Readiness Score" 
                          stroke={theme.colors.blue[6]} 
                          strokeWidth={2} 
                          connectNulls 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Text weight={600} size="lg" mb="md">Weekly Metrics</Text>
                  
                  <Box style={{ height: 270 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="fatigue" 
                          name="Fatigue" 
                          stroke={theme.colors.red[6]} 
                          strokeWidth={2} 
                          connectNulls 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="soreness" 
                          name="Soreness" 
                          stroke={theme.colors.orange[6]} 
                          strokeWidth={2} 
                          connectNulls 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="mental" 
                          name="Mental Readiness" 
                          stroke={theme.colors.violet[6]} 
                          strokeWidth={2} 
                          connectNulls 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="xl">
                <Paper p="md" radius="md" withBorder>
                  <Text align="center" size="sm" color="dimmed" mb="xs">Average Readiness</Text>
                  <Text align="center" weight={700} size="xl" mb="xs" color={getSliderColor(parseFloat(averages.avg_readiness))}>
                    {averages.avg_readiness}/10
                  </Text>
                  
                  <Progress 
                    value={(parseFloat(averages.avg_readiness) / 10) * 100} 
                    color={getSliderColor(parseFloat(averages.avg_readiness))} 
                    size="md" 
                    radius="xl" 
                  />
                </Paper>
                
                <Paper p="md" radius="md" withBorder>
                  <Text align="center" size="sm" color="dimmed" mb="xs">Sleep Quality</Text>
                  <Text align="center" weight={700} size="xl" mb="xs" color={getSliderColor(parseFloat(averages.sleep_quality))}>
                    {averages.sleep_quality}/10
                  </Text>
                  
                  <Progress 
                    value={(parseFloat(averages.sleep_quality) / 10) * 100} 
                    color={getSliderColor(parseFloat(averages.sleep_quality))} 
                    size="md" 
                    radius="xl" 
                  />
                </Paper>
                
                <Paper p="md" radius="md" withBorder>
                  <Text align="center" size="sm" color="dimmed" mb="xs">Mental Readiness</Text>
                  <Text align="center" weight={700} size="xl" mb="xs" color={getSliderColor(parseFloat(averages.mental_readiness))}>
                    {averages.mental_readiness}/10
                  </Text>
                  
                  <Progress 
                    value={(parseFloat(averages.mental_readiness) / 10) * 100} 
                    color={getSliderColor(parseFloat(averages.mental_readiness))} 
                    size="md" 
                    radius="xl" 
                  />
                </Paper>
              </SimpleGrid>
            </>
          ) : (
            <Paper p="xl" radius="md" withBorder>
              <Text align="center" size="lg" weight={500} mb="md">
                No check-in data available for this week
              </Text>
              <Text align="center" color="dimmed">
                Complete your daily check-ins to see your weekly metrics and trends
              </Text>
            </Paper>
          )}

          <Paper p="md" radius="md" withBorder mb="xl">
            <Text weight={600} size="lg" mb="md">Overall Performance Rating</Text>
            <Text size="sm" color="dimmed" mb="md">
              How would you rate your overall performance this week?
            </Text>
            
            <Slider
              value={review.overall_performance}
              onChange={handleSliderChange('overall_performance')}
              min={1}
              max={10}
              step={1}
              marks={[
                { value: 1, label: 'Poor' },
                { value: 5, label: 'Average' },
                { value: 10, label: 'Excellent' },
              ]}
              color={getSliderColor(review.overall_performance)}
              mb="lg"
              labelAlwaysOn
            />
          </Paper>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="xl">
            <Paper p="md" radius="md" withBorder>
              <Group mb="xs">
                <IconRun size={20} color={theme.colors.green[6]} />
                <Text weight={600}>Technique Progress</Text>
              </Group>
              
              <Slider
                value={review.technique_progress}
                onChange={handleSliderChange('technique_progress')}
                min={1}
                max={10}
                step={1}
                color={getSliderColor(review.technique_progress)}
                mb="lg"
              />
            </Paper>
            
            <Paper p="md" radius="md" withBorder>
              <Group mb="xs">
                <IconMedal size={20} color={theme.colors.blue[6]} />
                <Text weight={600}>Physical Progress</Text>
              </Group>
              
              <Slider
                value={review.physical_progress}
                onChange={handleSliderChange('physical_progress')}
                min={1}
                max={10}
                step={1}
                color={getSliderColor(review.physical_progress)}
                mb="lg"
              />
            </Paper>
            
            <Paper p="md" radius="md" withBorder>
              <Group mb="xs">
                <IconTarget size={20} color={theme.colors.violet[6]} />
                <Text weight={600}>Mental Progress</Text>
              </Group>
              
              <Slider
                value={review.mental_progress}
                onChange={handleSliderChange('mental_progress')}
                min={1}
                max={10}
                step={1}
                color={getSliderColor(review.mental_progress)}
                mb="lg"
              />
            </Paper>
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="goals">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
            <Paper p="md" radius="md" withBorder>
              <Group mb="md">
                <IconMedal size={24} color={theme.colors.yellow[6]} />
                <Text weight={600} size="lg">Key Achievements</Text>
              </Group>
              
              <Textarea
                placeholder="What were your biggest achievements or wins this week?"
                value={review.achievements}
                onChange={handleTextChange('achievements')}
                minRows={5}
                mb="md"
              />
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group mb="md">
                <IconTrendingDown size={24} color={theme.colors.red[6]} />
                <Text weight={600} size="lg">Challenges Faced</Text>
              </Group>
              
              <Textarea
                placeholder="What challenges or setbacks did you encounter?"
                value={review.challenges}
                onChange={handleTextChange('challenges')}
                minRows={5}
                mb="md"
              />
            </Paper>
          </SimpleGrid>

          <Paper p="md" radius="md" withBorder mb="xl">
            <Group mb="md">
              <IconTarget size={24} color={theme.colors.blue[6]} />
              <Text weight={600} size="lg">Focus Areas for Next Week</Text>
            </Group>
            
            <MultiSelect
              data={focusAreas}
              value={review.focus_areas}
              onChange={handleFocusAreasChange}
              placeholder="Select areas to focus on"
              mb="lg"
            />
            
            <Text weight={500} mb="md">Next Week's Goals</Text>
            <Textarea
              placeholder="What specific goals do you want to achieve next week?"
              value={review.next_week_goals}
              onChange={handleTextChange('next_week_goals')}
              minRows={4}
              mb="md"
            />
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="notes">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
            <Paper p="md" radius="md" withBorder>
              <Group mb="md">
                <IconCaretRight size={24} color={theme.colors.green[6]} />
                <Text weight={600} size="lg">Key Learnings</Text>
              </Group>
              
              <Textarea
                placeholder="What important lessons or insights did you gain this week?"
                value={review.key_learnings}
                onChange={handleTextChange('key_learnings')}
                minRows={6}
                mb="md"
              />
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group mb="md">
                <IconNotes size={24} color={theme.colors.orange[6]} />
                <Text weight={600} size="lg">Coach Feedback</Text>
              </Group>
              
              <Text size="sm" color="dimmed" mb="md">
                Feedback from your coach will appear here.
              </Text>
              
              <Textarea
                value={review.coach_feedback}
                onChange={handleTextChange('coach_feedback')}
                minRows={6}
                mb="md"
                disabled={true}
                placeholder="No coach feedback available yet"
              />
            </Paper>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      <Group position="right" mt="xl">
        <Button
          onClick={handleSubmit}
          loading={loading}
          size="lg"
          variant="filled"
          color="blue"
        >
          {savedReview ? 'Update Review' : 'Save Weekly Review'}
        </Button>
      </Group>
    </Box>
  );
};

export default WeeklyReview;