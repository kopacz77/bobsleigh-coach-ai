import React, { useState } from 'react';
import {
  Box,
  Title,
  Text,
  Group,
  Paper,
  SimpleGrid,
  Button,
  NumberInput,
  Select,
  Textarea,
  Slider,
  useMantineTheme,
  ThemeIcon,
  Stack
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  IconRun,
  IconWeight,
  IconHeartbeat,
  IconBarbell,
  IconDeviceFloppy,
  IconArrowRight
} from '@tabler/icons-react';

/**
 * InitialAssessment component for capturing baseline performance metrics
 * of new athletes, focusing on bobsleigh-specific metrics
 */
const InitialAssessment = ({ userId, onComplete }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  
  // Assessment form state
  const [assessment, setAssessment] = useState({
    // General Fitness
    fitnessLevel: '3',
    experienceLevel: 'intermediate',
    weeklyTrainingHours: '',
    injuries: '',
    limitations: '',
    
    // Physical Metrics
    pushStrength: '',
    sprintSpeed: '',
    jumpHeight: '',
    threeDayFatigue: '',
    recoveryTime: '',
    
    // Perceived Levels
    perceivedEndurance: 50,
    perceivedStrength: 50,
    perceivedSpeed: 50,
    perceivedTechnique: 50,
    perceivedMental: 50,
    
    // Specific Metrics
    thirtyMeterSprint: '',
    standingBroadJump: '',
    backSquatMax: '',
    benchPressMax: '',
    pushTrackTime: ''
  });

  // Handle select changes
  const handleSelectChange = (field) => (value) => {
    setAssessment((prev) => ({ ...prev, [field]: value }));
  };

  // Handle number input changes
  const handleNumberChange = (field) => (value) => {
    setAssessment((prev) => ({ ...prev, [field]: value }));
  };

  // Handle text input changes
  const handleTextChange = (field) => (event) => {
    setAssessment((prev) => ({ ...prev, [field]: event.target.value }));
  };

  // Handle slider changes
  const handleSliderChange = (field) => (value) => {
    setAssessment((prev) => ({ ...prev, [field]: value }));
  };

  // Save assessment data
  const handleSaveAssessment = async () => {
    setLoading(true);

    try {
      // Prepare assessment data
      const assessmentData = {
        user_id: userId,
        fitness_level: assessment.fitnessLevel,
        experience_level: assessment.experienceLevel,
        weekly_training_hours: parseFloat(assessment.weeklyTrainingHours) || null,
        injuries: assessment.injuries || null,
        limitations: assessment.limitations || null,
        push_strength: assessment.pushStrength || null,
        sprint_speed: assessment.sprintSpeed || null,
        jump_height: assessment.jumpHeight || null,
        three_day_fatigue: assessment.threeDayFatigue || null,
        recovery_time: assessment.recoveryTime || null,
        perceived_endurance: assessment.perceivedEndurance,
        perceived_strength: assessment.perceivedStrength,
        perceived_speed: assessment.perceivedSpeed,
        perceived_technique: assessment.perceivedTechnique,
        perceived_mental: assessment.perceivedMental,
        thirty_meter_sprint: parseFloat(assessment.thirtyMeterSprint) || null,
        standing_broad_jump: parseFloat(assessment.standingBroadJump) || null,
        back_squat_max: parseFloat(assessment.backSquatMax) || null,
        bench_press_max: parseFloat(assessment.benchPressMax) || null,
        push_track_time: parseFloat(assessment.pushTrackTime) || null,
        assessment_date: new Date().toISOString().split('T')[0],
        is_baseline: true
      };

      // Save to athlete_assessments table
      const { error } = await supabase
        .from('athlete_assessments')
        .insert(assessmentData);

      if (error) {
        throw error;
      }

      showNotification({
        title: 'Success',
        message: 'Initial assessment saved successfully',
        color: 'green',
      });

      if (onComplete) {
        onComplete(assessmentData);
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to save initial assessment',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Group position="apart" mb="md">
        <Title order={2}>Initial Performance Assessment</Title>
        <Button
          leftIcon={<IconArrowRight size={16} />}
          variant="subtle"
          onClick={() => {
            if (onComplete) onComplete({});
          }}
        >
          Skip for now
        </Button>
      </Group>
      
      <Text color="dimmed" mb="xl">
        This initial assessment helps establish your baseline performance metrics to track progress
        and optimize your training program. Enter the information you have available - you can
        always update these metrics later as you complete tests.
      </Text>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Group mb="md">
          <IconHeartbeat size={24} color={theme.colors.red[6]} />
          <Title order={3}>General Fitness Assessment</Title>
        </Group>
        
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="md">
          <Select
            label="Current Fitness Level"
            placeholder="Select your fitness level"
            data={[
              { value: '1', label: 'Beginner - Just starting out' },
              { value: '2', label: 'Novice - Some training experience' },
              { value: '3', label: 'Intermediate - Regular training' },
              { value: '4', label: 'Advanced - Consistent athlete' },
              { value: '5', label: 'Elite - Competitive athlete' }
            ]}
            value={assessment.fitnessLevel}
            onChange={handleSelectChange('fitnessLevel')}
          />
          
          <Select
            label="Bobsleigh Experience Level"
            placeholder="Select your experience level"
            data={[
              { value: 'beginner', label: 'Beginner (0-1 years)' },
              { value: 'intermediate', label: 'Intermediate (2-4 years)' },
              { value: 'advanced', label: 'Advanced (5-9 years)' },
              { value: 'elite', label: 'Elite (10+ years)' }
            ]}
            value={assessment.experienceLevel}
            onChange={handleSelectChange('experienceLevel')}
          />
        </SimpleGrid>
        
        <NumberInput
          label="Current Weekly Training Hours"
          placeholder="Enter average hours per week"
          min={0}
          max={50}
          precision={1}
          value={assessment.weeklyTrainingHours}
          onChange={handleNumberChange('weeklyTrainingHours')}
          mb="md"
        />
        
        <Textarea
          label="Current Injuries or Limitations"
          placeholder="Describe any current injuries or physical limitations that may affect your training"
          value={assessment.limitations}
          onChange={handleTextChange('limitations')}
          minRows={3}
          mb="md"
        />
      </Paper>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Group mb="md">
          <IconRun size={24} color={theme.colors.green[6]} />
          <Title order={3}>Self-Assessment Metrics</Title>
        </Group>
        
        <Text size="sm" color="dimmed" mb="md">
          Rate your current perceived levels in the following areas
        </Text>
        
        <Stack spacing="xl">
          <Box>
            <Text weight={500} mb="xs">Endurance Level</Text>
            <Slider
              value={assessment.perceivedEndurance}
              onChange={handleSliderChange('perceivedEndurance')}
              min={0}
              max={100}
              step={1}
              label={(value) => `${value}%`}
              marks={[
                { value: 0, label: 'Needs Work' },
                { value: 50, label: 'Average' },
                { value: 100, label: 'Excellent' }
              ]}
            />
          </Box>
          
          <Box>
            <Text weight={500} mb="xs">Strength Level</Text>
            <Slider
              value={assessment.perceivedStrength}
              onChange={handleSliderChange('perceivedStrength')}
              min={0}
              max={100}
              step={1}
              label={(value) => `${value}%`}
              marks={[
                { value: 0, label: 'Needs Work' },
                { value: 50, label: 'Average' },
                { value: 100, label: 'Excellent' }
              ]}
            />
          </Box>
          
          <Box>
            <Text weight={500} mb="xs">Speed Level</Text>
            <Slider
              value={assessment.perceivedSpeed}
              onChange={handleSliderChange('perceivedSpeed')}
              min={0}
              max={100}
              step={1}
              label={(value) => `${value}%`}
              marks={[
                { value: 0, label: 'Needs Work' },
                { value: 50, label: 'Average' },
                { value: 100, label: 'Excellent' }
              ]}
            />
          </Box>
          
          <Box>
            <Text weight={500} mb="xs">Technical Skill Level</Text>
            <Slider
              value={assessment.perceivedTechnique}
              onChange={handleSliderChange('perceivedTechnique')}
              min={0}
              max={100}
              step={1}
              label={(value) => `${value}%`}
              marks={[
                { value: 0, label: 'Needs Work' },
                { value: 50, label: 'Average' },
                { value: 100, label: 'Excellent' }
              ]}
            />
          </Box>
          
          <Box>
            <Text weight={500} mb="xs">Mental Readiness</Text>
            <Slider
              value={assessment.perceivedMental}
              onChange={handleSliderChange('perceivedMental')}
              min={0}
              max={100}
              step={1}
              label={(value) => `${value}%`}
              marks={[
                { value: 0, label: 'Needs Work' },
                { value: 50, label: 'Average' },
                { value: 100, label: 'Excellent' }
              ]}
            />
          </Box>
        </Stack>
      </Paper>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Group mb="md">
          <IconBarbell size={24} color={theme.colors.blue[6]} />
          <Title order={3}>Specific Performance Metrics</Title>
        </Group>
        
        <Text size="sm" color="dimmed" mb="md">
          Enter your most recent results for these bobsleigh-specific metrics if available.
          Leave blank if you haven't completed these tests recently.
        </Text>
        
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="md">
          <NumberInput
            label="30m Sprint Time (seconds)"
            placeholder="e.g., 4.21"
            precision={2}
            min={0}
            step={0.01}
            value={assessment.thirtyMeterSprint}
            onChange={handleNumberChange('thirtyMeterSprint')}
          />
          
          <NumberInput
            label="Standing Broad Jump (cm)"
            placeholder="e.g., 250"
            precision={0}
            min={0}
            value={assessment.standingBroadJump}
            onChange={handleNumberChange('standingBroadJump')}
          />
        </SimpleGrid>
        
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="md">
          <NumberInput
            label="Back Squat 1RM (kg)"
            placeholder="e.g., 150"
            precision={1}
            min={0}
            value={assessment.backSquatMax}
            onChange={handleNumberChange('backSquatMax')}
          />
          
          <NumberInput
            label="Bench Press 1RM (kg)"
            placeholder="e.g., 100"
            precision={1}
            min={0}
            value={assessment.benchPressMax}
            onChange={handleNumberChange('benchPressMax')}
          />
        </SimpleGrid>
        
        <NumberInput
          label="Push Track Time (seconds)"
          placeholder="Enter push track time if available"
          precision={2}
          min={0}
          step={0.01}
          value={assessment.pushTrackTime}
          onChange={handleNumberChange('pushTrackTime')}
        />
      </Paper>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Group mb="md">
          <IconWeight size={24} color={theme.colors.orange[6]} />
          <Title order={3}>Recovery Profile</Title>
        </Group>
        
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Select
            label="Average Recovery Time"
            placeholder="How long does it typically take you to recover?"
            data={[
              { value: 'fast', label: 'Fast (12-24 hours)' },
              { value: 'average', label: 'Average (24-48 hours)' },
              { value: 'slow', label: 'Slow (48-72+ hours)' }
            ]}
            value={assessment.recoveryTime}
            onChange={handleSelectChange('recoveryTime')}
          />
          
          <Select
            label="Fatigue After Three Days of Training"
            placeholder="How do you feel after three consecutive training days?"
            data={[
              { value: 'minimal', label: 'Minimal Fatigue' },
              { value: 'moderate', label: 'Moderate Fatigue' },
              { value: 'significant', label: 'Significant Fatigue' },
              { value: 'extreme', label: 'Extreme Fatigue' }
            ]}
            value={assessment.threeDayFatigue}
            onChange={handleSelectChange('threeDayFatigue')}
          />
        </SimpleGrid>
      </Paper>

      <Group position="right" mt="xl">
        <Button
          onClick={handleSaveAssessment}
          leftIcon={<IconDeviceFloppy size={16} />}
          loading={loading}
          size="lg"
          color="green"
        >
          Save Assessment
        </Button>
      </Group>
    </Box>
  );
};

export default InitialAssessment;