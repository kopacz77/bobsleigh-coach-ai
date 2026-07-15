"use client";

import { Accordion, Badge, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconCalendarPlus } from "@tabler/icons-react";

interface ExerciseRecommendation {
  name: string;
  sets: number;
  reps?: number;
  weight?: number;
  distance?: number;
  duration?: number;
  rest?: number;
  height?: number;
}

interface WorkoutRecommendation {
  date: string;
  workout_type: string;
  focus: string;
  duration: number;
  intensity: string;
  exercises: ExerciseRecommendation[];
}

export function TrainingRecommendations() {
  // In a real app, you would fetch this data from your API
  const recommendations: WorkoutRecommendation[] = [
    {
      date: "2025-03-18",
      workout_type: "Strength",
      focus: "Lower body power",
      duration: 75,
      intensity: "High",
      exercises: [
        { name: "Back Squat", sets: 5, reps: 5, weight: 130 },
        { name: "Split Squat", sets: 3, reps: 6, weight: 80 },
        { name: "Box Jumps", sets: 4, reps: 8, height: 30 },
      ],
    },
    {
      date: "2025-03-20",
      workout_type: "Sprint",
      focus: "Acceleration",
      duration: 60,
      intensity: "Medium-High",
      exercises: [
        { name: "Resisted Sprints", sets: 6, distance: 20, rest: 90 },
        { name: "Flying Sprints", sets: 5, distance: 30, rest: 120 },
        { name: "Hill Sprints", sets: 4, duration: 12, rest: 180 },
      ],
    },
  ];

  const getBadgeColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case "high":
        return "red";
      case "medium-high":
        return "orange";
      case "medium":
        return "yellow";
      case "low":
        return "green";
      default:
        return "blue";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  return (
    <Card withBorder p={{ base: "sm", md: "md" }} radius="md">
      <Stack>
        <Title order={3} fz={{ base: "md", md: "lg" }}>
          Recommended Training
        </Title>

        <Text size="sm" c="dimmed">
          These AI-generated workouts are tailored to your current fitness, fatigue levels, and
          competition schedule.
        </Text>

        <Accordion variant="separated">
          {recommendations.map((workout, index) => (
            <Accordion.Item key={index} value={workout.date}>
              <Accordion.Control>
                <Stack gap={4}>
                  <Group justify="space-between" wrap="wrap">
                    <Text fw={500} size="sm">
                      {formatDate(workout.date)}
                    </Text>
                    <Badge color={getBadgeColor(workout.intensity)}>{workout.intensity}</Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {workout.workout_type} - {workout.focus}
                  </Text>
                </Stack>
              </Accordion.Control>

              <Accordion.Panel>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    Duration: {workout.duration} minutes
                  </Text>

                  <Title order={5} mt="xs">
                    Exercises
                  </Title>

                  {workout.exercises.map((exercise, exIndex) => (
                    <Card key={exIndex} withBorder p="sm" radius="sm">
                      <Text fw={500} size="sm">
                        {exercise.name}
                      </Text>
                      <Text size="sm">
                        {exercise.sets} sets
                        {exercise.reps && ` x ${exercise.reps} reps`}
                        {exercise.weight && ` @ ${exercise.weight}kg`}
                        {exercise.distance && ` x ${exercise.distance}m`}
                        {exercise.duration && ` x ${exercise.duration}s`}
                        {exercise.height && ` x ${exercise.height}cm`}
                        {exercise.rest && ` (${exercise.rest}s rest)`}
                      </Text>
                    </Card>
                  ))}

                  <Button
                    leftSection={<IconCalendarPlus size={16} />}
                    mt="sm"
                    variant="light"
                    fullWidth
                  >
                    Add to Training Log
                  </Button>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Stack>
    </Card>
  );
}
