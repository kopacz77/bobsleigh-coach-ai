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
  Textarea,
  Select,
  useMantineTheme,
  Badge
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { showNotification } from '@mantine/notifications';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  IconHeartFilled,
  IconBrain,
  IconZzz,
  IconSalad,
  IconMoodNervous, // Replaced IconStress with IconMoodNervous based on previous fixes
  IconActivity, // Replaced IconMuscle with IconActivity based on previous fixes
  IconFlame
} from '@tabler/icons-react';

/**
 * Daily Check-In data from database
 */
interface CheckIn {
  id: number;
  user_id: string;
  date: string;
  sleep_quality: number;
  sleep_hours: number;
  fatigue_level: number;
  muscle_soreness: number;
  mental_readiness: number;
  nutrition_quality: number;
  hydration_level: number;
  injury_concerns: string | null;
  notes: string | null;
  training_readiness: string;
  created_at: string;
  updated_at: string;
}

/**
 * Check-in form state
 */
interface CheckInForm {
  sleep_quality: number;
  sleep_hours: number;
  fatigue_level: number;
  muscle_soreness: number;
  mental_readiness: number;
  nutrition_quality: number;
  hydration_level: number;
  injury_concerns: string;
  notes: string;
  training_readiness: string;
}

/**
 * DailyCheckIn component props
 */
interface DailyCheckInProps {
  userId: string;
  date?: Date;
}

/**
 * DailyCheckIn component for athletes to quickly log their daily wellbeing metrics
 * Focus is on bobsleigh-specific factors that impact training and performance
 */
const DailyCheckIn: React.FC<DailyCheckInProps> = ({ userId, date = new Date() }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState<boolean>(false);
  const [savedCheckIn, setSavedCheckIn] = useState<CheckIn | null>(null);
  
  // Check-in form state
  const [checkIn, setCheckIn] = useState<CheckInForm>({
    sleep_quality: 5,
    sleep_hours: 7,
    fatigue_level: 5,
    muscle_soreness: 5,
    mental_readiness: 5,
    nutrition_quality: 5,
    hydration_level: 5,
    injury_concerns: '',
    notes: '',
    training_readiness: 'ready'
  });

  const dateString = date.toISOString().split('T')[0];

  // Fetch existing check-in data for the given date
  useEffect(() => {
    const fetchCheckIn = async () => {
      try {
        const { data, error } = await supabase
          .from('daily_checkins')
          .select('*')
          .eq('user_id', userId)
          .eq('date', dateString)
          .single();

        if (error && error.code !== 'PGRST116') { // Code for no rows returned
          console.error('Error fetching daily check-in:', error);
          return;
        }

        if (data) {
          setSavedCheckIn(data as CheckIn);
          setCheckIn({
            sleep_quality: data.sleep_quality,
            sleep_hours: data.sleep_hours,
            fatigue_level: data.fatigue_level,
            muscle_soreness: data.muscle_soreness,
            mental_readiness: data.mental_readiness,
            nutrition_quality: data.nutrition_quality,
            hydration_level: data.hydration_level,
            injury_concerns: data.injury_concerns || '',
            notes: data.notes || '',
            training_readiness: data.training_readiness
          });
        }
      } catch (error) {
        console.error('Error in daily check-in fetch:', error);
      }
    };

    if (userId) {
      fetchCheckIn();
    }
  }, [userId, dateString, supabase]);

  // Handle slider changes
  const handleSliderChange = (field: keyof CheckInForm) => (value: number) => {
    setCheckIn((prev) => ({ ...prev, [field]: value }));
  };

  // Handle sleep hours change
  const handleSleepHoursChange = (value: string | null) => {
    if (value) {
      setCheckIn((prev) => ({ ...prev, sleep_hours: parseInt(value, 10) }));
    }
  };

  // Handle text input changes
  const handleTextChange = (field: keyof CheckInForm) => (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCheckIn((prev) => ({ ...prev, [field]: event.target.value }));
  };

  // Handle training readiness selection
  const handleReadinessChange = (value: string | null) => {
    if (value) {
      setCheckIn((prev) => ({ ...prev, training_readiness: value }));
    }
  };

  // Submit check-in data
  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const checkInData = {
        user_id: userId,
        date: dateString,
        ...checkIn
      };

      let query;
      
      if (savedCheckIn) {
        // Update existing check-in
        query = supabase
          .from('daily_checkins')
          .update(checkInData)
          .eq('id', savedCheckIn.id);
      } else {
        // Insert new check-in
        query = supabase
          .from('daily_checkins')
          .insert(checkInData);
      }

      const { error } = await query;
      
      if (error) {
        throw error;
      }

      showNotification({
        title: 'Success',
        message: 'Daily check-in saved successfully',
        color: 'green',
      });

      // Refresh data to get the ID if it was a new record
      if (!savedCheckIn) {
        const { data, error } = await supabase
          .from('daily_checkins')
          .select('*')
          .eq('user_id', userId)
          .eq('date', dateString)
          .single();
          
        if (!error && data) {
          setSavedCheckIn(data as CheckIn);
        }
      }
    } catch (error) {
      console.error('Error saving daily check-in:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to save daily check-in',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine slider color based on value
  const getSliderColor = (value: number, inverse = false): string => {
    if (inverse) {
      // For metrics where lower is better (like fatigue)
      if (value >= 7) return theme.colors.red[6];
      if (value >= 4) return theme.colors.yellow[6];
      return theme.colors.green[6];
    } else {
      // For metrics where higher is better (like sleep quality)
      if (value <= 3) return theme.colors.red[6];
      if (value <= 6) return theme.colors.yellow[6];
      return theme.colors.green[6];
    }
  };

  // Calculate overall readiness score
  const calculateReadinessScore = (): number => {
    const {
      sleep_quality,
      fatigue_level,
      muscle_soreness,
      mental_readiness,
      nutrition_quality,
      hydration_level
    } = checkIn;
    
    // Calculate weighted average (invert fatigue and soreness since lower is better)
    return Math.round(
      (sleep_quality * 1.2 + 
      (11 - fatigue_level) * 1.2 + 
      (11 - muscle_soreness) * 1.0 + 
      mental_readiness * 1.5 + 
      nutrition_quality * 0.7 + 
      hydration_level * 0.7) / 6.3
    );
  };

  // Get color for readiness badge
  const getReadinessColor = (status: string): string => {
    switch (status) {
      case 'ready': return 'green';
      case 'limited': return 'yellow';
      case 'recovery': return 'orange';
      case 'not_ready': return 'red';
      default: return 'blue';
    }
  };

  // Get label for readiness badge
  const getReadinessLabel = (status: string): string => {
    switch (status) {
      case 'ready': return 'Ready to Train';
      case 'limited': return 'Limited Training';
      case 'recovery': return 'Recovery Needed';
      case 'not_ready': return 'Not Ready to Train';
      default: return 'Unspecified';
    }
  };

  return (
    <Box>
      <Title order={2} mb="md">Daily Check-In</Title>
      <Text color="dimmed" mb="xl">
        Complete your daily wellness check to help optimize your training and ensure safe and effective sessions. 
        This takes less than 2 minutes and provides valuable data for your coaches.
      </Text>

      <Paper p="md" radius="md" withBorder mb="xl">
        <Group justify="apart">
          <Box>
            <Text size="xl" fw={700}>Today's Readiness</Text>
            <Text size="sm" color="dimmed" mb="md">Based on your metrics</Text>
          </Box>
          
          <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Box
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: getSliderColor(calculateReadinessScore()),
                color: '#fff',
              }}
            >
              <Text size="xl" fw={700}>{calculateReadinessScore()}</Text>
            </Box>
            
            <Badge 
              size="lg" 
              color={getReadinessColor(checkIn.training_readiness)}
              variant="filled"
            >
              {getReadinessLabel(checkIn.training_readiness)}
            </Badge>
          </Box>
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Box>
          <Paper p="md" radius="md" withBorder>
            <Group mb="xs">
              <IconZzz size={24} color={theme.colors.blue[6]} />
              <Text fw={600}>Sleep Metrics</Text>
            </Group>
            
            <Box mb="lg">
              <Text fw={500} size="sm">Sleep Quality</Text>
              <Slider
                value={checkIn.sleep_quality}
                onChange={handleSliderChange('sleep_quality')}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: 'Poor' },
                  { value: 5, label: 'Average' },
                  { value: 10, label: 'Excellent' },
                ]}
                color={getSliderColor(checkIn.sleep_quality)}
                mb="sm"
              />
            </Box>
            
            <Box mb="lg">
              <Text fw={500} size="sm">Hours of Sleep</Text>
              <Select
                value={checkIn.sleep_hours.toString()}
                onChange={handleSleepHoursChange}
                data={[
                  { value: '4', label: 'Less than 5 hours' },
                  { value: '5', label: '5 hours' },
                  { value: '6', label: '6 hours' },
                  { value: '7', label: '7 hours' },
                  { value: '8', label: '8 hours' },
                  { value: '9', label: '9 hours' },
                  { value: '10', label: '10+ hours' },
                ]}
                mb="sm"
              />
            </Box>
          </Paper>
        </Box>

        <Box>
          <Paper p="md" radius="md" withBorder>
            <Group mb="xs">
              <IconHeartFilled size={24} color={theme.colors.red[6]} />
              <Text fw={600}>Recovery Status</Text>
            </Group>
            
            <Box mb="lg">
              <Text fw={500} size="sm">Fatigue Level</Text>
              <Slider
                value={checkIn.fatigue_level}
                onChange={handleSliderChange('fatigue_level')}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: 'Fresh' },
                  { value: 5, label: 'Moderate' },
                  { value: 10, label: 'Exhausted' },
                ]}
                color={getSliderColor(checkIn.fatigue_level, true)}
                mb="sm"
              />
            </Box>
            
            <Box mb="lg">
              <Text fw={500} size="sm">Muscle Soreness</Text>
              <Slider
                value={checkIn.muscle_soreness}
                onChange={handleSliderChange('muscle_soreness')}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: 'None' },
                  { value: 5, label: 'Moderate' },
                  { value: 10, label: 'Severe' },
                ]}
                color={getSliderColor(checkIn.muscle_soreness, true)}
                mb="sm"
              />
            </Box>
          </Paper>
        </Box>

        <Box>
          <Paper p="md" radius="md" withBorder>
            <Group mb="xs">
              <IconBrain size={24} color={theme.colors.violet[6]} />
              <Text fw={600}>Mental Readiness</Text>
            </Group>
            
            <Box mb="lg">
              <Text fw={500} size="sm">Mental Focus & Readiness</Text>
              <Slider
                value={checkIn.mental_readiness}
                onChange={handleSliderChange('mental_readiness')}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: 'Distracted' },
                  { value: 5, label: 'Average' },
                  { value: 10, label: 'Fully Focused' },
                ]}
                color={getSliderColor(checkIn.mental_readiness)}
                mb="sm"
              />
            </Box>
          </Paper>
        </Box>

        <Box>
          <Paper p="md" radius="md" withBorder>
            <Group mb="xs">
              <IconSalad size={24} color={theme.colors.green[6]} />
              <Text fw={600}>Nutrition & Hydration</Text>
            </Group>
            
            <Box mb="lg">
              <Text fw={500} size="sm">Nutrition Quality</Text>
              <Slider
                value={checkIn.nutrition_quality}
                onChange={handleSliderChange('nutrition_quality')}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: 'Poor' },
                  { value: 5, label: 'Average' },
                  { value: 10, label: 'Excellent' },
                ]}
                color={getSliderColor(checkIn.nutrition_quality)}
                mb="sm"
              />
            </Box>
            
            <Box mb="lg">
              <Text fw={500} size="sm">Hydration Level</Text>
              <Slider
                value={checkIn.hydration_level}
                onChange={handleSliderChange('hydration_level')}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: 'Dehydrated' },
                  { value: 5, label: 'Adequate' },
                  { value: 10, label: 'Optimal' },
                ]}
                color={getSliderColor(checkIn.hydration_level)}
                mb="sm"
              />
            </Box>
          </Paper>
        </Box>
      </SimpleGrid>

      <Paper p="md" radius="md" withBorder mt="xl">
        <Group mb="xs">
          <IconActivity size={24} color={theme.colors.orange[6]} />
          <Text fw={600}>Injury & Concerns</Text>
        </Group>
        
        <Textarea
          placeholder="Note any injury concerns, pain points, or physical limitations that may affect today's training"
          value={checkIn.injury_concerns}
          onChange={handleTextChange('injury_concerns')}
          minRows={2}
          mb="lg"
        />
        
        <Text fw={500} size="sm" mb="xs">Today's Training Readiness</Text>
        <Select
          value={checkIn.training_readiness}
          onChange={handleReadinessChange}
          data={[
            { value: 'ready', label: 'Ready to Train (Full Intensity)' },
            { value: 'limited', label: 'Limited Training (Moderate Intensity)' },
            { value: 'recovery', label: 'Recovery Needed (Light Activity Only)' },
            { value: 'not_ready', label: 'Not Ready to Train (Rest Day)' }
          ]}
          mb="lg"
        />
        
        <Text fw={500} size="sm" mb="xs">Additional Notes</Text>
        <Textarea
          placeholder="Any other relevant information about your current status"
          value={checkIn.notes}
          onChange={handleTextChange('notes')}
          minRows={3}
          mb="md"
        />

        <Group justify="right">
          <Button
            onClick={handleSubmit}
            loading={loading}
            variant="filled"
            color="blue"
            leftSection={<IconFlame size={20} />}
          >
            {savedCheckIn ? 'Update Check-In' : 'Submit Check-In'}
          </Button>
        </Group>
      </Paper>
    </Box>
  );
};

export default DailyCheckIn;