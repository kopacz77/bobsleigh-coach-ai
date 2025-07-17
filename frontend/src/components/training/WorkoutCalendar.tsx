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
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { IconChevronLeft, IconChevronRight, IconInfoCircle, IconPlus } from "@tabler/icons-react";
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
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <Grid gutter="md">
      <Grid.Col span={{ base: 12, md: 8 }}>
        <Card withBorder shadow="sm" p="md">
          <DatePicker
            size="xl"
            value={selectedDate}
            onChange={setSelectedDate}
            defaultLevel="month"
            firstDayOfWeek={0}
            styles={(theme) => ({
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

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Card withBorder shadow="sm" h="100%">
          <Stack spacing="md">
            <Group position="apart">
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
              <Stack spacing="md">
                <Skeleton height={100} radius="md" />
                <Skeleton height={100} radius="md" />
              </Stack>
            ) : todayEvents.length > 0 ? (
              <Stack spacing="md">
                {todayEvents.map((event) => (
                  <Paper key={event.id} withBorder p="md" radius="md">
                    <Stack spacing="xs">
                      <Group position="apart">
                        <Group>
                          <Text fw={500}>{event.name}</Text>
                          {event.isAI && (
                            <Tooltip label="AI Recommended Workout">
                              <Badge size="xs" color="blue">
                                AI
                              </Badge>
                            </Tooltip>
                          )}
                          {event.isCompleted && (
                            <Badge size="xs" color="green">
                              Completed
                            </Badge>
                          )}
                        </Group>
                        <Badge color={getIntensityColor(event.intensity)}>{event.intensity}</Badge>
                      </Group>

                      <Group spacing="lg">
                        <Text size="sm">{event.type}</Text>
                        <Text size="sm">•</Text>
                        <Text size="sm">{event.duration} min</Text>
                      </Group>

                      <Group position="apart" mt="xs">
                        <Button variant="light" size="xs">
                          {event.isCompleted ? "View Details" : "Start Workout"}
                        </Button>
                        <ActionIcon variant="subtle">
                          <IconInfoCircle style={{ width: rem(16), height: rem(16) }} />
                        </ActionIcon>
                      </Group>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Stack spacing="md" justify="center" align="center" style={{ height: "200px" }}>
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
  );
}
