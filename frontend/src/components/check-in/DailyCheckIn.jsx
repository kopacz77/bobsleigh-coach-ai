import React, { useState, useEffect } from 'react';
import {
  Box,
  Title,
  Text,
  Group,
  Paper,
  Button,
  Slider,
  Select,
  MultiSelect,
  Textarea,
  Progress,
  useMantineTheme,
  Stack,
  Card,
  Stepper
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  IconZzz,
  IconHeartFilled,
  IconMoodSmile,
  IconWeight,
  IconMuscle,
  IconCheck,
  IconBulb
} from '@tabler/icons-react';

/**
 * DailyCheckIn component provides a quick daily assessment for athletes
 * to track wellbeing, readiness and potential issues.
 */
const DailyCheckIn = ({ userId }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [hasExistingCheckIn, setHasExistingCheckIn] = useState(false);
  const [existingData, setExistingData] = useState(null);
  
  // Form state
  const [checkIn, setCheckIn] = useState({
    date: new Date(),
    sleep_quality: 5,
    sleep_hours: 7,
    mood: 'neutral',
    energy_level: 5,
    muscle_soreness: 0,
    soreness_areas: [],
    readiness: 5,
    nutrition_quality: 5,
    hydration_level: 5,
    stress_level: 5,
    notes: ''
  });

  // Body areas for soreness tracking
  const bodyAreas = [
    { value: 'shoulders', label: 'Shoulders' },
    { value: 'upper_back', label: 'Upper Back' },
    { value: 'lower_back', label: 'Lower Back' },
    { value: 'chest', label: 'Chest' },
    { value: 'arms', label: 'Arms' },
    { value: 'glutes', label: 'Glutes' },
    { value: 'quads', label: 'Quadriceps' },
    { value: 'hamstrings', label: 'Hamstrings' },
    { value: 'calves', label: 'Calves' },
    { value: 'knees', label: 'Knees' },
    { value: 'ankles', label: 'Ankles' }
  ];

  // Check if the athlete has already completed a check-in today
  useEffect(() => {
    const checkForExistingCheckIn = async () => {
      if (!userId) return;

      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('daily_check_ins')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error checking for existing check-in:', error);
          return;
        }

        if (data) {
          setHasExistingCheckIn(true);
          setExistingData(data);
          setCheckIn({
            ...checkIn,
            ...data,
            date: new Date(data.date),
            soreness_areas: data.soreness_areas || []
          });
        }
      } catch (error) {
        console.error('Error in check-in verification:', error);
      }
    };

    checkForExistingCheckIn();
  }, [userId, supabase]);

  // Calculate readiness score based on other metrics
  useEffect(() => {
    // Simple algorithm to calculate readiness score
    const calculateReadiness = () => {
      if (checkIn.muscle_soreness > 7) return Math.max(1, checkIn.readiness - 2);
      
      const sleepFactor = checkIn.sleep_quality * 0.25;
      const energyFactor = checkIn.energy_level * 0.25;
      const sorenessFactor = (10 - checkIn.muscle_soreness) * 0.25;
      const stressFactor = (10 - checkIn.stress_level) * 0.25;
      
      const calculatedScore = Math.round(sleepFactor + energyFactor + sorenessFactor + stressFactor);
      
      // Only update if the user hasn't manually changed it
      if (checkIn.readiness === 5) { // Default value
        setCheckIn(prev => ({ ...prev, readiness: calculatedScore }));
      }
    };
    
    calculateReadiness();
  }, [checkIn.sleep_quality, checkIn.energy_level, checkIn.muscle_soreness, checkIn.stress_level]);

  // Handle form field changes
  const handleSleepQualityChange = (value) => setCheckIn(prev => ({ ...prev, sleep_quality: value }));
  const handleSleepHoursChange = (value) => setCheckIn(prev => ({ ...prev, sleep_hours: value }));
  const handleMoodChange = (value) => setCheckIn(prev => ({ ...prev, mood: value }));
  const handleEnergyLevelChange = (value) => setCheckIn(prev => ({ ...prev, energy_level: value }));
  const handleMuscleSorenessChange = (value) => setCheckIn(prev => ({ ...prev, muscle_soreness: value }));
  const handleSorenessAreasChange = (value) => setCheckIn(prev => ({ ...prev, soreness_areas: value }));
  const handleReadinessChange = (value) => setCheckIn(prev => ({ ...prev, readiness: value }));
  const handleNutritionQualityChange = (value) => setCheckIn(prev => ({ ...prev, nutrition_quality: value }));
  const handleHydrationLevelChange = (value) => setCheckIn(prev => ({ ...prev, hydration_level: value }));
  const handleStressLevelChange = (value) => setCheckIn(prev => ({ ...prev, stress_level: value }));
  const handleNotesChange = (event) => setCheckIn(prev => ({ ...prev, notes: event.target.value }));

  // Move to the next step
  const nextStep = () => {
    if (active < 3) {
      setActive((current) => current + 1);
    }
  };

  // Go back to the previous step
  const prevStep = () => {
    if (active > 0) {
      setActive((current) => current - 1);
    }
  };

  // Submit check-in data
  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const checkInData = {
        user_id: userId,
        date: checkIn.date.toISOString().split('T')[0],
        sleep_quality: checkIn.sleep_quality,
        sleep_hours: checkIn.sleep_hours,
        mood: checkIn.mood,
        energy_level: checkIn.energy_level,
        muscle_soreness: checkIn.muscle_soreness,
        soreness_areas: checkIn.soreness_areas.length > 0 ? checkIn.soreness_areas : null,
        readiness: checkIn.readiness,
        nutrition_quality: checkIn.nutrition_quality,
        hydration_level: checkIn.hydration_level,
        stress_level: checkIn.stress_level,
        notes: checkIn.notes || null
      };

      let query;
      
      if (hasExistingCheckIn) {
        // Update existing check-in
        query = supabase
          .from('daily_check_ins')
          .update(checkInData)
          .eq('id', existingData.id);
      } else {
        // Insert new check-in
        query = supabase
          .from('daily_check_ins')
          .insert(checkInData);
      }

      const { error } = await query;
      
      if (error) {
        throw error;
      }

      showNotification({
        title: 'Success',
        message: hasExistingCheckIn ? 'Check-in updated successfully' : 'Check-in completed successfully',
        color: 'green',
      });

      setCompleted(true);
    } catch (error) {
      console.error('Error saving check-in data:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to save check-in data',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    setCheckIn({
      date: new Date(),
      sleep_quality: 5,
      sleep_hours: 7,
      mood: 'neutral',
      energy_level: 5,
      muscle_soreness: 0,
      soreness_areas: [],
      readiness: 5,
      nutrition_quality: 5,
      hydration_level: 5,
      stress_level: 5,
      notes: ''
    });
    setActive(0);
    setCompleted(false);
  };

  // Helper function to get slider color based on value
  const getSliderColor = (value, inverse = false) => {
    if (inverse) {
      // For metrics where lower is better (stress, soreness)
      if (value >= 7) return theme.colors.red[6];
      if (value >= 4) return theme.colors.yellow[6];
      return theme.colors.green[6];
    } else {
      // For metrics where higher is better (sleep, energy)
      if (value <= 3) return theme.colors.red[6];
      if (value <= 6) return theme.colors.yellow[6];
      return theme.colors.green[6];
    }
  };

  // If check-in is completed, show success message
  if (completed) {
    return (
      <Box>
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" spacing="lg">
            <IconCheck size={48} color={theme.colors.green[6]} />
            <Title order={2} align="center">Check-in Complete!</Title>
            <Text align="center" color="dimmed">
              Thank you for completing your daily check-in. Your data helps optimize your
              training and recovery plans.
            </Text>
            
            <Card withBorder p="md" radius="md" maw={400} w="100%">
              <Title order={4} mb="md">Today's Readiness Score</Title>
              <Group position="apart" mb="xs">
                <Text>Training Readiness</Text>
                <Text weight={700} size="lg">{checkIn.readiness}/10</Text>
              </Group>
              <Progress
                value={checkIn.readiness * 10}
                color={getSliderColor(checkIn.readiness)}
                size="xl"
                radius="xl"
                mb="md"
              />
              <Text size="sm" color="dimmed">
                {checkIn.readiness >= 8 ? 'You\'re ready for a challenging session!' :
                 checkIn.readiness >= 5 ? 'You\'re ready for a moderate training load.' :
                 'Consider a lighter training day or recovery.'}
              </Text>
            </Card>
            
            <Button onClick={handleReset} variant="light">
              {hasExistingCheckIn ? 'Edit Check-in' : 'New Check-in'}
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Paper p="md" radius="md" withBorder mb="xl">
        <Title order={2} mb="md">Daily Athlete Check-in</Title>
        <Text color="dimmed" mb="xl">
          Please take a moment to complete your daily check-in. This information helps optimize your
          training and ensures you're making the best progress possible.
        </Text>

        {hasExistingCheckIn && (
          <Paper p="sm" radius="md" bg="blue.0" mb="xl">
            <Text size="sm" color="blue.8">
              You've already completed a check-in today. You can review or update your responses below.
            </Text>
          </Paper>
        )}

        <Stepper active={active} onStepClick={setActive} mb="xl">
          <Stepper.Step label="Sleep & Mood" description="Rest quality">
            <Box my="xl" maw={600} mx="auto">
              <Paper p="md" radius="md" withBorder mb="xl">
                <Group mb="md">
                  <IconZzz size={24} color={theme.colors.blue[6]} />
                  <Text weight={600} size="lg">Sleep</Text>
                </Group>
                
                <Text mb="xs">Hours of sleep last night</Text>
                <Select
                  value={checkIn.sleep_hours.toString()}
                  onChange={(value) => handleSleepHoursChange(parseInt(value))}
                  data={[
                    { value: '4', label: 'Less than 5 hours' },
                    { value: '5', label: '5 hours' },
                    { value: '6', label: '6 hours' },
                    { value: '7', label: '7 hours' },
                    { value: '8', label: '8 hours' },
                    { value: '9', label: '9 hours' },
                    { value: '10', label: '10+ hours' },
                  ]}
                  mb="md"
                />
                
                <Text mb="xs">Sleep Quality</Text>
                <Slider
                  value={checkIn.sleep_quality}
                  onChange={handleSleepQualityChange}
                  min={1}
                  max={10}
                  step={1}
                  marks={[
                    { value: 1, label: 'Poor' },
                    { value: 5, label: 'Average' },
                    { value: 10, label: 'Excellent' },
                  ]}
                  color={getSliderColor(checkIn.sleep_quality)}
                  mb="lg"
                />
              </Paper>
              
              <Paper p="md" radius="md" withBorder>
                <Group mb="md">
                  <IconMoodSmile size={24} color={theme.colors.yellow[6]} />
                  <Text weight={600} size="lg">Mood & Energy</Text>
                </Group>
                
                <Text mb="xs">Today's Mood</Text>
                <Select
                  value={checkIn.mood}
                  onChange={handleMoodChange}
                  data={[
                    { value: 'excellent', label: '😄 Excellent' },
                    { value: 'good', label: '🙂 Good' },
                    { value: 'neutral', label: '😐 Neutral' },
                    { value: 'down', label: '🙁 Down' },
                    { value: 'poor', label: '😞 Poor' },
                  ]}
                  mb="md"
                />
                
                <Text mb="xs">Energy Level</Text>
                <Slider
                  value={checkIn.energy_level}
                  onChange={handleEnergyLevelChange}
                  min={1}
                  max={10}
                  step={1}
                  marks={[
                    { value: 1, label: 'Exhausted' },
                    { value: 5, label: 'Average' },
                    { value: 10, label: 'Energetic' },
                  ]}
                  color={getSliderColor(checkIn.energy_level)}
                  mb="lg"
                />
              </Paper>
            </Box>
          </Stepper.Step>
          
          <Stepper.Step label="Physical State" description="Soreness & readiness">
            <Box my="xl" maw={600} mx="auto">
              <Paper p="md" radius="md" withBorder mb="xl">
                <Group mb="md">
                  <IconMuscle size={24} color={theme.colors.orange[6]} />
                  <Text weight={600} size="lg">Muscle Soreness</Text>
                </Group>
                
                <Text mb="xs">Overall Soreness Level</Text>
                <Slider
                  value={checkIn.muscle_soreness}
                  onChange={handleMuscleSorenessChange}
                  min={0}
                  max={10}
                  step={1}
                  marks={[
                    { value: 0, label: 'None' },
                    { value: 5, label: 'Moderate' },
                    { value: 10, label: 'Severe' },
                  ]}
                  color={getSliderColor(checkIn.muscle_soreness, true)}
                  mb="lg"
                />
                
                {checkIn.muscle_soreness > 1 && (
                  <>
                    <Text mb="xs">Sore Areas</Text>
                    <MultiSelect
                      data={bodyAreas}
                      value={checkIn.soreness_areas}
                      onChange={handleSorenessAreasChange}
                      placeholder="Select sore areas"
                      searchable
                      mb="lg"
                    />
                  </>
                )}
              </Paper>
              
              <Paper p="md" radius="md" withBorder>
                <Group mb="md">
                  <IconHeartFilled size={24} color={theme.colors.red[6]} />
                  <Text weight={600} size="lg">Training Readiness</Text>
                </Group>
                
                <Text mb="xs">How ready do you feel for today's training?</Text>
                <Slider
                  value={checkIn.readiness}
                  onChange={handleReadinessChange}
                  min={1}
                  max={10}
                  step={1}
                  marks={[
                    { value: 1, label: 'Not Ready' },
                    { value: 5, label: 'Moderate' },
                    { value: 10, label: 'Fully Ready' },
                  ]}
                  color={getSliderColor(checkIn.readiness)}
                  mb="lg"
                />
              </Paper>
            </Box>
          </Stepper.Step>
          
          <Stepper.Step label="Nutrition & Lifestyle" description="Recovery factors">
            <Box my="xl" maw={600} mx="auto">
              <Paper p="md" radius="md" withBorder mb="xl">
                <Group mb="md">
                  <IconWeight size={24} color={theme.colors.green[6]} />
                  <Text weight={600} size="lg">Nutrition & Hydration</Text>
                </Group>
                
                <Text mb="xs">Nutrition Quality (past 24 hours)</Text>
                <Slider
                  value={checkIn.nutrition_quality}
                  onChange={handleNutritionQualityChange}
                  min={1}
                  max={10}
                  step={1}
                  marks={[
                    { value: 1, label: 'Poor' },
                    { value: 5, label: 'Average' },
                    { value: 10, label: 'Excellent' },
                  ]}
                  color={getSliderColor(checkIn.nutrition_quality)}
                  mb="lg"
                />
                
                <Text mb="xs">Hydration Level</Text>
                <Slider
                  value={checkIn.hydration_level}
                  onChange={handleHydrationLevelChange}
                  min={1}
                  max={10}
                  step={1}
                  marks={[
                    { value: 1, label: 'Dehydrated' },
                    { value: 5, label: 'Average' },
                    { value: 10, label: 'Well Hydrated' },
                  ]}
                  color={getSliderColor(checkIn.hydration_level)}
                  mb="lg"
                />
              </Paper>
              
              <Paper p="md" radius="md" withBorder>
                <Group mb="md">
                  <IconBulb size={24} color={theme.colors.grape[6]} />
                  <Text weight={600} size="lg">Stress & Notes</Text>
                </Group>
                
                <Text mb="xs">Stress Level</Text>
                <Slider
                  value={checkIn.stress_level}
                  onChange={handleStressLevelChange}
                  min={1}
                  max={10}
                  step={1}
                  marks={[
                    { value: 1, label: 'Low' },
                    { value: 5, label: 'Moderate' },
                    { value: 10, label: 'High' },
                  ]}
                  color={getSliderColor(checkIn.stress_level, true)}
                  mb="lg"
                />
                
                <Text mb="xs">Additional Notes</Text>
                <Textarea
                  placeholder="Anything else you'd like to share about how you're feeling today?"
                  value={checkIn.notes}
                  onChange={handleNotesChange}
                  minRows={3}
                />
              </Paper>
            </Box>
          </Stepper.Step>
          
          <Stepper.Step label="Review" description="Submit check-in">
            <Box my="xl" maw={600} mx="auto">
              <Paper p="md" radius="md" withBorder mb="xl">
                <Title order={3} mb="md">Check-in Summary</Title>
                
                <Group position="apart" mb="md">
                  <Text weight={500}>Sleep Quality:</Text>
                  <Text>{checkIn.sleep_quality}/10</Text>
                </Group>
                
                <Group position="apart" mb="md">
                  <Text weight={500}>Sleep Hours:</Text>
                  <Text>{checkIn.sleep_hours} hours</Text>
                </Group>
                
                <Group position="apart" mb="md">
                  <Text weight={500}>Mood:</Text>
                  <Text>{checkIn.mood.charAt(0).toUpperCase() + checkIn.mood.slice(1)}</Text>
                </Group>
                
                <Group position="apart" mb="md">
                  <Text weight={500}>Energy Level:</Text>
                  <Text>{checkIn.energy_level}/10</Text>
                </Group>
                
                <Group position="apart" mb="md">
                  <Text weight={500}>Muscle Soreness:</Text>
                  <Text>{checkIn.muscle_soreness}/10</Text>
                </Group>
                
                {checkIn.soreness_areas.length > 0 && (
                  <Group position="apart" mb="md">
                    <Text weight={500}>Sore Areas:</Text>
                    <Text>{checkIn.soreness_areas.map(area => {
                      const areaObj = bodyAreas.find(a => a.value === area);
                      return areaObj ? areaObj.label : area;
                    }).join(', ')}</Text>
                  </Group>
                )}
                
                <Group position="apart" mb="md">
                  <Text weight={500}>Training Readiness:</Text>
                  <Text>{checkIn.readiness}/10</Text>
                </Group>
                
                <Group position="apart" mb="md">
                  <Text weight={500}>Nutrition Quality:</Text>
                  <Text>{checkIn.nutrition_quality}/10</Text>
                </Group>
                
                <Group position="apart" mb="md">
                  <Text weight={500}>Hydration Level:</Text>
                  <Text>{checkIn.hydration_level}/10</Text>
                </Group>
                
                <Group position="apart" mb="md">
                  <Text weight={500}>Stress Level:</Text>
                  <Text>{checkIn.stress_level}/10</Text>
                </Group>
                
                {checkIn.notes && (
                  <Box mb="md">
                    <Text weight={500} mb="xs">Notes:</Text>
                    <Paper p="sm" bg="gray.0">
                      <Text>{checkIn.notes}</Text>
                    </Paper>
                  </Box>
                )}
              </Paper>
              
              <Group position="right">
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                >
                  {hasExistingCheckIn ? 'Update Check-in' : 'Complete Check-in'}
                </Button>
              </Group>
            </Box>
          </Stepper.Step>
        </Stepper>

        <Group position="center" mt="xl">
          {active > 0 && (
            <Button variant="default" onClick={prevStep}>Back</Button>
          )}
          {active < 3 && (
            <Button onClick={nextStep}>Next Step</Button>
          )}
        </Group>
      </Paper>
    </Box>
  );
};

export default DailyCheckIn;