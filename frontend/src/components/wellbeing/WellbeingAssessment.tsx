import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Title, 
  Text, 
  SimpleGrid, 
  Paper, 
  Slider, 
  Group, 
  Button, 
  Textarea, 
  Stack,
  useMantineTheme
} from '@mantine/core';
import { IconHeartFilled, IconBrain, IconZzz, IconSalad, IconStress } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

/**
 * WellbeingAssessment props interface
 */
interface WellbeingAssessmentProps {
  userId: string;
  date?: Date;
}

/**
 * Assessment data interface
 */
interface AssessmentData {
  sleep_quality: number;
  stress_level: number;
  nutrition_quality: number;
  physical_readiness: number;
  mental_clarity: number;
  notes: string;
}

/**
 * Saved assessment data from DB
 */
interface SavedAssessment extends AssessmentData {
  id: number;
  user_id: string;
  date: string;
  created_at: string;
  updated_at: string;
}

/**
 * WellbeingAssessment component allows athletes to track various wellbeing metrics
 * including sleep quality, stress levels, nutrition quality, physical readiness,
 * and mental clarity.
 */
const WellbeingAssessment: React.FC<WellbeingAssessmentProps> = ({ userId, date = new Date() }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState<boolean>(false);
  const [savedAssessment, setSavedAssessment] = useState<SavedAssessment | null>(null);
  
  // Assessment form state
  const [assessment, setAssessment] = useState<AssessmentData>({
    sleep_quality: 5,
    stress_level: 5,
    nutrition_quality: 5,
    physical_readiness: 5,
    mental_clarity: 5,
    notes: '',
  });

  const dateString = date.toISOString().split('T')[0];

  // Fetch existing assessment data for the given date
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const { data, error } = await supabase
          .from('wellbeing_assessments')
          .select('*')
          .eq('user_id', userId)
          .eq('date', dateString)
          .single();

        if (error) {
          console.error('Error fetching wellbeing assessment:', error);
          return;
        }

        if (data) {
          setSavedAssessment(data as SavedAssessment);
          setAssessment({
            sleep_quality: data.sleep_quality,
            stress_level: data.stress_level,
            nutrition_quality: data.nutrition_quality,
            physical_readiness: data.physical_readiness,
            mental_clarity: data.mental_clarity,
            notes: data.notes || '',
          });
        }
      } catch (error) {
        console.error('Error in wellbeing assessment fetch:', error);
      }
    };

    if (userId) {
      fetchAssessment();
    }
  }, [userId, dateString, supabase]);

  const handleSliderChange = (field: keyof AssessmentData) => (value: number) => {
    setAssessment((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAssessment((prev) => ({ ...prev, notes: event.target.value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const wellbeingData = {
        ...assessment,
        user_id: userId,
        date: dateString,
      };

      let query;
      
      if (savedAssessment) {
        // Update existing assessment
        query = supabase
          .from('wellbeing_assessments')
          .update(wellbeingData)
          .eq('id', savedAssessment.id);
      } else {
        // Insert new assessment
        query = supabase
          .from('wellbeing_assessments')
          .insert(wellbeingData);
      }

      const { error } = await query;
      
      if (error) {
        throw error;
      }

      showNotification({
        title: 'Success',
        message: 'Wellbeing assessment saved successfully',
        color: 'green',
      });

      // Refresh data to get the ID if it was a new record
      if (!savedAssessment) {
        const { data, error } = await supabase
          .from('wellbeing_assessments')
          .select('*')
          .eq('user_id', userId)
          .eq('date', dateString)
          .single();
          
        if (!error && data) {
          setSavedAssessment(data as SavedAssessment);
        }
      }
    } catch (error) {
      console.error('Error saving wellbeing assessment:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to save wellbeing assessment',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine slider color based on value
  const getSliderColor = (value: number): string => {
    if (value <= 3) return theme.colors.red[6];
    if (value <= 6) return theme.colors.yellow[6];
    return theme.colors.green[6];
  };

  const getWellbeingScore = (): number => {
    const {
      sleep_quality,
      stress_level,
      nutrition_quality,
      physical_readiness,
      mental_clarity
    } = assessment;
    
    // Calculate average of all metrics (invert stress level since lower is better)
    return Math.round(
      (sleep_quality + (10 - stress_level) + nutrition_quality + physical_readiness + mental_clarity) / 5
    );
  };

  return (
    <Box>
      <Title order={2} mb="md">Daily Wellbeing Assessment</Title>
      <Text color="dimmed" mb="xl">
        Rate your wellbeing metrics to help optimize your training and recovery. These metrics
        help our AI provide personalized recommendations for your training program.
      </Text>

      <Paper p="md" radius="md" withBorder mb="xl">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Box>
            <Text size="xl" weight={700}>Wellbeing Score</Text>
            <Text size="sm" color="dimmed" mb="md">Aggregate score based on all metrics</Text>
          </Box>
          <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: getSliderColor(getWellbeingScore()),
                color: '#fff',
              }}
            >
              <Text size={36} weight={700}>{getWellbeingScore()}</Text>
            </Box>
          </Box>
        </SimpleGrid>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Paper p="md" radius="md" withBorder>
          <Group mb="xs">
            <IconZzz size={24} color={theme.colors.blue[6]} />
            <Text weight={600}>Sleep Quality</Text>
          </Group>
          <Text size="sm" color="dimmed" mb="md">
            How well did you sleep last night?
          </Text>
          <Slider
            value={assessment.sleep_quality}
            onChange={handleSliderChange('sleep_quality')}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: 'Poor' },
              { value: 5, label: 'Average' },
              { value: 10, label: 'Excellent' },
            ]}
            color={getSliderColor(assessment.sleep_quality)}
            mb="lg"
          />
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group mb="xs">
            <IconStress size={24} color={theme.colors.orange[6]} />
            <Text weight={600}>Stress Level</Text>
          </Group>
          <Text size="sm" color="dimmed" mb="md">
            How stressed do you feel today?
          </Text>
          <Slider
            value={assessment.stress_level}
            onChange={handleSliderChange('stress_level')}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: 'Relaxed' },
              { value: 5, label: 'Moderate' },
              { value: 10, label: 'Extremely' },
            ]}
            // Inverted color scale for stress (lower is better)
            color={getSliderColor(11 - assessment.stress_level)}
            mb="lg"
          />
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group mb="xs">
            <IconSalad size={24} color={theme.colors.green[6]} />
            <Text weight={600}>Nutrition Quality</Text>
          </Group>
          <Text size="sm" color="dimmed" mb="md">
            How well have you been eating in the last 24 hours?
          </Text>
          <Slider
            value={assessment.nutrition_quality}
            onChange={handleSliderChange('nutrition_quality')}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: 'Poor' },
              { value: 5, label: 'Average' },
              { value: 10, label: 'Excellent' },
            ]}
            color={getSliderColor(assessment.nutrition_quality)}
            mb="lg"
          />
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group mb="xs">
            <IconHeartFilled size={24} color={theme.colors.red[6]} />
            <Text weight={600}>Physical Readiness</Text>
          </Group>
          <Text size="sm" color="dimmed" mb="md">
            How physically ready do you feel for training?
          </Text>
          <Slider
            value={assessment.physical_readiness}
            onChange={handleSliderChange('physical_readiness')}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: 'Fatigued' },
              { value: 5, label: 'Average' },
              { value: 10, label: 'Energized' },
            ]}
            color={getSliderColor(assessment.physical_readiness)}
            mb="lg"
          />
        </Paper>

        <Paper p="md" radius="md" withBorder colSpan={2}>
          <Group mb="xs">
            <IconBrain size={24} color={theme.colors.violet[6]} />
            <Text weight={600}>Mental Clarity</Text>
          </Group>
          <Text size="sm" color="dimmed" mb="md">
            How mentally sharp and focused do you feel today?
          </Text>
          <Slider
            value={assessment.mental_clarity}
            onChange={handleSliderChange('mental_clarity')}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: 'Foggy' },
              { value: 5, label: 'Average' },
              { value: 10, label: 'Clear' },
            ]}
            color={getSliderColor(assessment.mental_clarity)}
            mb="lg"
          />
        </Paper>
      </SimpleGrid>

      <Paper p="md" radius="md" withBorder mt="xl">
        <Text weight={600} mb="sm">Additional Notes</Text>
        <Textarea
          placeholder="Enter any additional notes about your wellbeing (e.g., injuries, illness, life stressors)"
          value={assessment.notes}
          onChange={handleNotesChange}
          minRows={3}
          mb="md"
        />

        <Group position="right">
          <Button
            onClick={handleSubmit}
            loading={loading}
            variant="filled"
            color="blue"
          >
            {savedAssessment ? 'Update Assessment' : 'Save Assessment'}
          </Button>
        </Group>
      </Paper>
    </Box>
  );
};

export default WellbeingAssessment;