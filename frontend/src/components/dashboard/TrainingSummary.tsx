"use client";

import { Card, Group, RingProgress, rem, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconClock,
  IconHeartbeat,
  IconWeight,
} from "@tabler/icons-react";

interface StatProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
}

function Stat({ title, value, change, icon, color }: StatProps) {
  return (
    <Group wrap="nowrap">
      <Group wrap="nowrap" gap="xs" w="70%">
        <Group bg={color} style={{ padding: "8px", borderRadius: "8px" }}>
          {icon}
        </Group>
        <Stack spacing={0}>
          <Text size="xs" c="dimmed">
            {title}
          </Text>
          <Text fw={700} size="lg">
            {value}
          </Text>
          <Group gap="xs" wrap="nowrap">
            {change > 0 ? (
              <IconArrowUpRight style={{ width: rem(12), height: rem(12) }} color="green" />
            ) : (
              <IconArrowDownRight style={{ width: rem(12), height: rem(12) }} color="red" />
            )}
            <Text size="xs" c={change > 0 ? "green" : "red"} fw={700}>
              {Math.abs(change)}%
            </Text>
            <Text size="xs" c="dimmed">
              vs last week
            </Text>
          </Group>
        </Stack>
      </Group>
    </Group>
  );
}

export function TrainingSummary() {
  const stats = [
    {
      title: "Weekly Volume",
      value: "12.5 hrs",
      change: 8,
      icon: <IconClock style={{ width: rem(18), height: rem(18) }} stroke={1.5} color="white" />,
      color: "blue",
    },
    {
      title: "Training Load",
      value: "685 TSS",
      change: -3,
      icon: <IconWeight style={{ width: rem(18), height: rem(18) }} stroke={1.5} color="white" />,
      color: "violet",
    },
    {
      title: "Avg Heart Rate",
      value: "148 BPM",
      change: 4,
      icon: (
        <IconHeartbeat style={{ width: rem(18), height: rem(18) }} stroke={1.5} color="white" />
      ),
      color: "red",
    },
  ];

  return (
    <Card withBorder shadow="sm" p="md">
      <Stack spacing="md">
        <Group position="apart">
          <Title order={3}>Weekly Training Summary</Title>
          <Text c="dimmed" fz="sm">
            Mar 9 - Mar 15, 2025
          </Text>
        </Group>

        <SimpleGrid cols={{ base: 1, xs: 3 }}>
          {stats.map((stat, index) => (
            <Stat key={index} {...stat} />
          ))}
        </SimpleGrid>

        <Group position="apart" pt="sm">
          <Stack spacing={0}>
            <Text fw={500}>Weekly Goal Progress</Text>
            <Text size="xs" c="dimmed">
              85% of weekly training target reached
            </Text>
          </Stack>
          <RingProgress
            size={80}
            thickness={8}
            sections={[{ value: 85, color: "blue" }]}
            label={
              <Text fw={700} ta="center" size="lg">
                85%
              </Text>
            }
          />
        </Group>
      </Stack>
    </Card>
  );
}
