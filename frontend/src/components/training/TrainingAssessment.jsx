import React, { useState, useEffect } from 'react';
import {
  Box,
  Title,
  Text,
  Group,
  Paper,
  SimpleGrid,
  Button,
  Slider,
  TextInput,
  Textarea,
  Select,
  MultiSelect,
  NumberInput,
  Divider,
  useMantineTheme,
  List,
  ThemeIcon
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { showNotification } from '@mantine/notifications';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  IconBarbell,
  IconHeartFilled,
  IconGauge,
  IconArrowsRightLeft,
  IconMuscle,
  IconCheckbox,
  IconArrowDown,
  IconArrowUp,
  IconMinus
} from '@tabler/icons-react';

/**
 * TrainingAssessment component allows athletes to record and evaluate
 * their training sessions with detailed metrics and feedback.
 */
const TrainingAssessment = ({ userId, workoutId = null }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [workout, setWorkout] = useState(null);
  const [previousAssessment, setPreviousAssessment] = useState(null);
  
  // Assessment form state
  const [assessment, setAssessment] = useState({
    date: new Date(),
    workout_type: '',
    duration_minutes: 60,
    perceived_exertion: 5,
    technical_quality: 5,
    energy_level: 5,
    focus_level: 5,
    completed_as_planned: true,
    performance_level: 5,
    areas_of_success: [],
    areas_for_improvement: [],
    notes: '',
    coach_feedback: ''
  });

  // Training areas options
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
    { value: 'weather_adaptation', label: 'Weather Adaptation' }
  ];

  // Workout types specific to bobsleigh
  const workoutTypes = [
    { value: 'on_ice_training', label: 'On-Ice Training' },
    { value: 'push_start_practice', label: 'Push Start Practice' },
    { value: 'track_walk', label: 'Track Walk/Analysis' },
    { value: 'sled_maintenance', label: 'Sled Maintenance' },
    { value: 'strength_training', label: 'Strength Training' },
    { value: 'sprint_training', label: 'Sprint Training' },
    { value: 'plyometrics', label: 'Plyometrics' },
    { value: 'endurance_training', label: 'Endurance Training' },
    { value: 'technical_drills', label: 'Technical Drills' },
    { value: 'video_analysis', label: 'Video Analysis' },
    { value: 'competition_simulation', label: 'Competition Simulation' },
    { value: 'recovery_session', label: 'Recovery Session' },
    { value: 'team_building', label: 'Team Building' },
    { value: 'mental_training', label: 'Mental Training' }
  ];

  // Fetch workout details if workoutId is provided
  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      if (!workoutId || !userId) return;

      try {
        // Fetch workout details
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .select('*')
          .eq('id', workoutId)
          .single();

        if (workoutError) {
          console.error('Error fetching workout:', workoutError);
          return;
        }

        if (workoutData) {
          setWorkout(workoutData);
          
          // Pre-fill workout type and date
          setAssessment(prev => ({
            ...prev,
            date: new Date(workoutData.date),
            workout_type: workoutData.workout_type
          }));

          // Check if assessment already exists for this workout
          const { data: assessmentData, error: assessmentError } = await supabase
            .from('training_assessments')
            .select('*')
            .eq('workout_id', workoutId)
            .eq('user_id', userId)
            .single();

          if (assessmentError && assessmentError.code !== 'PGRST116') { // Code for no rows returned
            console.error('Error fetching assessment:', assessmentError);
            return;
          }

          if (assessmentData) {
            // Pre-fill form with existing assessment data
            setAssessment({
              id: assessmentData.id,
              date: new Date(assessmentData.date),
              workout_type: assessmentData.workout_type,
              duration_minutes: assessmentData.duration_minutes,
              perceived_exertion: assessmentData.perceived_exertion,
              technical_quality: assessmentData.technical_quality,
              energy_level: assessmentData.energy_level,
              focus_level: assessmentData.focus_level,
              completed_as_planned: assessmentData.completed_as_planned,
              performance_level: assessmentData.performance_level,
              areas_of_success: assessmentData.areas_of_success || [],
              areas_for_improvement: assessmentData.areas_for_improvement || [],
              notes: assessmentData.notes || '',
              coach_feedback: assessmentData.coach_feedback || ''
            });
          }

          // Fetch previous assessment for comparison
          const { data: previousData } = await supabase
            .from('training_assessments')
            .select('*')
            .eq('user_id', userId)
            .eq('workout_type', workoutData.workout_type)
            .neq('workout_id', workoutId)
            .order('date', { ascending: false })
            .limit(1);

          if (previousData && previousData.length > 0) {
            setPreviousAssessment(previousData[0]);
          }
        }
      } catch (error) {
        console.error('Error in workout/assessment fetch:', error);
      }
    };

    fetchWorkoutDetails();
  }, [workoutId, userId, supabase]);

  // Handle form field changes
  const handleDateChange = (value) => setAssessment(prev => ({ ...prev, date: value }));
  const handleWorkoutTypeChange = (value) => setAssessment(prev => ({ ...prev, workout_type: value }));
  const handleDurationChange = (value) => setAssessment(prev => ({ ...prev, duration_minutes: value }));
  const handleExertionChange = (value) => setAssessment(prev => ({ ...prev, perceived_exertion: value }));
  const handleTechnicalQualityChange = (value) => setAssessment(prev => ({ ...prev, technical_quality: value }));
  const handleEnergyLevelChange = (value) => setAssessment(prev => ({ ...prev, energy_level: value }));
  const handleFocusLevelChange = (value) => setAssessment(prev => ({ ...prev, focus_level: value }));
  const handleCompletionToggle = (value) => setAssessment(prev => ({ ...prev, completed_as_planned: value }));
  const handlePerformanceLevelChange = (value) => setAssessment(prev => ({ ...prev, performance_level: value }));
  const handleSuccessAreasChange = (value) => setAssessment(prev => ({ ...prev, areas_of_success: value }));
  const handleImprovementAreasChange = (value) => setAssessment(prev => ({ ...prev, areas_for_improvement: value }));
  const handleNotesChange = (event) => setAssessment(prev => ({ ...prev, notes: event.target.value }));
  const handleCoachFeedbackChange = (event) => setAssessment(prev => ({ ...prev, coach_feedback: event.target.value }));

  // Submit assessment
  const handleSubmit = async () => {
    if (!assessment.workout_type) {
      showNotification({
        title: 'Missing Information',
        message: 'Please select a workout type',
        color: 'orange',
      });
      return;
    }

    setLoading(true);
    
    try {
      const assessmentData = {
        user_id: userId,
        workout_id: workoutId,
        date: assessment.date.toISOString().split('T')[0],
        workout_type: assessment.workout_type,
        duration_minutes: assessment.duration_minutes,
        perceived_exertion: assessment.perceived_exertion,
        technical_quality: assessment.technical_quality,
        energy_level: assessment.energy_level,
        focus_level: assessment.focus_level,
        completed_as_planned: assessment.completed_as_planned,
        performance_level: assessment.performance_level,
        areas_of_success: assessment.areas_of_success,
        areas_for_improvement: assessment.areas_for_improvement,
        notes: assessment.notes || null,
        coach_feedback: assessment.coach_feedback || null
      };

      let query;
      
      if (assessment.id) {
        // Update existing assessment
        query = supabase
          .from('training_assessments')
          .update(assessmentData)
          .eq('id', assessment.id);
      } else {
        // Insert new assessment
        query = supabase
          .from('training_assessments')
          .insert(assessmentData);
      }

      const { error } = await query;
      
      if (error) {
        throw error;
      }

      showNotification({
        title: 'Success',
        message: 'Training assessment saved successfully',
        color: 'green',
      });

      if (workout) {
        // Mark the workout as assessed
        await supabase
          .from('workouts')
          .update({ is_assessed: true })
          .eq('id', workoutId);
      }
    } catch (error) {
      console.error('Error saving training assessment:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to save training assessment',
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

  // Calculate performance change for comparison
  const getPerformanceChange = (metric) => {
    if (!previousAssessment || !assessment[metric]) return null;
    
    const diff = assessment[metric] - previousAssessment[metric];
    
    if (diff > 0) {
      return { value: `+${diff}`, direction: 'up', color: theme.colors.green[6] };
    } else if (diff < 0) {
      return { value: diff.toString(), direction: 'down', color: theme.colors.red[6] };
    } else {
      return { value: '0', direction: 'same', color: theme.colors.gray[6] };
    }
  };

  return (
    <Box>
      <Title order={2} mb="md">Training Assessment</Title>
      <Text color="dimmed" mb="xl">
        Evaluate your training session to track progress and identify areas for improvement.
      </Text>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        <Box>
          <Paper p="md" radius="md" withBorder mb="xl">
            <Text weight={600} size="lg" mb="lg">Session Details</Text>
            
            <DatePickerInput
              label="Date"
              placeholder="Select date"
              value={assessment.date}
              onChange={handleDateChange}
              maxDate={new Date()}
              clearable={false}
              mb="md"
              disabled={!!workoutId}
            />

            <Select
              label="Workout Type"
              placeholder="Select workout type"
              data={workoutTypes}
              value={assessment.workout_type}
              onChange={handleWorkoutTypeChange}
              searchable
              mb="md"
              required
              disabled={!!workoutId}
            />

            <NumberInput
              label="Duration (minutes)"
              placeholder="Enter duration"
              value={assessment.duration_minutes}
              onChange={handleDurationChange}
              min={1}
              max={720} // 12 hours max
              mb="md"
            />

            <Select
              label="Completed as Planned"
              data={[
                { value: true, label: 'Yes' },
                { value: false, label: 'No' }
              ]}
              value={assessment.completed_as_planned}
              onChange={handleCompletionToggle}
              mb="xl"
            />
          </Paper>

          <Paper p="md" radius="md" withBorder>
            <Text weight={600} size="lg" mb="lg">Subjective Evaluation</Text>

            <Box mb="xl">
              <Group mb="xs">
                <IconGauge size={20} color={theme.colors.blue[6]} />
                <Text weight={500}>Perceived Exertion (RPE)</Text>
              </Group>
              <Slider
                value={assessment.perceived_exertion}
                onChange={handleExertionChange}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: 'Very Easy' },
                  { value: 5, label: 'Moderate' },
                  { value: 10, label: 'Maximum' },
                ]}
                color={getSliderColor(assessment.perceived_exertion)}
                mb="md"
              />
            </Box>

            <Box mb="xl">
              <Group mb="xs">
                <IconArrowsRightLeft size={20} color={theme.colors.indigo[6]} />
                <Text weight={500}>Technical Quality</Text>
              </Group>
              <Slider
                value={assessment.technical_quality}
                onChange={handleTechnicalQualityChange}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: 'Poor' },
                  { value: 5, label: 'Average' },
                  { value: 10, label: 'Excellent' },
                ]}
                color={getSliderColor(assessment.technical_quality)}
                mb="md"
              />
            </Box>

            <Box mb="xl">
              <Group mb="xs">
                <IconHeartFilled size={20} color={theme.colors.red[6]} />
                <Text weight={500}>Energy Level</Text>
              </Group>
              <Slider
                value={assessment.energy_level}
                onChange={handleEnergyLevelChange}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: 'Low' },
                  { value: 5, label: 'Medium' },
                  { value: 10, label: 'High' },
                ]}
                color={getSliderColor(assessment.energy_level)}
                mb="md"
              />
            </Box>

            <Box mb="xl">
              <Group mb="xs">
                <IconMuscle size={20} color={theme.colors.grape[6]} />
                <Text weight={500}>Mental Focus</Text>
              </Group>
              <Slider
                value={assessment.focus_level}
                onChange={handleFocusLevelChange}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: 'Distracted' },
                  { value: 5, label: 'Average' },
                  { value: 10, label: 'Fully Focused' },
                ]}
                color={getSliderColor(assessment.focus_level)}
                mb="md"
              />
            </Box>

            <Box mb="md">
              <Group mb="xs">
                <IconBarbell size={20} color={theme.colors.green[6]} />
                <Text weight={500}>Overall Performance</Text>
              </Group>
              <Slider
                value={assessment.performance_level}
                onChange={handlePerformanceLevelChange}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: 'Poor' },
                  { value: 5, label: 'Average' },
                  { value: 10, label: 'Excellent' },
                ]}
                color={getSliderColor(assessment.performance_level)}
                mb="md"
              />
            </Box>
          </Paper>
        </Box>

        <Box>
          <Paper p="md" radius="md" withBorder mb="xl">
            <Text weight={600} size="lg" mb="lg">Key Areas</Text>

            <MultiSelect
              label="Areas of Success"
              placeholder="Select areas where you performed well"
              data={trainingAreas}
              value={assessment.areas_of_success}
              onChange={handleSuccessAreasChange}
              searchable
              mb="md"
            />

            <MultiSelect
              label="Areas for Improvement"
              placeholder="Select areas to focus on improving"
              data={trainingAreas}
              value={assessment.areas_for_improvement}
              onChange={handleImprovementAreasChange}
              searchable
              mb="xl"
            />

            <Textarea
              label="Notes"
              placeholder="Add any additional notes or observations about your training session"
              value={assessment.notes}
              onChange={handleNotesChange}
              minRows={4}
              mb="md"
            />
          </Paper>

          {previousAssessment && (
            <Paper p="md" radius="md" withBorder mb="xl">
              <Text weight={600} size="lg" mb="lg">Comparison with Previous {workoutTypes.find(w => w.value === assessment.workout_type)?.label}</Text>
              
              <List spacing="md">
                {['technical_quality', 'energy_level', 'focus_level', 'performance_level'].map(metric => {
                  const change = getPerformanceChange(metric);
                  if (!change) return null;
                  
                  const metricLabels = {
                    technical_quality: 'Technical Quality',
                    energy_level: 'Energy Level',
                    focus_level: 'Mental Focus',
                    performance_level: 'Overall Performance'
                  };
                  
                  return (
                    <List.Item
                      key={metric}
                      icon={
                        <ThemeIcon color={change.color} size={24} radius="xl">
                          {change.direction === 'up' ? <IconArrowUp size={16} /> : 
                           change.direction === 'down' ? <IconArrowDown size={16} /> : 
                           <IconMinus size={16} />}
                        </ThemeIcon>
                      }
                    >
                      <Group position="apart">
                        <Text>{metricLabels[metric]}</Text>
                        <Text weight={500} color={change.color}>{change.value} points</Text>
                      </Group>
                    </List.Item>
                  );
                })}
                <List.Item
                  icon={
                    <ThemeIcon color="blue" size={24} radius="xl">
                      <IconCheckbox size={16} />
                    </ThemeIcon>
                  }
                >
                  <Text>Previous session: {new Date(previousAssessment.date).toLocaleDateString()}</Text>
                </List.Item>
              </List>
            </Paper>
          )}

          <Paper p="md" radius="md" withBorder mb="xl">
            <Text weight={600} size="lg" mb="md">Coach Feedback</Text>
            <Text size="sm" color="dimmed" mb="md">
              This section can be filled out by your coach to provide feedback on your training session.
            </Text>
            
            <Textarea
              placeholder="Coach feedback will appear here"
              value={assessment.coach_feedback}
              onChange={handleCoachFeedbackChange}
              minRows={6}
              mb="md"
            />
          </Paper>

          <Group position="right" mt="xl">
            <Button
              onClick={handleSubmit}
              size="lg"
              loading={loading}
              disabled={!assessment.workout_type}
            >
              {assessment.id ? 'Update Assessment' : 'Save Assessment'}
            </Button>
          </Group>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default TrainingAssessment;