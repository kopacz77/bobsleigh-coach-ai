"use client";

import {
  Box,
  Button,
  Divider,
  Group,
  NumberInput,
  Paper,
  SimpleGrid,
  Slider,
  Text,
  Textarea,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import {
  IconBrain,
  IconHeartFilled,
  IconMoodNervous,
  IconSalad,
  IconZzz,
} from "@tabler/icons-react";
import type React from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * WellbeingAssessment props interface
 */
interface WellbeingAssessmentProps {
  userId: string;
  date?: Date;
}

/**
 * Assessment data interface
 */
interface AssessmentData {
  sleep_quality: number;
  stress_level: number;
  nutrition_quality: number;
  physical_readiness: number;
  mental_clarity: number;
  sleep_hours: number;
  body_weight: string;
  resting_hr: string;
  notes: string;
}

/**
 * WellbeingAssessment component allows athletes to track various wellbeing metrics
 * including sleep quality, stress levels, nutrition quality, physical readiness,
 * and mental clarity.
 */
const WellbeingAssessment = ({ userId }: { userId: string }) => {
  const theme = useMantineTheme();
  const [loading, setLoading] = useState<boolean>(false);

  // Assessment form state
  const [assessment, setAssessment] = useState<AssessmentData>({
    sleep_quality: 5,
    stress_level: 5,
    nutrition_quality: 5,
    physical_readiness: 5,
    mental_clarity: 5,
    sleep_hours: 7,
    body_weight: "",
    resting_hr: "",
    notes: "",
  });

  // Get current date
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchTodaysAssessment();
  }, []);

  const fetchTodaysAssessment = async () => {
    try {
      if (!userId) return;

      const dateString = date.toISOString().split("T")[0];

      const { data: wellbeingData, error: wellbeingError } = await supabase
        .from("wellbeing_assessments")
        .select("*")
        .eq("user_id", userId)
        .eq("date", dateString)
        .single();

      if (wellbeingError && wellbeingError.code !== "PGRST116") {
        // PGRST116 means no rows returned, which is fine
        console.error("Error fetching wellbeing data:", wellbeingError);
        return;
      }

      const { data: metricsData, error: metricsError } = await supabase
        .from("daily_metrics")
        .select("*")
        .eq("user_id", userId)
        .eq("date", dateString)
        .single();

      if (metricsError && metricsError.code !== "PGRST116") {
        console.error("Error fetching daily metrics:", metricsError);
      }

      // Update form if we found existing data
      if (wellbeingData) {
        setAssessment((prev) => ({
          ...prev,
          sleep_quality: wellbeingData.sleep_quality,
          stress_level: wellbeingData.stress_level,
          nutrition_quality: wellbeingData.nutrition_quality,
          physical_readiness: wellbeingData.physical_readiness,
          mental_clarity: wellbeingData.mental_clarity,
          notes: wellbeingData.notes || "",
        }));
      }

      if (metricsData?.metrics) {
        setAssessment((prev) => ({
          ...prev,
          sleep_hours: metricsData.metrics.sleep_hours || 7,
          body_weight: metricsData.metrics.body_weight?.toString() || "",
          resting_hr: metricsData.metrics.resting_heart_rate?.toString() || "",
        }));
      }
    } catch (error) {
      console.error("Error in wellbeing assessment fetch:", error);
    }
  };

  const handleSliderChange = (field: keyof AssessmentData) => (value: number) => {
    setAssessment((prev) => ({ ...prev, [field]: value }));
  };

  const handleSleepHoursChange = (value: string | number) => {
    setAssessment((prev) => ({
      ...prev,
      sleep_hours: typeof value === "string" ? Number.parseFloat(value) || 7 : value,
    }));
  };

  const handleBodyWeightChange = (value: string | number) => {
    setAssessment((prev) => ({ ...prev, body_weight: value.toString() }));
  };

  const handleRestingHRChange = (value: string | number) => {
    setAssessment((prev) => ({ ...prev, resting_hr: value.toString() }));
  };

  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAssessment((prev) => ({ ...prev, notes: event.target.value }));
  };

  const handleDateChange = (value: Date | null) => {
    if (value) {
      setDate(value);
      // Fetch assessment for new date
      fetchTodaysAssessment();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (!userId) throw new Error("User ID is required");

      const dateString = date.toISOString().split("T")[0];

      // Save wellbeing assessment
      const { error: wellbeingError } = await supabase.from("wellbeing_assessments").upsert({
        user_id: userId,
        date: dateString,
        sleep_quality: assessment.sleep_quality,
        stress_level: assessment.stress_level,
        nutrition_quality: assessment.nutrition_quality,
        physical_readiness: assessment.physical_readiness,
        mental_clarity: assessment.mental_clarity,
        notes: assessment.notes || null,
      });

      if (wellbeingError) throw wellbeingError;

      // Save metrics in daily_metrics if provided
      if (assessment.body_weight || assessment.resting_hr || assessment.sleep_hours) {
        const metrics: Record<string, number> = {};

        if (assessment.body_weight) metrics.body_weight = Number.parseFloat(assessment.body_weight);
        if (assessment.resting_hr)
          metrics.resting_heart_rate = Number.parseInt(assessment.resting_hr, 10);
        if (assessment.sleep_hours) metrics.sleep_hours = assessment.sleep_hours;

        const { error: metricsError } = await supabase.from("daily_metrics").upsert({
          user_id: userId,
          date: dateString,
          metrics,
        });

        if (metricsError) throw metricsError;
      }

      notifications.show({
        title: "Success",
        message: "Your wellbeing assessment has been saved",
        color: "green",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save wellbeing assessment";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine slider color based on value
  const getSliderColor = (value: number): string => {
    if (value <= 3) return theme.colors.red[6];
    if (value <= 6) return theme.colors.yellow[6];
    return theme.colors.green[6];
  };

  const getWellbeingScore = (): number => {
    const { sleep_quality, stress_level, nutrition_quality, physical_readiness, mental_clarity } =
      assessment;

    // Calculate average of all metrics (invert stress level since lower is better)
    return Math.round(
      (sleep_quality +
        (10 - stress_level) +
        nutrition_quality +
        physical_readiness +
        mental_clarity) /
        5
    );
  };

  return (
    <Box>
      <Title order={2} mb="md">
        Daily Wellbeing Assessment
      </Title>
      <Text c="dimmed" mb="xl">
        Rate your wellbeing metrics to help optimize your training and recovery. These metrics help
        our AI provide personalized recommendations for your training program.
      </Text>

      <DateInput
        label="Date"
        value={date}
        onChange={handleDateChange}
        maxDate={new Date()}
        mb="xl"
      />

      <Paper p="md" radius="md" withBorder mb="xl">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Box>
            <Text size="xl" fw={700}>
              Wellbeing Score
            </Text>
            <Text size="sm" c="dimmed" mb="md">
              Aggregate score based on all metrics
            </Text>
          </Box>
          <Box style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Box
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: getSliderColor(getWellbeingScore()),
                color: "#fff",
              }}
            >
              <Text size="xl" fw={700}>
                {getWellbeingScore()}
              </Text>
            </Box>
          </Box>
        </SimpleGrid>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Paper p="md" radius="md" withBorder>
          <Group mb="xs">
            <IconZzz size={24} color={theme.colors.blue[6]} />
            <Text fw={600}>Sleep Quality</Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            How well did you sleep last night?
          </Text>
          <Slider
            value={assessment.sleep_quality}
            onChange={handleSliderChange("sleep_quality")}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: "Poor" },
              { value: 5, label: "Average" },
              { value: 10, label: "Excellent" },
            ]}
            color={getSliderColor(assessment.sleep_quality)}
            mb="lg"
          />
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group mb="xs">
            <IconMoodNervous size={24} color={theme.colors.orange[6]} />
            <Text fw={600}>Stress Level</Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            How stressed do you feel today?
          </Text>
          <Slider
            value={assessment.stress_level}
            onChange={handleSliderChange("stress_level")}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: "Relaxed" },
              { value: 5, label: "Moderate" },
              { value: 10, label: "Extremely" },
            ]}
            // Inverted color scale for stress (lower is better)
            color={getSliderColor(11 - assessment.stress_level)}
            mb="lg"
          />
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group mb="xs">
            <IconSalad size={24} color={theme.colors.green[6]} />
            <Text fw={600}>Nutrition Quality</Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            How well have you been eating in the last 24 hours?
          </Text>
          <Slider
            value={assessment.nutrition_quality}
            onChange={handleSliderChange("nutrition_quality")}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: "Poor" },
              { value: 5, label: "Average" },
              { value: 10, label: "Excellent" },
            ]}
            color={getSliderColor(assessment.nutrition_quality)}
            mb="lg"
          />
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group mb="xs">
            <IconHeartFilled size={24} color={theme.colors.red[6]} />
            <Text fw={600}>Physical Readiness</Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            How physically ready do you feel for training?
          </Text>
          <Slider
            value={assessment.physical_readiness}
            onChange={handleSliderChange("physical_readiness")}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: "Fatigued" },
              { value: 5, label: "Average" },
              { value: 10, label: "Energized" },
            ]}
            color={getSliderColor(assessment.physical_readiness)}
            mb="lg"
          />
        </Paper>

        <Paper p="md" radius="md" withBorder style={{ gridColumn: "span 2" }}>
          <Group mb="xs">
            <IconBrain size={24} color={theme.colors.violet[6]} />
            <Text fw={600}>Mental Clarity</Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            How mentally sharp and focused do you feel today?
          </Text>
          <Slider
            value={assessment.mental_clarity}
            onChange={handleSliderChange("mental_clarity")}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: "Foggy" },
              { value: 5, label: "Average" },
              { value: 10, label: "Clear" },
            ]}
            color={getSliderColor(assessment.mental_clarity)}
            mb="lg"
          />
        </Paper>
      </SimpleGrid>

      <Divider label="Objective Metrics" labelPosition="center" my="xl" />

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <Paper p="md" radius="md" withBorder>
          <Text fw={600} mb="xs">
            Sleep Duration
          </Text>
          <NumberInput
            placeholder="Hours of sleep"
            value={assessment.sleep_hours}
            onChange={handleSleepHoursChange}
            min={0}
            max={24}
            step={0.5}
          />
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Text fw={600} mb="xs">
            Body Weight (kg)
          </Text>
          <NumberInput
            placeholder="Enter weight"
            value={assessment.body_weight ? Number.parseFloat(assessment.body_weight) : undefined}
            onChange={handleBodyWeightChange}
            min={30}
            max={150}
            step={0.1}
          />
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Text fw={600} mb="xs">
            Resting Heart Rate (bpm)
          </Text>
          <NumberInput
            placeholder="Enter HR"
            value={assessment.resting_hr ? Number.parseInt(assessment.resting_hr, 10) : undefined}
            onChange={handleRestingHRChange}
            min={30}
            max={200}
            step={1}
          />
        </Paper>
      </SimpleGrid>

      <Paper p="md" radius="md" withBorder mt="xl">
        <Text fw={600} mb="sm">
          Additional Notes
        </Text>
        <Textarea
          placeholder="Enter any additional notes about your wellbeing (e.g., injuries, illness, life stressors)"
          value={assessment.notes}
          onChange={handleNotesChange}
          minRows={3}
          mb="md"
        />

        <Group justify="right">
          <Button onClick={handleSubmit} loading={loading} variant="filled" color="blue">
            Save Assessment
          </Button>
        </Group>
      </Paper>
    </Box>
  );
};

export default WellbeingAssessment;
