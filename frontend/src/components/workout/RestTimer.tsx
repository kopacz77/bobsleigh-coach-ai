"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Collapse,
  Group,
  RingProgress,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconChevronDown,
  IconChevronUp,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
} from "@tabler/icons-react";
import { useRestTimer } from "@/hooks/useRestTimer";

const REST_PRESETS = [
  { label: "60s", seconds: 60 },
  { label: "90s", seconds: 90 },
  { label: "2min", seconds: 120 },
  { label: "3min", seconds: 180 },
] as const;

interface RestTimerProps {
  /** Externally triggered start (e.g., from completing a set) */
  autoStartSeconds?: number | null;
  onAutoStartHandled?: () => void;
}

export function RestTimer({ autoStartSeconds, onAutoStartHandled }: RestTimerProps) {
  const { remaining, isRunning, start, stop, reset } = useRestTimer(120);
  const [expanded, { toggle }] = useDisclosure(true);

  // Handle external auto-start trigger
  if (autoStartSeconds && !isRunning && remaining === 0) {
    start(autoStartSeconds);
    onAutoStartHandled?.();
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Progress percentage for ring (inverted: full at start, empty at end)
  const maxSeconds = 180; // max preset
  const progress = remaining > 0 ? (remaining / maxSeconds) * 100 : 0;

  // Color transitions: green -> yellow -> red as time runs out
  const timerColor =
    remaining > 30 ? "green" : remaining > 10 ? "yellow" : "red";

  // Minimized floating indicator when collapsed and running
  if (!expanded && isRunning) {
    return (
      <Card
        withBorder
        radius="lg"
        p="xs"
        style={{
          position: "sticky",
          bottom: 16,
          zIndex: 100,
          cursor: "pointer",
        }}
        onClick={toggle}
      >
        <Group justify="space-between">
          <Group gap="xs">
            <Badge color={timerColor} size="xl" variant="filled" fz="lg" fw={700}>
              {timeDisplay}
            </Badge>
            <Text size="sm" c="dimmed">
              Rest Timer
            </Text>
          </Group>
          <ActionIcon variant="subtle" size="md">
            <IconChevronUp size={18} />
          </ActionIcon>
        </Group>
      </Card>
    );
  }

  return (
    <Card withBorder radius="lg" p={{ base: "sm", md: "lg" }}>
      <Group justify="space-between" mb="sm">
        <Title order={4} fz={{ base: "md", md: "lg" }}>
          Rest Timer
        </Title>
        {isRunning && (
          <ActionIcon variant="subtle" onClick={toggle}>
            <IconChevronDown size={18} />
          </ActionIcon>
        )}
      </Group>

      <Collapse in={expanded}>
        <Stack align="center" gap="md">
          {/* Large countdown display */}
          <RingProgress
            size={160}
            thickness={10}
            roundCaps
            sections={[{ value: Math.min(progress, 100), color: timerColor }]}
            label={
              <Text fw={700} ta="center" fz={36} style={{ fontVariantNumeric: "tabular-nums" }}>
                {timeDisplay}
              </Text>
            }
          />

          {/* Controls */}
          <Group gap="sm">
            {isRunning ? (
              <Button
                size="lg"
                color="red"
                variant="light"
                leftSection={<IconPlayerPause size={20} />}
                onClick={stop}
                styles={{ root: { minHeight: 48 } }}
              >
                Stop
              </Button>
            ) : (
              <Button
                size="lg"
                color="green"
                leftSection={<IconPlayerPlay size={20} />}
                onClick={() => start()}
                styles={{ root: { minHeight: 48 } }}
              >
                Start
              </Button>
            )}
            <ActionIcon
              variant="light"
              size="xl"
              radius="md"
              onClick={reset}
              aria-label="Reset timer"
              styles={{ root: { minHeight: 48, minWidth: 48 } }}
            >
              <IconRefresh size={20} />
            </ActionIcon>
          </Group>

          {/* Preset buttons */}
          <Group gap="xs">
            {REST_PRESETS.map((preset) => (
              <Button
                key={preset.seconds}
                variant={remaining === 0 && !isRunning ? "filled" : "outline"}
                size="md"
                onClick={() => start(preset.seconds)}
                styles={{ root: { minHeight: 44 } }}
              >
                {preset.label}
              </Button>
            ))}
          </Group>
        </Stack>
      </Collapse>
    </Card>
  );
}
