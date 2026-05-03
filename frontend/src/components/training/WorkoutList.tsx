"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Menu,
  Pagination,
  rem,
  ScrollArea,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import {
  IconCopy,
  IconDotsVertical,
  IconEdit,
  IconFilterOff,
  IconPrinter,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { useWorkouts, type WorkoutFilters } from "@/hooks/useTraining";

const WORKOUT_TYPES = [
  { value: "strength", label: "Strength" },
  { value: "power", label: "Power" },
  { value: "speed", label: "Speed" },
  { value: "endurance", label: "Endurance" },
  { value: "recovery", label: "Recovery" },
];

function rpeToIntensity(rpe: number | null | undefined): { label: string; color: string } {
  if (rpe == null) return { label: "--", color: "gray" };
  if (rpe <= 3) return { label: "Low", color: "green" };
  if (rpe <= 6) return { label: "Medium", color: "yellow" };
  return { label: "High", color: "red" };
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ITEMS_PER_PAGE = 10;

export function WorkoutList() {
  const [search, setSearch] = useState("");
  const [workoutType, setWorkoutType] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [page, setPage] = useState(1);

  const filters: WorkoutFilters = {
    search: search || undefined,
    workout_type: workoutType || undefined,
    date_from: dateFrom ? dateFrom.toISOString().split("T")[0] : undefined,
    date_to: dateTo ? dateTo.toISOString().split("T")[0] : undefined,
    limit: ITEMS_PER_PAGE,
    offset: (page - 1) * ITEMS_PER_PAGE,
  };

  const { data: workouts, isLoading } = useWorkouts(filters);

  const hasFilters = search || workoutType || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch("");
    setWorkoutType(null);
    setDateFrom(null);
    setDateTo(null);
    setPage(1);
  };

  // When filters change, reset to page 1
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const handleTypeChange = (value: string | null) => {
    setWorkoutType(value);
    setPage(1);
  };
  const handleDateFromChange = (value: Date | null) => {
    setDateFrom(value);
    setPage(1);
  };
  const handleDateToChange = (value: Date | null) => {
    setDateTo(value);
    setPage(1);
  };

  const renderSkeletonRows = () =>
    Array.from({ length: 5 }).map((_, i) => (
      <Table.Tr key={`skeleton-${i}`}>
        {Array.from({ length: 7 }).map((__, j) => (
          <Table.Td key={`skeleton-${i}-${j}`}>
            <Skeleton height={20} />
          </Table.Td>
        ))}
      </Table.Tr>
    ));

  const workoutList = workouts ?? [];
  // Estimate if there are more pages (if we received a full page, there may be more)
  const hasMorePages = workoutList.length === ITEMS_PER_PAGE;
  const totalPages = hasMorePages ? page + 1 : page;

  return (
    <Stack gap="md">
      {/* Search input */}
      <TextInput
        placeholder="Search workouts by name..."
        leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} />}
        value={search}
        onChange={(event) => handleSearchChange(event.currentTarget.value)}
      />

      {/* Filter controls */}
      <Group gap="sm" wrap="wrap">
        <Select
          placeholder="All Types"
          data={WORKOUT_TYPES}
          value={workoutType}
          onChange={handleTypeChange}
          clearable
          style={{ minWidth: 150 }}
        />
        <DatePickerInput
          placeholder="From date"
          value={dateFrom}
          onChange={handleDateFromChange}
          clearable
          style={{ minWidth: 160 }}
        />
        <DatePickerInput
          placeholder="To date"
          value={dateTo}
          onChange={handleDateToChange}
          clearable
          style={{ minWidth: 160 }}
        />
        {hasFilters && (
          <Button
            variant="subtle"
            size="sm"
            leftSection={<IconFilterOff style={{ width: rem(14), height: rem(14) }} />}
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        )}
      </Group>

      <Card withBorder shadow="sm" p={0} radius="md">
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Workout</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Duration</Table.Th>
                <Table.Th>Intensity</Table.Th>
                <Table.Th>Notes</Table.Th>
                <Table.Th style={{ width: rem(80) }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                renderSkeletonRows()
              ) : workoutList.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Center py="xl">
                      <Text c="dimmed" fs="italic">
                        {hasFilters
                          ? "No workouts found matching your filters."
                          : "No workouts recorded yet. Log your first workout!"}
                      </Text>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                workoutList.map((workout: Record<string, unknown>) => {
                  const intensity = rpeToIntensity(workout.rpe as number | null);
                  return (
                    <Table.Tr key={workout.id as string}>
                      <Table.Td>{formatDate(workout.date as string)}</Table.Td>
                      <Table.Td>
                        <Text fw={500}>{workout.name as string}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" size="sm">
                          {(workout.workout_type as string) ?? "--"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {workout.duration_minutes ? `${workout.duration_minutes} min` : "--"}
                      </Table.Td>
                      <Table.Td>
                        <Badge color={intensity.color}>{intensity.label}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text truncate="end" maw={200} title={(workout.notes as string) ?? ""}>
                          {(workout.notes as string) ?? "--"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={0} justify="flex-end">
                          <Menu shadow="md" position="bottom-end">
                            <Menu.Target>
                              <ActionIcon variant="subtle">
                                <IconDotsVertical
                                  style={{ width: rem(16), height: rem(16) }}
                                />
                              </ActionIcon>
                            </Menu.Target>

                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={
                                  <IconEdit style={{ width: rem(14), height: rem(14) }} />
                                }
                              >
                                Edit
                              </Menu.Item>
                              <Menu.Item
                                leftSection={
                                  <IconCopy style={{ width: rem(14), height: rem(14) }} />
                                }
                              >
                                Duplicate
                              </Menu.Item>
                              <Menu.Item
                                leftSection={
                                  <IconPrinter style={{ width: rem(14), height: rem(14) }} />
                                }
                              >
                                Print
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item
                                color="red"
                                leftSection={
                                  <IconTrash style={{ width: rem(14), height: rem(14) }} />
                                }
                              >
                                Delete
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {totalPages > 1 && (
          <Group justify="center" p="md">
            <Pagination value={page} onChange={setPage} total={totalPages} />
          </Group>
        )}
      </Card>
    </Stack>
  );
}
