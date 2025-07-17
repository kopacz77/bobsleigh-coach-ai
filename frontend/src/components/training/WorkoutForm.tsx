"use client";

import {
  ActionIcon,
  Button,
  Card,
  Divider,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

interface WorkoutFormValues {
  name: string;
  date: Date;
  type: string;
  duration: number;
  notes: string;
  exercises: {
    exercise_id: string;
    name: string;
    sets: number;
    reps: number;
    weight: number;
    distance: number;
    time: number;
    notes: string;
  }[];
}

export function WorkoutForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exercise options (in a real app, these would come from the backend)
  const exerciseOptions = [
    { value: "1", label: "Squat" },
    { value: "2", label: "Bench Press" },
    { value: "3", label: "Deadlift" },
    { value: "4", label: "Power Clean" },
    { value: "5", label: "30m Sprint" },
    { value: "6", label: "Box Jump" },
  ];

  const workoutTypes = [
    { value: "strength", label: "Strength" },
    { value: "speed", label: "Speed" },
    { value: "endurance", label: "Endurance" },
    { value: "recovery", label: "Recovery" },
    { value: "technique", label: "Technique" },
  ];

  const form = useForm<WorkoutFormValues>({
    initialValues: {
      name: "",
      date: new Date(),
      type: "",
      duration: 60,
      notes: "",
      exercises: [
        {
          exercise_id: "",
          name: "",
          sets: 3,
          reps: 8,
          weight: 0,
          distance: 0,
          time: 0,
          notes: "",
        },
      ],
    },
    validate: {
      name: (value) => (value ? null : "Workout name is required"),
      type: (value) => (value ? null : "Workout type is required"),
      exercises: {
        exercise_id: (value) => (value ? null : "Please select an exercise"),
      },
    },
  });

  const handleSubmit = async (values: WorkoutFormValues) => {
    setIsSubmitting(true);
    try {
      // In a real app, you would submit to your API
      console.log("Submitting workout:", values);
      // api.post('/api/training/workouts', values);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset form
      form.reset();

      // Show success message
      alert("Workout saved successfully!");
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Error saving workout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addExercise = () => {
    form.insertListItem("exercises", {
      exercise_id: "",
      name: "",
      sets: 3,
      reps: 8,
      weight: 0,
      distance: 0,
      time: 0,
      notes: "",
    });
  };

  const removeExercise = (index: number) => {
    form.removeListItem("exercises", index);
  };

  // Auto-fill exercise name when exercise_id changes
  const handleExerciseChange = (value: string, index: number) => {
    form.setFieldValue(`exercises.${index}.exercise_id`, value);
    const exercise = exerciseOptions.find((ex) => ex.value === value);
    if (exercise) {
      form.setFieldValue(`exercises.${index}.name`, exercise.label);
    }
  };

  return (
    <Card withBorder p="md" radius="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Title order={3}>Log Workout</Title>

          <Group grow>
            <TextInput
              label="Workout Name"
              placeholder="e.g. Monday Strength Session"
              required
              {...form.getInputProps("name")}
            />

            <Select
              label="Workout Type"
              placeholder="Select workout type"
              data={workoutTypes}
              required
              {...form.getInputProps("type")}
            />
          </Group>

          <Group grow>
            <DatePickerInput
              label="Date"
              placeholder="Select date"
              required
              {...form.getInputProps("date")}
            />

            <NumberInput
              label="Duration (minutes)"
              placeholder="60"
              min={1}
              {...form.getInputProps("duration")}
            />
          </Group>

          <Textarea
            label="Notes"
            placeholder="How did the workout feel? Any observations?"
            minRows={2}
            {...form.getInputProps("notes")}
          />

          <Divider label="Exercises" labelPosition="center" />

          {form.values.exercises.map((_, index) => (
            <Card key={index} withBorder shadow="xs" p="sm" radius="md">
              <Stack>
                <Group grow>
                  <Select
                    label="Exercise"
                    placeholder="Select exercise"
                    data={exerciseOptions}
                    required
                    {...form.getInputProps(`exercises.${index}.exercise_id`)}
                    onChange={(value) => handleExerciseChange(value || "", index)}
                  />

                  <Group position="right" mt={24}>
                    <ActionIcon
                      color="red"
                      onClick={() => removeExercise(index)}
                      disabled={form.values.exercises.length <= 1}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>

                <Group grow>
                  <NumberInput
                    label="Sets"
                    placeholder="3"
                    min={0}
                    {...form.getInputProps(`exercises.${index}.sets`)}
                  />

                  <NumberInput
                    label="Reps"
                    placeholder="8"
                    min={0}
                    {...form.getInputProps(`exercises.${index}.reps`)}
                  />

                  <NumberInput
                    label="Weight (kg)"
                    placeholder="0"
                    min={0}
                    precision={1}
                    {...form.getInputProps(`exercises.${index}.weight`)}
                  />
                </Group>

                <Group grow>
                  <NumberInput
                    label="Distance (m)"
                    placeholder="0"
                    min={0}
                    {...form.getInputProps(`exercises.${index}.distance`)}
                  />

                  <NumberInput
                    label="Time (seconds)"
                    placeholder="0"
                    min={0}
                    precision={1}
                    {...form.getInputProps(`exercises.${index}.time`)}
                  />
                </Group>

                <TextInput
                  label="Notes"
                  placeholder="Any comments about this exercise"
                  {...form.getInputProps(`exercises.${index}.notes`)}
                />
              </Stack>
            </Card>
          ))}

          <Button leftIcon={<IconPlus size={16} />} variant="outline" onClick={addExercise}>
            Add Exercise
          </Button>

          <Group position="right" mt="md">
            <Button type="submit" loading={isSubmitting}>
              Save Workout
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}
