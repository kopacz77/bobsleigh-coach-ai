"use client";

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Progress,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconInfoCircle,
  IconMinus,
  IconRepeat,
  IconTrendingDown,
  IconTrendingUp,
  IconWeight,
} from "@tabler/icons-react";
import { ExerciseSet, type SessionExercise } from "@/lib/types/training";

interface ExerciseCardProps {
  sessionExercise: SessionExercise;
  onSetComplete?: (exerciseId: string, setNumber: number) => void;
  onExerciseComplete?: (exerciseId: string) => void;
  showAdaptations?: boolean;
}

export function ExerciseCard({
  sessionExercise,
  onSetComplete,
  onExerciseComplete,
  showAdaptations = true,
}: ExerciseCardProps) {
  const { exercise, sets, isMainExercise, adaptationReason, substitutedFrom } = sessionExercise;

  const completedSets = sets.filter((set) => set.completed).length;
  const totalSets = sets.length;
  const completionPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  const getCategoryColor = (category: string) => {
    const colors = {
      strength: "blue",
      power: "red",
      speed: "green",
      olympic: "orange",
      accessory: "gray",
    };
    return colors[category as keyof typeof colors] || "gray";
  };

  const getAdjustmentIcon = () => {
    if (!adaptationReason) return null;

    if (adaptationReason.includes("reduce") || adaptationReason.includes("easier")) {
      return <IconTrendingDown size={16} color="orange" />;
    }
    if (adaptationReason.includes("increase") || adaptationReason.includes("harder")) {
      return <IconTrendingUp size={16} color="green" />;
    }
    return <IconMinus size={16} color="blue" />;
  };

  const formatRestTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const renderSetsTable = () => (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Set</Table.Th>
          <Table.Th>Reps</Table.Th>
          <Table.Th>Weight</Table.Th>
          <Table.Th>Rest</Table.Th>
          <Table.Th>Status</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {sets.map((set) => (
          <Table.Tr key={set.setNumber}>
            <Table.Td>
              <Text fw={500}>{set.setNumber}</Text>
            </Table.Td>
            <Table.Td>
              <Group gap={4}>
                <IconRepeat size={14} />
                <Text>{set.reps}</Text>
              </Group>
            </Table.Td>
            <Table.Td>
              <Group gap={4}>
                <IconWeight size={14} />
                <Text>{set.weight}kg</Text>
              </Group>
            </Table.Td>
            <Table.Td>
              <Group gap={4}>
                <IconClock size={14} />
                <Text size="sm">{formatRestTime(set.restSeconds)}</Text>
              </Group>
            </Table.Td>
            <Table.Td>
              {set.completed ? (
                <Badge color="green" size="sm" variant="light">
                  <IconCheck size={12} />
                </Badge>
              ) : (
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => onSetComplete?.(sessionExercise.id, set.setNumber)}
                >
                  Complete
                </Button>
              )}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Group ta="center" gap="sm">
              <Text fw={700} size="lg">
                {exercise.name}
              </Text>
              {getAdjustmentIcon()}
            </Group>

            <Group gap="xs">
              <Badge color={getCategoryColor(exercise.category)} variant="light" size="sm">
                {exercise.category}
              </Badge>

              {isMainExercise && (
                <Badge color="dark" variant="filled" size="sm">
                  Main Exercise
                </Badge>
              )}

              {exercise.equipment && (
                <Badge color="gray" variant="outline" size="sm">
                  {exercise.equipment}
                </Badge>
              )}
            </Group>
          </Stack>

          <Group ta="center" gap="xs">
            <Text size="sm" c="dimmed">
              {completedSets}/{totalSets} sets
            </Text>

            {exercise.description && (
              <Tooltip label={exercise.description} multiline>
                <ActionIcon variant="subtle" size="sm">
                  <IconInfoCircle size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        {/* Progress */}
        <Stack gap={4}>
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              Progress
            </Text>
            <Text size="sm" c="dimmed">
              {Math.round(completionPercentage)}%
            </Text>
          </Group>
          <Progress value={completionPercentage} size="sm" />
        </Stack>

        {/* Adaptations Alert */}
        {showAdaptations && adaptationReason && (
          <Alert color="blue" variant="light" title="Training Adaptation">
            <Stack gap="xs">
              <Text size="sm">{adaptationReason}</Text>
              {substitutedFrom && (
                <Text size="xs" c="dimmed">
                  Substituted from: {substitutedFrom}
                </Text>
              )}
            </Stack>
          </Alert>
        )}

        {/* Sets Table */}
        {renderSetsTable()}

        {/* Exercise Description */}
        {exercise.description && (
          <Text size="sm" c="dimmed" style={{ fontStyle: "italic" }}>
            {exercise.description}
          </Text>
        )}

        {/* Complete Exercise Button */}
        {completedSets === totalSets && (
          <Button
            fullWidth
            color="green"
            variant="light"
            leftSection={<IconCheck size={16} />}
            onClick={() => onExerciseComplete?.(sessionExercise.id)}
          >
            Exercise Complete
          </Button>
        )}
      </Stack>
    </Card>
  );
}
