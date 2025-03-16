'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  ScrollArea,
  Stack,
  Pagination,
  TextInput,
  rem,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconCopy,
  IconPrinter,
  IconSearch,
} from '@tabler/icons-react';

interface WorkoutData {
  id: string;
  date: string;
  name: string;
  type: string;
  duration: number;
  intensity: 'Low' | 'Medium' | 'High';
  notes: string;
}

const mockWorkouts: WorkoutData[] = [
  {
    id: '1',
    date: '2025-03-15',
    name: 'Morning Sprint Session',
    type: 'Speed',
    duration: 90,
    intensity: 'High',
    notes: 'Focus on start technique and acceleration',
  },
  {
    id: '2',
    date: '2025-03-14',
    name: 'Full Body Strength',
    type: 'Strength',
    duration: 75,
    intensity: 'Medium',
    notes: 'Improved deadlift max by 5kg',
  },
  {
    id: '3',
    date: '2025-03-12',
    name: 'Technical Drills',
    type: 'Technical',
    duration: 60,
    intensity: 'Medium',
    notes: 'Worked on push technique with video analysis',
  },
  {
    id: '4',
    date: '2025-03-10',
    name: 'Recovery Session',
    type: 'Recovery',
    duration: 45,
    intensity: 'Low',
    notes: 'Light activity and mobility work',
  },
  {
    id: '5',
    date: '2025-03-08',
    name: 'Heavy Lower Body',
    type: 'Strength',
    duration: 80,
    intensity: 'High',
    notes: 'Squats, lunges, hip thrusts',
  },
  {
    id: '6',
    date: '2025-03-06',
    name: 'Interval Training',
    type: 'Speed',
    duration: 65,
    intensity: 'High',
    notes: '10x60m sprints with full recovery',
  },
  {
    id: '7',
    date: '2025-03-04',
    name: 'Upper Body Focus',
    type: 'Strength',
    duration: 70,
    intensity: 'Medium',
    notes: 'Bench press, rows, pull-ups',
  },
];

function getIntensityColor(intensity: 'Low' | 'Medium' | 'High') {
  return {
    Low: 'green',
    Medium: 'yellow',
    High: 'red',
  }[intensity];
}

export function WorkoutList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Filter workouts based on search term
  const filteredWorkouts = mockWorkouts.filter(workout => {
    const searchTerms = search.toLowerCase();
    return (
      workout.name.toLowerCase().includes(searchTerms) ||
      workout.type.toLowerCase().includes(searchTerms) ||
      workout.notes.toLowerCase().includes(searchTerms)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredWorkouts.length / itemsPerPage);
  const paginatedWorkouts = filteredWorkouts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Stack spacing="md">
      <TextInput
        placeholder="Search workouts"
        leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} />}
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
      />

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
                <Table.Th style={{ width: rem(80) }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedWorkouts.map((workout) => (
                <Table.Tr key={workout.id}>
                  <Table.Td>{formatDate(workout.date)}</Table.Td>
                  <Table.Td>
                    <Text fw={500}>{workout.name}</Text>
                  </Table.Td>
                  <Table.Td>{workout.type}</Table.Td>
                  <Table.Td>{workout.duration} min</Table.Td>
                  <Table.Td>
                    <Badge color={getIntensityColor(workout.intensity)}>
                      {workout.intensity}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text truncate maw={200} title={workout.notes}>
                      {workout.notes}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={0} justify="flex-end">
                      <Menu shadow="md" position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle">
                            <IconDotsVertical style={{ width: rem(16), height: rem(16) }} />
                          </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconEdit style={{ width: rem(14), height: rem(14) }} />}>
                            Edit
                          </Menu.Item>
                          <Menu.Item leftSection={<IconCopy style={{ width: rem(14), height: rem(14) }} />}>
                            Duplicate
                          </Menu.Item>
                          <Menu.Item leftSection={<IconPrinter style={{ width: rem(14), height: rem(14) }} />}>
                            Print
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item 
                            color="red" 
                            leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
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
