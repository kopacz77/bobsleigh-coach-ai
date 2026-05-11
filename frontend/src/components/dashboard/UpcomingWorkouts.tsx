"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  rem,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { IconBarbell, IconCalendarEvent, IconDotsVertical } from "@tabler/icons-react";

interface WorkoutProps {
  date: string;
  day: string;
  title: string;
  type: string;
  duration: string;
  intensity: "Low" | "Medium" | "High";
  isAI?: boolean;
}

function WorkoutItem({ date, day, title, type, duration, intensity, isAI = false }: WorkoutProps) {
  const theme = useMantineTheme();

  const intensityColor = {
    Low: "green",
    Medium: "yellow",
    High: "red",
  }[intensity];

  return (
    <Group justify="space-between" p="sm" wrap="nowrap" style={{ borderBottom: `1px solid ${theme.colors.gray[1]}` }}>
      <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
        <ThemeIcon size="xl" radius="md" color="gray.2" style={{ flexShrink: 0 }}>
          <Text fw={700} c="dark">
            {day}
          </Text>
        </ThemeIcon>

        <Stack gap={0} style={{ minWidth: 0 }}>
          <Group gap="xs" wrap="wrap">
            <Text fw={500} size="sm" style={{ whiteSpace: "nowrap" }}>{title}</Text>
            {isAI && (
              <Badge size="xs" color="blue">
                AI
              </Badge>
            )}
          </Group>
          <Group gap="xs" wrap="wrap">
            <Group gap={4} wrap="nowrap">
              <IconBarbell style={{ width: rem(14), height: rem(14), flexShrink: 0 }} />
              <Text size="xs">{type}</Text>
            </Group>
            <Group gap={4} wrap="nowrap">
              <IconCalendarEvent style={{ width: rem(14), height: rem(14), flexShrink: 0 }} />
              <Text size="xs">{duration}</Text>
            </Group>
            <Badge size="xs" color={intensityColor} variant="light">
              {intensity}
            </Badge>
          </Group>
        </Stack>
      </Group>

      <ActionIcon variant="subtle" size={36} style={{ flexShrink: 0 }}>
        <IconDotsVertical style={{ width: rem(16), height: rem(16) }} />
      </ActionIcon>
    </Group>
  );
}

export function UpcomingWorkouts() {
  const workouts = [
    {
      date: "2025-03-16",
      day: "16",
      title: "Sprint & Technique",
      type: "Speed",
      duration: "90 min",
      intensity: "High" as const,
      isAI: true,
    },
    {
      date: "2025-03-17",
      day: "17",
      title: "Recovery Session",
      type: "Recovery",
      duration: "45 min",
      intensity: "Low" as const,
      isAI: true,
    },
    {
      date: "2025-03-18",
      day: "18",
      title: "Strength Training",
      type: "Strength",
      duration: "75 min",
      intensity: "Medium" as const,
      isAI: true,
    },
    {
      date: "2025-03-19",
      day: "19",
      title: "Push Technique",
      type: "Technical",
      duration: "60 min",
      intensity: "Medium" as const,
    },
  ];

  return (
    <Card withBorder shadow="sm" p={0} pt="md">
      <Stack gap={0}>
        <Group justify="space-between" px="md" pb="md">
          <Title order={3}>Upcoming Workouts</Title>
          <Text c="blue" size="sm" style={{ cursor: "pointer" }}>
            View Calendar
          </Text>
        </Group>

        <Stack gap={0}>
          {workouts.map((workout, index) => (
            <WorkoutItem key={index} {...workout} />
          ))}
        </Stack>

        <Button variant="subtle" fullWidth mt="md">
          View All
        </Button>
      </Stack>
    </Card>
  );
}
