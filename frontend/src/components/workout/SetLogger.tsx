"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconPlus, IconPlayerPlay } from "@tabler/icons-react";
import { useCallback, useState } from "react";

export interface SetData {
  setNumber: number;
  weight_kg: number | null;
  reps: number | null;
  completed: boolean;
}

interface PlannedExercise {
  exercise_id?: string;
  exercise_name: string;
  planned_sets: number;
  planned_reps: number;
  planned_weight_kg: number | null;
}

interface SetLoggerProps {
  exercise: PlannedExercise;
  exerciseIndex: number;
  onStartRest: () => void;
  onSetsChange: (exerciseIndex: number, sets: SetData[], rpe: number | null) => void;
}

export function SetLogger({ exercise, exerciseIndex, onStartRest, onSetsChange }: SetLoggerProps) {
  const [sets, setSets] = useState<SetData[]>(() =>
    Array.from({ length: exercise.planned_sets || 3 }, (_, i) => ({
      setNumber: i + 1,
      weight_kg: exercise.planned_weight_kg,
      reps: exercise.planned_reps,
      completed: false,
    })),
  );
  const [rpe, setRpe] = useState<string | null>(null);

  const completedCount = sets.filter((s) => s.completed).length;
  const allDone = completedCount === sets.length;

  const updateSet = useCallback(
    (index: number, field: keyof SetData, value: number | boolean | null) => {
      setSets((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        const rpeVal = rpe ? Number(rpe) : null;
        // Notify parent of change
        setTimeout(() => onSetsChange(exerciseIndex, next, rpeVal), 0);
        return next;
      });
    },
    [exerciseIndex, onSetsChange, rpe],
  );

  const handleComplete = useCallback(
    (index: number, checked: boolean) => {
      updateSet(index, "completed", checked);
      if (checked) {
        onStartRest();
        // Auto-fill next set with same values
        if (index < sets.length - 1) {
          const currentSet = sets[index];
          setSets((prev) => {
            const next = [...prev];
            if (!next[index + 1].completed) {
              next[index + 1] = {
                ...next[index + 1],
                weight_kg: currentSet.weight_kg,
                reps: currentSet.reps,
              };
            }
            return next;
          });
        }
      }
    },
    [updateSet, onStartRest, sets],
  );

  const addSet = useCallback(() => {
    const lastSet = sets[sets.length - 1];
    const newSet: SetData = {
      setNumber: sets.length + 1,
      weight_kg: lastSet?.weight_kg ?? exercise.planned_weight_kg,
      reps: lastSet?.reps ?? exercise.planned_reps,
      completed: false,
    };
    setSets((prev) => {
      const next = [...prev, newSet];
      const rpeVal = rpe ? Number(rpe) : null;
      setTimeout(() => onSetsChange(exerciseIndex, next, rpeVal), 0);
      return next;
    });
  }, [sets, exercise, exerciseIndex, onSetsChange, rpe]);

  const handleRpeChange = useCallback(
    (value: string) => {
      setRpe(value);
      const rpeVal = value ? Number(value) : null;
      onSetsChange(exerciseIndex, sets, rpeVal);
    },
    [exerciseIndex, sets, onSetsChange],
  );

  return (
    <Card withBorder radius="lg" p={{ base: "sm", md: "lg" }}>
      <Group justify="space-between" mb="sm">
        <Stack gap={2}>
          <Title order={4} fz={{ base: "md", md: "lg" }}>
            {exercise.exercise_name}
          </Title>
          <Text size="sm" c="dimmed">
            Target: {exercise.planned_sets} x {exercise.planned_reps}
            {exercise.planned_weight_kg ? ` @ ${exercise.planned_weight_kg}kg` : ""}
          </Text>
        </Stack>
        <Badge
          color={allDone ? "green" : "blue"}
          size="lg"
          variant="light"
        >
          {completedCount}/{sets.length}
        </Badge>
      </Group>

      <Stack gap="sm">
        {sets.map((set, i) => (
          <Group
            key={set.setNumber}
            gap="xs"
            wrap="nowrap"
            align="flex-end"
            style={{
              opacity: set.completed ? 0.7 : 1,
            }}
          >
            <Text fw={600} fz="sm" w={36} ta="center" c="dimmed">
              S{set.setNumber}
            </Text>

            <NumberInput
              label={i === 0 ? "kg" : undefined}
              value={set.weight_kg ?? ""}
              onChange={(val) => updateSet(i, "weight_kg", val === "" ? null : Number(val))}
              decimalScale={1}
              step={2.5}
              min={0}
              max={500}
              size="md"
              disabled={set.completed}
              styles={{
                input: { minHeight: 48, fontSize: 16, textAlign: "center" },
                root: { flex: 1 },
              }}
            />

            <NumberInput
              label={i === 0 ? "Reps" : undefined}
              value={set.reps ?? ""}
              onChange={(val) => updateSet(i, "reps", val === "" ? null : Number(val))}
              decimalScale={0}
              step={1}
              min={0}
              max={100}
              size="md"
              disabled={set.completed}
              styles={{
                input: { minHeight: 48, fontSize: 16, textAlign: "center" },
                root: { flex: 1 },
              }}
            />

            <Checkbox
              checked={set.completed}
              onChange={(e) => handleComplete(i, e.currentTarget.checked)}
              size="lg"
              styles={{
                input: { width: 36, height: 36, cursor: "pointer" },
                root: { marginBottom: i === 0 ? 0 : 0 },
              }}
              aria-label={`Complete set ${set.setNumber}`}
            />
          </Group>
        ))}
      </Stack>

      <Group mt="md" gap="sm">
        <Button
          variant="light"
          size="sm"
          leftSection={<IconPlus size={16} />}
          onClick={addSet}
        >
          Add Set
        </Button>
        <Button
          variant="subtle"
          size="sm"
          leftSection={<IconPlayerPlay size={16} />}
          onClick={onStartRest}
        >
          Start Rest
        </Button>
      </Group>

      {/* RPE selector -- shown when all sets are completed */}
      {allDone && (
        <Stack gap="xs" mt="md">
          <Text fw={600} fz="sm">
            RPE (Rate of Perceived Exertion)
          </Text>
          <SegmentedControl
            value={rpe ?? ""}
            onChange={handleRpeChange}
            data={Array.from({ length: 10 }, (_, i) => ({
              value: String(i + 1),
              label: String(i + 1),
            }))}
            size="md"
            fullWidth
            styles={{
              root: { minHeight: 44 },
            }}
          />
          <Text size="xs" c="dimmed">
            {rpe && Number(rpe) <= 3
              ? "Easy -- could do many more reps"
              : rpe && Number(rpe) <= 6
                ? "Moderate -- a few reps left in the tank"
                : rpe && Number(rpe) <= 8
                  ? "Hard -- 1-2 reps left"
                  : rpe
                    ? "Maximum effort -- could not do another rep"
                    : "Rate how hard this exercise felt"}
          </Text>
        </Stack>
      )}
    </Card>
  );
}
