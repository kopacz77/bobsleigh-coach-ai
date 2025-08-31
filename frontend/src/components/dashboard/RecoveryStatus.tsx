"use client";

import {
  Card,
  Group,
  Progress,
  RingProgress,
  rem,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { IconBarbell, IconBattery3, IconHeartbeat, IconMoon } from "@tabler/icons-react";

export function RecoveryStatus() {
  const theme = useMantineTheme();

  const metrics = [
    {
      name: "Sleep",
      value: "7.3 hrs",
      score: 82,
      icon: <IconMoon style={{ width: rem(18), height: rem(18) }} stroke={1.5} color="white" />,
      color: "indigo",
    },
    {
      name: "Muscle",
      value: "Good",
      score: 78,
      icon: <IconBarbell style={{ width: rem(18), height: rem(18) }} stroke={1.5} color="white" />,
      color: "orange",
    },
    {
      name: "HRV",
      value: "72 ms",
      score: 85,
      icon: (
        <IconHeartbeat style={{ width: rem(18), height: rem(18) }} stroke={1.5} color="white" />
      ),
      color: "red",
    },
  ];

  // Recovery score is the average of all individual metrics
  const recoveryScore = Math.round(
    metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length
  );

  // Determine the color based on the recovery score
  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.colors.green[6];
    if (score >= 60) return theme.colors.yellow[6];
    return theme.colors.red[6];
  };

  const scoreColor = getScoreColor(recoveryScore);

  return (
    <Card withBorder shadow="sm" p="md" h="100%">
      <Stack gap="md" justify="space-between" h="100%">
        <Group justify="space-between">
          <Title order={3}>Recovery Status</Title>
          <ThemeIcon size="md" radius="xl" color={scoreColor}>
            <IconBattery3 style={{ width: rem(16), height: rem(16) }} />
          </ThemeIcon>
        </Group>

        <Group justify="center">
          <RingProgress
            size={130}
            thickness={12}
            sections={[{ value: recoveryScore, color: scoreColor }]}
            label={
              <Stack gap={0} ta="center">
                <Text fw={700} size="xl">
                  {recoveryScore}%
                </Text>
                <Text size="xs" c="dimmed">
                  Recovery
                </Text>
              </Stack>
            }
          />
        </Group>

        <Stack gap="md">
          <Title order={5}>Recovery Metrics</Title>

          <SimpleGrid cols={1}>
            {metrics.map((metric) => (
              <Stack key={metric.name} gap={2}>
                <Group justify="space-between">
                  <Group gap="xs">
                    <ThemeIcon size="sm" radius="xl" color={metric.color}>
                      {metric.icon}
                    </ThemeIcon>
                    <Text size="sm">{metric.name}</Text>
                  </Group>
                  <Group gap="xs">
                    <Text size="sm">{metric.value}</Text>
                    <Text size="sm" fw={500} c={getScoreColor(metric.score)}>
                      {metric.score}%
                    </Text>
                  </Group>
                </Group>
                <Progress
                  value={metric.score}
                  color={getScoreColor(metric.score)}
                  size="sm"
                  radius="xl"
                />
              </Stack>
            ))}
          </SimpleGrid>
        </Stack>

        <Text size="xs" c="dimmed" mt="md">
          Based on your recent training load and recovery metrics, your body is in a
          {recoveryScore >= 80
            ? " well-recovered "
            : recoveryScore >= 60
              ? " moderately recovered "
              : " fatigued "}
          state.
        </Text>
      </Stack>
    </Card>
  );
}
