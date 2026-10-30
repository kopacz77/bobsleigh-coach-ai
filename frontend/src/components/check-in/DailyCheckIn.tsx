"use client";

import {
  Box,
  Button,
  Checkbox,
  Group,
  Paper,
  SimpleGrid,
  Slider,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { IconFlame } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useCheckInToday, useSubmitCheckIn } from "@/hooks/useWellbeing";

interface CheckInFormState {
  sleep_quality: number;
  stress_level: number;
  nutrition_quality: number;
  physical_readiness: number;
  mental_clarity: number;
  notes: string;
  flag_concern: boolean;
}

const defaultValues: CheckInFormState = {
  sleep_quality: 5,
  stress_level: 5,
  nutrition_quality: 5,
  physical_readiness: 5,
  mental_clarity: 5,
  notes: "",
  flag_concern: false,
};

/**
 * Calculate readiness score matching backend formula:
 * round((sleep + (10 - stress) + nutrition + physical + mental) / 5)
 */
function calculateReadiness(form: CheckInFormState): number {
  return Math.round(
    (form.sleep_quality +
      (10 - form.stress_level) +
      form.nutrition_quality +
      form.physical_readiness +
      form.mental_clarity) /
      5
  );
}

/** Traffic light color for readiness score */
function readinessColor(score: number): string {
  if (score >= 8) return "#40c057"; // green
  if (score >= 5) return "#fab005"; // yellow
  return "#fa5252"; // red
}

/**
 * DailyCheckIn -- fast daily wellness form (under 60 seconds).
 *
 * 5 sliders + 1 concern checkbox + 1 notes field + 1 submit button.
 * Wired to backend API via useSubmitCheckIn / useCheckInToday hooks.
 */
const DailyCheckIn = () => {
  const { data: todayData, isLoading: loadingToday } = useCheckInToday();
  const submitMutation = useSubmitCheckIn();

  const [form, setForm] = useState<CheckInFormState>(defaultValues);
  const [prefilled, setPrefilled] = useState(false);

  // Pre-fill from today's existing check-in
  useEffect(() => {
    if (todayData && !prefilled) {
      let notes = todayData.notes || "";
      const hasConcern = todayData.has_concern === true;

      // Strip [CONCERN] prefix from displayed notes if present
      if (hasConcern && notes.startsWith("[CONCERN] ")) {
        notes = notes.slice("[CONCERN] ".length);
      }

      setForm({
        sleep_quality: todayData.sleep_quality ?? 5,
        stress_level: todayData.stress_level ?? 5,
        nutrition_quality: todayData.nutrition_quality ?? 5,
        physical_readiness: todayData.physical_readiness ?? 5,
        mental_clarity: todayData.mental_clarity ?? 5,
        notes,
        flag_concern: hasConcern,
      });
      setPrefilled(true);
    }
  }, [todayData, prefilled]);

  const handleSlider = (field: keyof CheckInFormState) => (value: number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    submitMutation.mutate({
      sleep_quality: form.sleep_quality,
      stress_level: form.stress_level,
      nutrition_quality: form.nutrition_quality,
      physical_readiness: form.physical_readiness,
      mental_clarity: form.mental_clarity,
      notes: form.notes || undefined,
      flag_concern: form.flag_concern || undefined,
    });
  };

  const readiness = calculateReadiness(form);
  const isUpdate = !!todayData;

  return (
    <Box>
      <Title order={2} mb="md">
        Daily Check-In
      </Title>
      <Text c="dimmed" mb="xl">
        Quick wellness check -- takes under 60 seconds.
      </Text>

      {/* Readiness circle */}
      <Paper p={{ base: "sm", md: "md" }} radius="md" withBorder mb="xl">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Box>
            <Text size="lg" fw={700}>
              Today&apos;s Readiness
            </Text>
            <Text size="sm" c="dimmed">
              Based on your current ratings
            </Text>
          </Box>
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: readinessColor(readiness),
              color: "#fff",
            }}
          >
            <Text size="xl" fw={700}>
              {readiness}
            </Text>
          </Box>
        </Group>
      </Paper>

      {/* 5 sliders in compact 2-column layout */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="xl">
        <Box>
          <Text fw={500} size="sm" mb={4}>
            Sleep Quality
          </Text>
          <Slider
            value={form.sleep_quality}
            onChange={handleSlider("sleep_quality")}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: "Poor" },
              { value: 5, label: "OK" },
              { value: 10, label: "Great" },
            ]}
            thumbSize={26}
            mb="lg"
          />
        </Box>

        <Box>
          <Text fw={500} size="sm" mb={4}>
            Stress Level
          </Text>
          <Slider
            value={form.stress_level}
            onChange={handleSlider("stress_level")}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: "Low" },
              { value: 5, label: "Mid" },
              { value: 10, label: "High" },
            ]}
            color="orange"
            thumbSize={26}
            mb="lg"
          />
        </Box>

        <Box>
          <Text fw={500} size="sm" mb={4}>
            Nutrition Quality
          </Text>
          <Slider
            value={form.nutrition_quality}
            onChange={handleSlider("nutrition_quality")}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: "Poor" },
              { value: 5, label: "OK" },
              { value: 10, label: "Great" },
            ]}
            thumbSize={26}
            mb="lg"
          />
        </Box>

        <Box>
          <Text fw={500} size="sm" mb={4}>
            Physical Readiness
          </Text>
          <Slider
            value={form.physical_readiness}
            onChange={handleSlider("physical_readiness")}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: "Low" },
              { value: 5, label: "OK" },
              { value: 10, label: "High" },
            ]}
            thumbSize={26}
            mb="lg"
          />
        </Box>

        <Box style={{ gridColumn: "1 / -1" }}>
          <Text fw={500} size="sm" mb={4}>
            Mental Clarity
          </Text>
          <Slider
            value={form.mental_clarity}
            onChange={handleSlider("mental_clarity")}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: "Foggy" },
              { value: 5, label: "OK" },
              { value: 10, label: "Sharp" },
            ]}
            thumbSize={26}
            mb="lg"
          />
        </Box>
      </SimpleGrid>

      {/* Concern checkbox + notes */}
      <Checkbox
        label="Flag injury or concern for coach"
        checked={form.flag_concern}
        onChange={(e) => setForm((prev) => ({ ...prev, flag_concern: e.currentTarget.checked }))}
        mb="md"
      />

      <Textarea
        placeholder="Additional notes (optional)"
        value={form.notes}
        onChange={(e) => setForm((prev) => ({ ...prev, notes: e.currentTarget.value }))}
        minRows={2}
        mb="xl"
      />

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        loading={submitMutation.isPending || loadingToday}
        variant="filled"
        color="blue"
        leftSection={<IconFlame size={20} />}
        fullWidth
      >
        {isUpdate ? "Update Check-In" : "Submit Check-In"}
      </Button>
    </Box>
  );
};

export default DailyCheckIn;
