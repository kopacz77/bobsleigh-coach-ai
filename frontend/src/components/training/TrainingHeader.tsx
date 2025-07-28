"use client";

import { Badge, Button, Group, Menu, Stack, Text, Title } from "@mantine/core";
import {
  IconCalendar,
  IconChevronDown,
  IconFilter,
  IconListDetails,
  IconPlus,
} from "@tabler/icons-react";

export function TrainingHeader() {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Stack gap="xs">
        <Title order={1}>Training</Title>
        <Text c="dimmed">Manage your training sessions and view AI recommendations</Text>
      </Stack>

      <Group gap="md">
        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <Button
              variant="outline"
              leftSection={<IconFilter size={16} />}
              rightSection={<IconChevronDown size={14} />}
            >
              Filter
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Training Type</Menu.Label>
            <Menu.Item>Strength</Menu.Item>
            <Menu.Item>Speed</Menu.Item>
            <Menu.Item>Technical</Menu.Item>
            <Menu.Item>Recovery</Menu.Item>

            <Menu.Divider />

            <Menu.Label>Date Range</Menu.Label>
            <Menu.Item>This week</Menu.Item>
            <Menu.Item>This month</Menu.Item>
            <Menu.Item>Last 3 months</Menu.Item>
            <Menu.Item>Custom range</Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <Button
              variant="outline"
              leftSection={<IconListDetails size={16} />}
              rightSection={<IconChevronDown size={14} />}
            >
              View
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item leftSection={<IconCalendar size={14} />}>Calendar</Menu.Item>
            <Menu.Item leftSection={<IconListDetails size={14} />}>List</Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <Button leftSection={<IconPlus size={16} />}>Add Workout</Button>
      </Group>
    </Group>
  );
}
