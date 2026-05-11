"use client";

import { Badge, Button, Group, Stack, Text, Title, useMantineTheme } from "@mantine/core";
import { IconCalendarPlus, IconTarget } from "@tabler/icons-react";

export function DashboardHeader() {
  const theme = useMantineTheme();

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap">
        <Stack gap="xs">
          <Group ta="center" gap="xs">
            <Title order={1} fz={{ base: "lg", md: "xl" }}>Dashboard</Title>
            <Badge color="blue" variant="light" size="lg">
              Bobsleigh
            </Badge>
          </Group>
          <Text c="dimmed" size="sm">
            Welcome back, John. Your training metrics are looking strong this week.
          </Text>
        </Stack>

        <Group gap="sm">
          <Button variant="outline" leftSection={<IconTarget size={16} />} size="sm">
            Set Goals
          </Button>
          <Button leftSection={<IconCalendarPlus size={16} />} size="sm">Log Workout</Button>
        </Group>
      </Group>
    </Stack>
  );
}
