'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Group,
  Text,
  Title,
  Badge,
  Grid,
  Stack,
  Button,
  ThemeIcon,
  Accordion,
  SimpleGrid,
  Alert,
  rem,
  ActionIcon,
  Tooltip,
  Checkbox,
  Image,
  Paper,
  Divider,
} from '@mantine/core';
import {
  IconBarbell,
  IconClock,
  IconInfoCircle,
  IconArrowRight,
  IconPlus,
  IconBulb,
  IconBrain,
  IconSettings,
  IconRun,
  IconHeart,
  IconThumbUp,
  IconBolt,
} from '@tabler/icons-react';

interface RecommendationProps {
  id: string;
  date: string;
  title: string;
  type: string;
  duration: number;
  intensity: 'Low' | 'Medium' | 'High';
  focus: string;
  description: string;
  confidence: number;
  exercises: {
    name: string;
    sets?: number;
    reps?: number;
    weight?: number;
    distance?: number;
    duration?: number;
    rest?: number;
    notes?: string;
  }[];
}

function RecommendationCard({ recommendation }: { recommendation: RecommendationProps }) {
  const getIntensityColor = (intensity: 'Low' | 'Medium' | 'High') => {
    return {
      Low: 'green',
      Medium: 'yellow',
      High: 'red',
    }[intensity];
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'green';
    if (confidence >= 70) return 'blue';
    return 'yellow';
  };

  return (
    <Card withBorder shadow="sm" p="md" radius="md">
      <Stack spacing="md">
        <Group position="apart">
          <Stack spacing={0}>
            <Group spacing="xs">
              <Text fw={700}>{recommendation.title}</Text>
              <Badge size="sm" color="blue">AI</Badge>
            </Group>
            <Text size="sm" c="dimmed">
              {new Date(recommendation.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </Stack>
          <Tooltip label="AI Confidence Score">
            <Badge 
              color={getConfidenceColor(recommendation.confidence)}
              size="lg"
              leftSection={
                <ThemeIcon 
                  color={getConfidenceColor(recommendation.confidence)} 
                  variant="light" 
                  size={16} 
                  radius="xl"
                >
                  <IconBrain size="10" />
                </ThemeIcon>
              }
            >
              {recommendation.confidence}%
            </Badge>
          </Tooltip>
        </Group>
        
        <SimpleGrid cols={3}>
          <Stack spacing={0} align="center">
            <ThemeIcon color="blue" variant="light" size="md" radius="xl">
              <IconBarbell style={{ width: rem(16), height: rem(16) }} />
            </ThemeIcon>
            <Text size="sm" fw={500} mt="xs">{recommendation.type}</Text>
          </Stack>
          
          <Stack spacing={0} align="center">
            <ThemeIcon color="grape" variant="light" size="md" radius="xl">
              <IconClock style={{ width: rem(16), height: rem(16) }} />
            </ThemeIcon>
            <Text size="sm" fw={500} mt="xs">{recommendation.duration} min</Text>
          </Stack>
          
          <Stack spacing={0} align="center">
            <ThemeIcon 
              color={getIntensityColor(recommendation.intensity)} 
              variant="light" 
              size="md" 
              radius="xl"
            >
              <IconBolt style={{ width: rem(16), height: rem(16) }} />
            </ThemeIcon>
            <Text size="sm" fw={500} mt="xs">{recommendation.intensity}</Text>
          </Stack>
        </SimpleGrid>
        
        <Alert color="blue" title="Focus" icon={<IconBulb />}>
          {recommendation.focus}
        </Alert>
        
        <Accordion variant="contained">
          <Accordion.Item value="exercises">
            <Accordion.Control>
              <Text fw={500}>Exercises ({recommendation.exercises.length})</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack spacing="xs">
                {recommendation.exercises.map((exercise, index) => (
                  <Group key={index} position="apart">
                    <Text>{exercise.name}</Text>
                    <Group spacing="xs">
                      {exercise.sets && <Text size="sm">{exercise.sets} sets</Text>}
                      {exercise.reps && <Text size="sm">× {exercise.reps}</Text>}
                      {exercise.weight && <Text size="sm">@ {exercise.weight}kg</Text>}
                      {exercise.distance && <Text size="sm">{exercise.distance}m</Text>}
                      {exercise.duration && <Text size="sm">{exercise.duration}s</Text>}
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
          
          <Accordion.Item value="details">
            <Accordion.Control>
              <Text fw={500}>Recommendation Details</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Text size="sm">{recommendation.description}</Text>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
        
        <Group position="apart">
          <Button variant="filled" leftSection={<IconPlus size={16} />}>
            Add to Calendar
          </Button>
          <Group spacing="xs">
            <Tooltip label="Like this recommendation">
              <ActionIcon variant="subtle" color="blue">
                <IconThumbUp style={{ width: rem(18), height: rem(18) }} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Adjust settings">
              <ActionIcon variant="subtle">
                <IconSettings style={{ width: rem(18), height: rem(18) }} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Stack>
    </Card>
  );
}

export function TrainingRecommendations() {
  // Mock recommendations data
  const recommendations: RecommendationProps[] = [
    {
      id: '1',
      date: '2025-03-17',
      title: 'Sprint & Acceleration',
      type: 'Speed',
      duration: 90,
      intensity: 'High',
      focus: 'Improving first 30m acceleration and power development',
      confidence: 92,
      description: 'Based on your recent training load and recovery metrics, you are ready for a high-intensity sprint session. This workout focuses on your acceleration phase which aligns with your goal of improving push performance.',
      exercises: [
        { name: 'Dynamic Warm-up', duration: 15, notes: 'Focus on hip mobility' },
        { name: 'Block Starts', sets: 8, distance: 20, rest: 120 },
        { name: 'Resisted Sprints', sets: 6, distance: 30, rest: 180 },
        { name: 'Flying Sprints', sets: 4, distance: 40, rest: 180 },
        { name: 'Plyometric Bounds', sets: 3, reps: 8, rest: 120 },
        { name: 'Cool Down', duration: 10 },
      ],
    },
    {
      id: '2',
      date: '2025-03-19',
      title: 'Recovery Session',
      type: 'Recovery',
      duration: 45,
      intensity: 'Low',
      focus: 'Active recovery and mobility improvement',
      confidence: 88,
      description: 'Following your high-intensity sprint session, this recovery workout will help reduce muscle soreness and improve mobility while maintaining blood flow to facilitate recovery.',
      exercises: [
        { name: 'Light Jogging', duration: 10 },
        { name: 'Dynamic Stretching', duration: 10 },
        { name: 'Foam Rolling', duration: 15, notes: 'Focus on quads and hamstrings' },
        { name: 'Mobility Work', duration: 10, notes: 'Hip and ankle mobility' },
      ],
    },
    {
      id: '3',
      date: '2025-03-21',
      title: 'Power Development',
      type: 'Strength',
      duration: 75,
      intensity: 'Medium',
      focus: 'Lower body power and explosiveness',
      confidence: 85,
      description: 'This session focuses on developing power in your posterior chain, which is critical for bobsleigh push performance. The workout combines strength and power exercises to maximize force production.',
      exercises: [
        { name: 'Dynamic Warm-up', duration: 10 },
        { name: 'Back Squat', sets: 4, reps: 5, weight: 130 },
        { name: 'Romanian Deadlift', sets: 3, reps: 8, weight: 110 },
        { name: 'Box Jumps', sets: 4, reps: 6, notes: '30 inch box' },
        { name: 'Split Squats', sets: 3, reps: 8, weight: 60 },
        { name: 'Core Circuit', sets: 3, duration: 60 },
      ],
    },
  ];

  return (
    <Stack spacing="xl">
      <Card withBorder shadow="sm" p="md">
        <Group spacing="md">
          <ThemeIcon size="xl" radius="xl" color="blue">
            <IconBrain style={{ width: rem(24), height: rem(24) }} />
          </ThemeIcon>
          
          <Stack spacing={0}>
            <Title order={4}>AI Training Recommendations</Title>
            <Text size="sm">
              Personalized workout suggestions based on your training history, recovery status, and goals
            </Text>
          </Stack>
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
        {recommendations.map((recommendation) => (
          <RecommendationCard key={recommendation.id} recommendation={recommendation} />
        ))}
      </SimpleGrid>
      
      <Paper withBorder p="md" radius="md">
        <Group position="apart">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="blue" variant="light">
              <IconHeart style={{ width: rem(20), height: rem(20) }} />
            </ThemeIcon>
            <Stack spacing={0}>
              <Text fw={500}>Help improve your recommendations</Text>
              <Text size="sm" c="dimmed">Provide more information to get better training suggestions</Text>
            </Stack>
          </Group>
          <Button variant="light" rightSection={<IconArrowRight size={16} />}>
            Update Preferences
          </Button>
        </Group>
      </Paper>
    </Stack>
  );
}
