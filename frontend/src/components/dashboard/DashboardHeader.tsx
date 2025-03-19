'use client';

import { Button, Group, Title, Text, Stack, Badge, useMantineTheme } from '@mantine/core';
import { IconCalendarPlus, IconTarget } from '@tabler/icons-react';

export function DashboardHeader() {
  const theme = useMantineTheme();
  
  return (
    <Group justify="space-between" wrap="nowrap">
      <Stack gap="xs">
        <Group align="center" gap="xs">
          <Title order={1}>Dashboard</Title>
          <Badge color="blue" variant="light" size="lg">
            Bobsleigh
          </Badge>
        </Group>
        <Text c="dimmed">Welcome back, John. Your training metrics are looking strong this week.</Text>
      </Stack>
      
      <Group gap="md">
        <Button variant="outline" leftSection={<IconTarget size={16} />}>
          Set Goals
        </Button>
        <Button leftSection={<IconCalendarPlus size={16} />}>
          Log Workout
        </Button>
      </Group>
    </Group>
  );
}
