'use client';

import { useState } from 'react';
import { 
  Card, 
  Group, 
  Stack, 
  Text, 
  Title, 
  Badge, 
  Button, 
  Accordion, 
  Divider, 
  ThemeIcon,
  NumberInput,
  ActionIcon,
  Modal,
  Textarea,
  Select
} from '@mantine/core';
import { 
  IconBarbell, 
  IconThumbUp, 
  IconThumbDown, 
  IconCheck, 
  IconChartLine,
  IconMessageCircle
} from '@tabler/icons-react';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps?: number;
  weight?: number;
  distance?: number;
  duration?: number;
  rest?: number;
  notes?: string;
  isCompleted?: boolean;
}

interface ExerciseGroup {
  id: string;
  name: string;
  exercises: Exercise[];
  mhg?: number; // Mean Heavy-weight per Group
}

interface WorkoutDayProps {
  id: string;
  title: string;
  date: string;
  day: string;
  intensity: 'Low' | 'Medium' | 'High';
  exerciseGroups: ExerciseGroup[];
  notes?: string;
  approved?: boolean;
  isAI?: boolean;
  onFeedback?: (feedback: WorkoutFeedback) => void;
  onComplete?: (exerciseId: string, data: Partial<Exercise>) => void;
}

interface WorkoutFeedback {
  workoutId: string;
  rating: 'positive' | 'negative';
  rpe?: number;
  comments?: string;
  limitingFactors?: string[];
}

export function WorkoutDayCard({ 
  id, 
  title, 
  date, 
  day,
  intensity, 
  exerciseGroups, 
  notes,
  approved = true,
  isAI = false,
  onFeedback,
  onComplete
}: WorkoutDayProps) {
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative'>('positive');
  const [rpe, setRpe] = useState<number | undefined>(undefined);
  const [comments, setComments] = useState('');
  const [limitingFactors, setLimitingFactors] = useState<string[]>([]);

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'High':
        return 'red';
      case 'Medium':
        return 'yellow';
      case 'Low':
        return 'green';
      default:
        return 'blue';
    }
  };

  const handleExerciseComplete = (
    exerciseId: string, 
    data: Partial<Exercise>,
    groupId: string
  ) => {
    if (onComplete) {
      onComplete(exerciseId, data);
    }
  };

  const openFeedbackModal = (type: 'positive' | 'negative') => {
    setFeedbackType(type);
    setFeedbackModalOpen(true);
  };

  const submitFeedback = () => {
    if (onFeedback) {
      onFeedback({
        workoutId: id,
        rating: feedbackType,
        rpe,
        comments,
        limitingFactors
      });
    }
    setFeedbackModalOpen(false);
    // Reset form
    setRpe(undefined);
    setComments('');
    setLimitingFactors([]);
  };

  return (
    <>
      <Card withBorder shadow="sm" radius="md" p="md">
        <Group position="apart" mb="xs">
          <Group>
            <Title order={3}>{title}</Title>
            {isAI && (
              <Badge color="blue" variant="filled">AI Generated</Badge>
            )}
            {!approved && (
              <Badge color="yellow" variant="filled">Pending Coach Approval</Badge>
            )}
          </Group>
          <Badge size="lg" color={getIntensityColor(intensity)}>
            {intensity}
          </Badge>
        </Group>
        
        <Group mb="md">
          <Text c="dimmed">{day} • {date}</Text>
        </Group>
        
        {notes && (
          <Text mb="md" size="sm" style={{fontStyle: 'italic'}}>{notes}</Text>
        )}
        
        <Accordion>
          {exerciseGroups.map(group => (
            <Accordion.Item value={group.id} key={group.id}>
              <Accordion.Control>
                <Group position="apart">
                  <Group>
                    <ThemeIcon size="md" color="blue" variant="light">
                      <IconBarbell size={16} />
                    </ThemeIcon>
                    <Text fw={500}>{group.name}</Text>
                  </Group>
                  
                  {group.mhg && (
                    <Badge color="blue" variant="outline">
                      MHG: {group.mhg}kg
                    </Badge>
                  )}
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack spacing="xs">
                  {group.exercises.map(exercise => (
                    <Card key={exercise.id} shadow="xs" p="sm" withBorder>
                      <Group position="apart" mb="xs">
                        <Text fw={500}>{exercise.name}</Text>
                        <ActionIcon 
                          color={exercise.isCompleted ? "green" : "gray"}
                          variant="subtle"
                          onClick={() => handleExerciseComplete(
                            exercise.id, 
                            { isCompleted: !exercise.isCompleted },
                            group.id
                          )}
                        >
                          <IconCheck size={16} />
                        </ActionIcon>
                      </Group>
                      
                      <Text size="sm">
                        {exercise.sets} sets
                        {exercise.reps && ` × ${exercise.reps} reps`}
                        {exercise.weight && ` @ ${exercise.weight}kg`}
                        {exercise.distance && ` × ${exercise.distance}m`}
                        {exercise.duration && ` × ${exercise.duration}s`}
                        {exercise.rest && ` (${exercise.rest}s rest)`}
                      </Text>
                      
                      {exercise.notes && (
                        <Text size="xs" c="dimmed" mt="xs">{exercise.notes}</Text>
                      )}
                      
                      {/* Optional: Add input fields for workout tracking */}
                      {approved && (
                        <Group grow mt="xs">
                          {exercise.weight !== undefined && (
                            <NumberInput
                              size="xs"
                              label="Weight (kg)"
                              defaultValue={exercise.weight}
                              min={0}
                              step={2.5}
                              precision={1}
                              onChange={(value) => handleExerciseComplete(
                                exercise.id, 
                                { weight: value || 0 },
                                group.id
                              )}
                            />
                          )}
                          {exercise.reps !== undefined && (
                            <NumberInput
                              size="xs"
                              label="Reps"
                              defaultValue={exercise.reps}
                              min={0}
                              onChange={(value) => handleExerciseComplete(
                                exercise.id, 
                                { reps: value || 0 },
                                group.id
                              )}
                            />
                          )}
                        </Group>
                      )}
                    </Card>
                  ))}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
        
        <Divider my="md" />
        
        {approved ? (
          <Group position="apart">
            <Button 
              leftIcon={<IconThumbUp size={16} />}
              variant="light"
              onClick={() => openFeedbackModal('positive')}
            >
              Felt Good
            </Button>
            <Button 
              leftIcon={<IconThumbDown size={16} />}
              variant="light"
              color="red"
              onClick={() => openFeedbackModal('negative')}
            >
              Struggled
            </Button>
          </Group>
        ) : (
          <Group position="right">
            <Button 
              leftIcon={<IconMessageCircle size={16} />}
              variant="light"
            >
              Request Changes
            </Button>
          </Group>
        )}
      </Card>
      
      <Modal
        opened={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title={
          <Text fw={700}>
            {feedbackType === 'positive' ? 'Workout Felt Good' : 'Workout Challenges'}
          </Text>
        }
      >
        <Stack>
          <NumberInput
            label="Rate Perceived Exertion (RPE)"
            description="Scale of 1-10 (10 being maximum effort)"
            min={1}
            max={10}
            value={rpe}
            onChange={setRpe}
          />
          
          {feedbackType === 'negative' && (
            <Select
              label="Limiting Factors"
              description="What made this workout challenging?"
              data={[
                { value: 'fatigue', label: 'Overall Fatigue' },
                { value: 'soreness', label: 'Muscle Soreness' },
                { value: 'technique', label: 'Technical Difficulty' },
                { value: 'weight', label: 'Weight Too Heavy' },
                { value: 'intensity', label: 'Too High Intensity' },
                { value: 'recovery', label: 'Insufficient Recovery' },
                { value: 'mental', label: 'Mental Fatigue' },
                { value: 'other', label: 'Other' },
              ]}
              placeholder="Select factors"
              value={limitingFactors}
              onChange={setLimitingFactors}
              multiple
            />
          )}
          
          <Textarea
            label="Additional Comments"
            placeholder="Share any additional feedback about this workout..."
            minRows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
          
          <Group position="right" mt="md">
            <Button variant="outline" onClick={() => setFeedbackModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitFeedback}>
              Submit Feedback
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}