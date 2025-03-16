import React, { useState } from 'react';
import {
  Box,
  Title,
  Text,
  Group,
  Paper,
  SimpleGrid,
  Button,
  Select,
  MultiSelect,
  Checkbox,
  Radio,
  TimeInput,
  useMantineTheme,
  ThemeIcon,
  Stack
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  IconClock,
  IconCalendarEvent,
  IconDeviceFloppy,
  IconBarbell,
  IconHeartbeat,
  IconArrowRight
} from '@tabler/icons-react';

/**
 * TrainingPreferences component allows athletes to set their availability
 * and training preferences specifically for bobsleigh training
 */
const TrainingPreferences = ({ userId, onComplete }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  
  // Training preferences form state
  const [preferences, setPreferences] = useState({
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    preferredTime: 'morning',
    trainingDays: '5',
    preferredStartTime: '08:00',
    preferredEndTime: '10:00',
    maxSessionDuration: '120',
    restDayPreference: ['sunday', 'saturday'],
    preferredTrainingTypes: [],
    recoveryMethods: [],
    notifications: true,
    reminders: true,
    adaptiveTraining: true,
    preferredTrainingStyle: 'structured'
  });

  // Bobsleigh training types
  const trainingTypeOptions = [
    { value: 'ice_training', label: 'On-Ice Training' },
    { value: 'push_practice', label: 'Push Start Practice' },
    { value: 'strength_training', label: 'Strength Training' },
    { value: 'sprint_training', label: 'Sprint Training' },
    { value: 'plyometrics', label: 'Plyometrics' },
    { value: 'technical_drills', label: 'Technical Drills' },
    { value: 'video_analysis', label: 'Video Analysis' },
    { value: 'mental_training', label: 'Mental Training' },
    { value: 'recovery_sessions', label: 'Recovery Sessions' },
    { value: 'team_training', label: 'Team Training' },
  ];

  // Recovery methods
  const recoveryOptions = [
    { value: 'active_recovery', label: 'Active Recovery' },
    { value: 'stretching', label: 'Stretching' },
    { value: 'massage', label: 'Massage' },
    { value: 'ice_bath', label: 'Ice Bath' },
    { value: 'compression', label: 'Compression' },
    { value: 'foam_rolling', label: 'Foam Rolling' },
    { value: 'meditation', label: 'Meditation' },
    { value: 'sleep_optimization', label: 'Sleep Optimization' },
    { value: 'nutrition', label: 'Nutrition Strategies' },
  ];

  // Handle checkbox changes for availability
  const handleAvailabilityChange = (day) => (event) => {
    setPreferences((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: event.currentTarget.checked
      }
    }));
  };

  // Handle select changes
  const handleSelectChange = (field) => (value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  // Handle multi-select changes
  const handleMultiSelectChange = (field) => (value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  // Handle time input changes
  const handleTimeChange = (field) => (value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  // Toggle boolean preferences
  const handleToggle = (field) => (event) => {
    setPreferences((prev) => ({ ...prev, [field]: event.currentTarget.checked }));
  };

  // Save training preferences
  const handleSavePreferences = async () => {
    setLoading(true);

    try {
      // Prepare preferences data
      const preferencesData = {
        user_id: userId,
        monday_available: preferences.availability.monday,
        tuesday_available: preferences.availability.tuesday,
        wednesday_available: preferences.availability.wednesday,
        thursday_available: preferences.availability.thursday,
        friday_available: preferences.availability.friday,
        saturday_available: preferences.availability.saturday,
        sunday_available: preferences.availability.sunday,
        preferred_time_of_day: preferences.preferredTime,
        training_days_per_week: parseInt(preferences.trainingDays),
        preferred_start_time: preferences.preferredStartTime,
        preferred_end_time: preferences.preferredEndTime,
        max_session_duration_min: parseInt(preferences.maxSessionDuration),
        rest_day_preference: preferences.restDayPreference,
        preferred_training_types: preferences.preferredTrainingTypes,
        recovery_methods: preferences.recoveryMethods,
        notifications_enabled: preferences.notifications,
        reminders_enabled: preferences.reminders,
        adaptive_training_enabled: preferences.adaptiveTraining,
        preferred_training_style: preferences.preferredTrainingStyle,
        updated_at: new Date().toISOString()
      };

      // Save to athlete_training_preferences table
      const { error } = await supabase
        .from('athlete_training_preferences')
        .upsert(preferencesData, { onConflict: 'user_id' });

      if (error) {
        throw error;
      }

      showNotification({
        title: 'Success',
        message: 'Training preferences saved successfully',
        color: 'green',
      });

      if (onComplete) {
        onComplete(preferencesData);
      }
    } catch (error) {
      console.error('Error saving training preferences:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to save training preferences',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Group position="apart" mb="md">
        <Title order={2}>Training Preferences</Title>
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
        Set your training availability and preferences to help us create an optimal training schedule for you.
      </Text>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Group mb="md">
          <IconCalendarEvent size={24} color={theme.colors.blue[6]} />
          <Title order={3}>Weekly Availability</Title>
        </Group>
        
        <Text size="sm" color="dimmed" mb="md">
          Select the days you are available for training
        </Text>
        
        <SimpleGrid cols={{ base: 2, md: 7 }} spacing="md" mb="xl">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
            const dayKey = day.toLowerCase();
            return (
              <Paper key={day} p="md" radius="md" withBorder
                sx={{
                  borderColor: preferences.availability[dayKey] ? theme.colors.blue[4] : undefined,
                  backgroundColor: preferences.availability[dayKey] ? theme.colors.blue[0] : undefined,
                }}
              >
                <Stack align="center" spacing="xs">
                  <Text weight={500}>{day}</Text>
                  <Checkbox
                    checked={preferences.availability[dayKey]}
                    onChange={handleAvailabilityChange(dayKey)}
                    size="md"
                  />
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>
        
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="md">
          <Select
            label="Preferred Training Days Per Week"
            placeholder="Select number of days"
            data={[
              { value: '3', label: '3 days/week' },
              { value: '4', label: '4 days/week' },
              { value: '5', label: '5 days/week' },
              { value: '6', label: '6 days/week' },
              { value: '7', label: '7 days/week' },
            ]}
            value={preferences.trainingDays}
            onChange={handleSelectChange('trainingDays')}
          />
          
          <Select
            label="Preferred Time of Day"
            placeholder="Select preferred time"
            data={[
              { value: 'morning', label: 'Morning (5AM-11AM)' },
              { value: 'afternoon', label: 'Afternoon (11AM-5PM)' },
              { value: 'evening', label: 'Evening (5PM-10PM)' },
              { value: 'flexible', label: 'Flexible / No Preference' },
            ]}
            value={preferences.preferredTime}
            onChange={handleSelectChange('preferredTime')}
          />
        </SimpleGrid>
        
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="md">
          <TimeInput
            label="Preferred Start Time"
            format="24"
            value={preferences.preferredStartTime}
            onChange={handleTimeChange('preferredStartTime')}
          />
          
          <TimeInput
            label="Preferred End Time"
            format="24"
            value={preferences.preferredEndTime}
            onChange={handleTimeChange('preferredEndTime')}
          />
        </SimpleGrid>
        
        <MultiSelect
          label="Preferred Rest Days"
          placeholder="Select preferred rest days"
          data={[
            { value: 'monday', label: 'Monday' },
            { value: 'tuesday', label: 'Tuesday' },
            { value: 'wednesday', label: 'Wednesday' },
            { value: 'thursday', label: 'Thursday' },
            { value: 'friday', label: 'Friday' },
            { value: 'saturday', label: 'Saturday' },
            { value: 'sunday', label: 'Sunday' },
          ]}
          value={preferences.restDayPreference}
          onChange={handleMultiSelectChange('restDayPreference')}
          mb="md"
        />
        
        <Select
          label="Maximum Session Duration (minutes)"
          placeholder="Select maximum session length"
          data={[
            { value: '60', label: '60 minutes' },
            { value: '90', label: '90 minutes' },
            { value: '120', label: '120 minutes' },
            { value: '150', label: '150 minutes' },
            { value: '180', label: '180 minutes (3 hours)' },
          ]}
          value={preferences.maxSessionDuration}
          onChange={handleSelectChange('maxSessionDuration')}
        />
      </Paper>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Group mb="md">
          <IconBarbell size={24} color={theme.colors.green[6]} />
          <Title order={3}>Training Type Preferences</Title>
        </Group>
        
        <Text size="sm" color="dimmed" mb="md">
          Select the types of training you prefer or excel in
        </Text>
        
        <MultiSelect
          placeholder="Select preferred training types"
          data={trainingTypeOptions}
          value={preferences.preferredTrainingTypes}
          onChange={handleMultiSelectChange('preferredTrainingTypes')}
          mb="xl"
        />
        
        <Text weight={500} mb="xs">Preferred Training Style</Text>
        <Radio.Group
          value={preferences.preferredTrainingStyle}
          onChange={handleSelectChange('preferredTrainingStyle')}
          mb="lg"
        >
          <Group mt="xs">
            <Radio value="structured" label="Structured (Detailed plans with specific exercises)" />
            <Radio value="flexible" label="Flexible (Goals-based with room for adjustment)" />
            <Radio value="coach_led" label="Coach-Led (Follow coach's direction)" />
          </Group>
        </Radio.Group>
      </Paper>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Group mb="md">
          <IconHeartbeat size={24} color={theme.colors.red[6]} />
          <Title order={3}>Recovery Preferences</Title>
        </Group>
        
        <Text size="sm" color="dimmed" mb="md">
          Select your preferred recovery methods
        </Text>
        
        <MultiSelect
          placeholder="Select recovery methods"
          data={recoveryOptions}
          value={preferences.recoveryMethods}
          onChange={handleMultiSelectChange('recoveryMethods')}
          mb="lg"
        />
        
        <Title order={4} mb="md">Settings & Notifications</Title>
        
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="md">
          <Group position="apart" p="md" style={{ border: '1px solid ' + theme.colors.gray[3], borderRadius: theme.radius.sm }}>
            <Text>Enable Training Notifications</Text>
            <Checkbox
              checked={preferences.notifications}
              onChange={handleToggle('notifications')}
            />
          </Group>
          
          <Group position="apart" p="md" style={{ border: '1px solid ' + theme.colors.gray[3], borderRadius: theme.radius.sm }}>
            <Text>Enable Check-in Reminders</Text>
            <Checkbox
              checked={preferences.reminders}
              onChange={handleToggle('reminders')}
            />
          </Group>
          
          <Group position="apart" p="md" style={{ border: '1px solid ' + theme.colors.gray[3], borderRadius: theme.radius.sm }}>
            <div>
              <Text>Adaptive Training</Text>
              <Text size="xs" color="dimmed">Adjust training based on daily readiness</Text>
            </div>
            <Checkbox
              checked={preferences.adaptiveTraining}
              onChange={handleToggle('adaptiveTraining')}
            />
          </Group>
        </SimpleGrid>
      </Paper>

      <Group position="right" mt="xl">
        <Button
          onClick={handleSavePreferences}
          leftIcon={<IconDeviceFloppy size={16} />}
          loading={loading}
          size="lg"
          color="green"
        >
          Save Preferences
        </Button>
      </Group>
    </Box>
  );
};

export default TrainingPreferences;