"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Paper,
  rem,
  Skeleton,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { IconInfoCircle, IconPlus } from "@tabler/icons-react";
import { useState } from "react";

interface EventData {
  id: string;
  date: Date;
  name: string;
  type: string;
  duration: number;
  intensity: "Low" | "Medium" | "High";
  isAI?: boolean;
  isCompleted?: boolean;
}

const getIntensityColor = (intensity: "Low" | "Medium" | "High") => {
  return {
    Low: "green",
    Medium: "yellow",
    High: "red",
  }[intensity];
};

export function WorkoutCalendar() {
  const theme = useMantineTheme();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isLoading, _setIsLoading] = useState(false);

  // Mock events data
  const events: EventData[] = [
    {
      id: "1",
      date: new Date("2025-03-15"),
      name: "Sprint Session",
      type: "Speed",
      duration: 90,
      intensity: "High",
      isCompleted: true,
    },
    {
      id: "2",
      date: new Date("2025-03-16"),
      name: "Technical Drills",
      type: "Technical",
      duration: 60,
      intensity: "Medium",
      isAI: true,
    },
    {
      id: "3",
      date: new Date("2025-03-18"),
      name: "Strength Training",
      type: "Strength",
      duration: 75,
      intensity: "Medium",
      isAI: true,
    },
    {
      id: "4",
      date: new Date("2025-03-20"),
      name: "Recovery Session",
      type: "Recovery",
      duration: 45,
      intensity: "Low",
      isAI: true,
    },
    {
      id: "5",
      date: new Date("2025-03-22"),
      name: "Sprint & Plyometrics",
      type: "Speed",
      duration: 80,
      intensity: "High",
      isAI: true,
    },
  ];

  const getEventsForDay = (date: Date | null): EventData[] => {
    if (!date) return [];

    return events.filter((event) => {
      return (
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
      );
    });
  };

  const renderDayContent = (date: Date) => {
    const dayEvents = events.filter((event) => {
      return (
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
      );
    });

    if (dayEvents.length === 0) return null;

    return (
      <Box
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {dayEvents.map((event, i) => (
          <Box
            key={i}
            w={8}
            h={8}
            style={{
              borderRadius: "50%",
              margin: "0 2px",
              backgroundColor: theme.colors[getIntensityColor(event.intensity)][6],
            }}
          />
        ))}
      </Box>
    );
  };

  const todayEvents = getEventsForDay(selectedDate);

  // Render event card (shared between calendar sidebar and mobile list)
  const renderEventCard = (event: EventData) => (
    <Paper key={event.id} withBorder p="sm" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" wrap="wrap">
          <Group gap="xs" wrap="wrap">
            <Text fw={500} size="sm">
              {event.name}
            </Text>
            {event.isAI && (
              <Badge size="xs" color="blue">
                AI
              </Badge>
            )}
            {event.isCompleted && (
              <Badge size="xs" color="green">
                Done
              </Badge>
            )}
          </Group>
          <Badge color={getIntensityColor(event.intensity)} size="sm">
            {event.intensity}
          </Badge>
        </Group>

        <Group gap="sm">
          <Text size="sm">{event.type}</Text>
          <Text size="sm" c="dimmed">
            -
          </Text>
          <Text size="sm">{event.duration} min</Text>
        </Group>

        <Group justify="space-between" mt="xs">
          <Button variant="light" size="xs">
            {event.isCompleted ? "View Details" : "Start Workout"}
          </Button>
          <ActionIcon variant="subtle" size={36}>
            <IconInfoCircle style={{ width: rem(16), height: rem(16) }} />
          </ActionIcon>
        </Group>
      </Stack>
    </Paper>
  );

  // Mobile: list all events grouped by date
  const renderMobileEventsList = () => {
    if (events.length === 0) {
      return (
        <Stack gap="md" ta="center" py="xl">
          <Text c="dimmed">No workouts scheduled</Text>
          <Button variant="light" leftSection={<IconPlus size={16} />}>
            Add Workout
          </Button>
        </Stack>
      );
    }

    return (
      <Stack gap="sm">
        {events.map((event) => (
          <Box key={event.id}>
            <Text size="xs" c="dimmed" fw={500} mb={4}>
              {event.date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
            {renderEventCard(event)}
          </Box>
        ))}
      </Stack>
    );
  };

  return (
    <Box>
      {/* Desktop: calendar + sidebar */}
      <Box visibleFrom="md">
        <Grid gutter="md">
          <Grid.Col span={8}>
            <Card withBorder shadow="sm" p="md">
              <DatePicker
                size="xl"
                value={selectedDate}
                onChange={setSelectedDate}
                defaultLevel="month"
                firstDayOfWeek={0}
                styles={() => ({
                  monthCell: {
                    position: "relative",
                    padding: "5px 0",
                  },
                })}
                renderDay={(date) => {
                  const day = date.getDate();
                  return (
                    <div style={{ position: "relative", padding: "5px 0" }}>
                      {day}
                      {renderDayContent(date)}
                    </div>
                  );
                }}
              />
            </Card>
          </Grid.Col>

          <Grid.Col span={4}>
            <Card withBorder shadow="sm" h="100%">
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={500}>
                    {selectedDate?.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                  <Button variant="light" leftSection={<IconPlus size={16} />} size="xs">
                    Add Workout
                  </Button>
                </Group>

                {isLoading ? (
                  <Stack gap="md">
                    <Skeleton height={100} radius="md" />
                    <Skeleton height={100} radius="md" />
                  </Stack>
                ) : todayEvents.length > 0 ? (
                  <Stack gap="md">{todayEvents.map((event) => renderEventCard(event))}</Stack>
                ) : (
                  <Stack gap="md" justify="center" ta="center" style={{ height: "200px" }}>
                    <Text c="dimmed">No workouts scheduled for this day</Text>
                    <Button variant="light" leftSection={<IconPlus size={16} />} size="xs">
                      Add Workout
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Box>

      {/* Mobile: list view */}
      <Box hiddenFrom="md">
        <Card withBorder shadow="sm" p="sm">
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={4}>Upcoming Workouts</Title>
              <Button variant="light" leftSection={<IconPlus size={16} />} size="xs">
                Add
              </Button>
            </Group>
            {renderMobileEventsList()}
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}
