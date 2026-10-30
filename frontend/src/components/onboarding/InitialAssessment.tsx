import {
  Box,
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Slider,
  Text,
  Textarea,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import {
  IconArrowRight,
  IconDeviceFloppy,
  IconHeartbeat,
  IconJumpRope,
  IconRun,
  IconTimeline,
  IconWeight,
} from "@tabler/icons-react";
import type React from "react";
import { useState } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";

/**
 * InitialAssessment component collects baseline performance metrics
 * from athletes specific to bobsleigh requirements
 */
const InitialAssessment = ({
  userId,
  onComplete,
}: {
  userId: string;
  onComplete?: (data: any) => void;
}) => {
  const theme = useMantineTheme();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const [loading, setLoading] = useState(false);

  // Assessment form state
  const [assessment, setAssessment] = useState({
    // Self-reported fitness levels
    fitnessLevel: "3",
    athleticExperience: "intermediate",
    weeklyTrainingHours: "",
    limitations: "",
    perceivedStrength: 50,
    perceivedSpeed: 50,
    perceivedEndurance: 50,
    perceivedPower: 50,

    // Bobsleigh-specific performance metrics
    sprintMetrics: {
      sprint30m: "",
      sprint60m: "",
      flyingStart: "",
    },
    strengthMetrics: {
      benchPress: "",
      squat: "",
      deadlift: "",
      powerClean: "",
      pullUps: "",
    },
    powerMetrics: {
      verticalJump: "",
      broadJump: "",
      medicineBallThrow: "",
    },
    bodyComposition: {
      weight: "",
      bodyFat: "",
    },
    additionalNotes: "",
  });

  // Handle number input changes
  const handleNumberChange = (field: string) => (value: string | number) => {
    setAssessment((prev) => ({ ...prev, [field]: value }));
  };

  // Handle text input changes
  const handleTextChange = (field: string) => (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAssessment((prev) => ({ ...prev, [field]: event.target.value }));
  };

  // Handle select changes
  const handleSelectChange = (field: string) => (value: string | null) => {
    setAssessment((prev) => ({ ...prev, [field]: value }));
  };

  // Handle slider changes
  const handleSliderChange = (field: string) => (value: number) => {
    setAssessment((prev) => ({ ...prev, [field]: value }));
  };

  // Handle sprint metrics changes
  const handleSprintChange = (field: string) => (value: string | number) => {
    setAssessment((prev) => ({
      ...prev,
      sprintMetrics: {
        ...prev.sprintMetrics,
        [field]: value,
      },
    }));
  };

  // Handle strength metrics changes
  const handleStrengthChange = (field: string) => (value: string | number) => {
    setAssessment((prev) => ({
      ...prev,
      strengthMetrics: {
        ...prev.strengthMetrics,
        [field]: value,
      },
    }));
  };

  // Handle power metrics changes
  const handlePowerChange = (field: string) => (value: string | number) => {
    setAssessment((prev) => ({
      ...prev,
      powerMetrics: {
        ...prev.powerMetrics,
        [field]: value,
      },
    }));
  };

  // Handle body composition changes
  const handleBodyChange = (field: string) => (value: string | number) => {
    setAssessment((prev) => ({
      ...prev,
      bodyComposition: {
        ...prev.bodyComposition,
        [field]: value,
      },
    }));
  };

  // Save assessment data
  const handleSaveAssessment = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // Prepare assessment data
      const assessmentData = {
        user_id: userId,
        fitness_level: assessment.fitnessLevel,
        athletic_experience: assessment.athleticExperience,
        weekly_training_hours: Number.parseFloat(assessment.weeklyTrainingHours) || null,
        limitations: assessment.limitations,
        perceived_strength: assessment.perceivedStrength,
        perceived_speed: assessment.perceivedSpeed,
        perceived_endurance: assessment.perceivedEndurance,
        perceived_power: assessment.perceivedPower,
        sprint_30m: Number.parseFloat(assessment.sprintMetrics.sprint30m) || null,
        sprint_60m: Number.parseFloat(assessment.sprintMetrics.sprint60m) || null,
        flying_start: Number.parseFloat(assessment.sprintMetrics.flyingStart) || null,
        bench_press_1rm: Number.parseFloat(assessment.strengthMetrics.benchPress) || null,
        squat_1rm: Number.parseFloat(assessment.strengthMetrics.squat) || null,
        deadlift_1rm: Number.parseFloat(assessment.strengthMetrics.deadlift) || null,
        power_clean: Number.parseFloat(assessment.strengthMetrics.powerClean) || null,
        pull_ups_max: Number.parseFloat(assessment.strengthMetrics.pullUps) || null,
        vertical_jump: Number.parseFloat(assessment.powerMetrics.verticalJump) || null,
        broad_jump: Number.parseFloat(assessment.powerMetrics.broadJump) || null,
        medicine_ball_throw: Number.parseFloat(assessment.powerMetrics.medicineBallThrow) || null,
        current_weight: Number.parseFloat(assessment.bodyComposition.weight) || null,
        current_body_fat: Number.parseFloat(assessment.bodyComposition.bodyFat) || null,
        additional_notes: assessment.additionalNotes,
        assessment_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      // Save to athlete_assessments table
      const { error } = await supabase.from("athlete_assessments").insert(assessmentData);

      if (error) {
        throw error;
      }

      showNotification({
        title: "Success",
        message: "Assessment data saved successfully",
        color: "green",
      });

      if (onComplete) {
        onComplete(assessmentData);
      }
    } catch (error) {
      console.error("Error saving assessment data:", error);
      showNotification({
        title: "Error",
        message: "Failed to save assessment data",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={2}>Initial Performance Assessment</Title>
        <Button
          leftSection={<IconArrowRight size={16} />}
          variant="subtle"
          onClick={() => {
            if (onComplete) onComplete({});
          }}
        >
          Skip for now
        </Button>
      </Group>

      <Text c="dimmed" mb="xl">
        Please provide your current performance metrics to establish a baseline for your training
        program. Fill in as many fields as you can - any unknown values can be measured during your
        first training session.
      </Text>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Group mb="md">
          <IconHeartbeat size={24} color={theme.colors.red[6]} />
          <Title order={3}>Current Fitness Level</Title>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="md">
          <Select
            label="Overall Fitness Level"
            placeholder="Select your current fitness level"
            data={[
              { value: "1", label: "Beginner - Just starting out" },
              { value: "2", label: "Novice - Some training experience" },
              { value: "3", label: "Intermediate - Regular training" },
              { value: "4", label: "Advanced - Consistent athlete" },
              { value: "5", label: "Elite - Competitive athlete" },
            ]}
            value={assessment.fitnessLevel}
            onChange={handleSelectChange("fitnessLevel")}
          />

          <Select
            label="Athletic Experience Level"
            placeholder="Select your experience level"
            data={[
              { value: "beginner", label: "Beginner (0-1 years)" },
              { value: "intermediate", label: "Intermediate (2-4 years)" },
              { value: "advanced", label: "Advanced (5-9 years)" },
              { value: "elite", label: "Elite (10+ years)" },
            ]}
            value={assessment.athleticExperience}
            onChange={handleSelectChange("athleticExperience")}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="md">
          <NumberInput
            label="Weekly Training Hours (Current)"
            placeholder="Hours per week"
            value={assessment.weeklyTrainingHours}
            onChange={handleNumberChange("weeklyTrainingHours")}
            min={0}
            max={50}
            decimalScale={1}
          />

          <Textarea
            label="Current Limitations or Injuries"
            placeholder="Any current injuries or physical limitations?"
            value={assessment.limitations}
            onChange={handleTextChange("limitations")}
          />
        </SimpleGrid>
      </Paper>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Group mb="md">
          <IconRun size={24} color={theme.colors.blue[6]} />
          <Title order={3}>Sprint Metrics</Title>
        </Group>

        <Text size="sm" c="dimmed" mb="lg">
          Sprinting ability is crucial for bobsleigh push starts. Please enter your best times if
          known.
        </Text>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="md">
          <NumberInput
            label="30m Sprint (seconds)"
            placeholder="Enter time"
            value={assessment.sprintMetrics.sprint30m}
            onChange={handleSprintChange("sprint30m")}
            decimalScale={2}
            min={3}
            max={10}
            step={0.01}
          />

          <NumberInput
            label="60m Sprint (seconds)"
            placeholder="Enter time"
            value={assessment.sprintMetrics.sprint60m}
            onChange={handleSprintChange("sprint60m")}
            decimalScale={2}
            min={6}
            max={15}
            step={0.01}
          />

          <NumberInput
            label="30m Flying Start (seconds)"
            placeholder="Enter time"
            value={assessment.sprintMetrics.flyingStart}
            onChange={handleSprintChange("flyingStart")}
            decimalScale={2}
            min={2}
            max={8}
            step={0.01}
          />
        </SimpleGrid>

        <Text size="sm" mb="xs">
          Perceived Sprint Speed
        </Text>
        <Text size="xs" c="dimmed" mb="xs">
          How would you rate your sprinting speed compared to other bobsleigh athletes?
        </Text>
        <Slider
          value={assessment.perceivedSpeed}
          onChange={handleSliderChange("perceivedSpeed")}
          marks={[
            { value: 0, label: "Needs Work" },
            { value: 50, label: "Average" },
            { value: 100, label: "Excellent" },
          ]}
          mb="lg"
        />
      </Paper>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Group mb="md">
          <IconWeight size={24} color={theme.colors.orange[6]} />
          <Title order={3}>Strength Metrics</Title>
        </Group>

        <Text size="sm" c="dimmed" mb="lg">
          Strength is essential for bobsleigh starts. Enter your current 1RM (one-rep max) for each
          lift.
        </Text>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="md">
          <NumberInput
            label="Bench Press 1RM (kg)"
            placeholder="Enter weight"
            value={assessment.strengthMetrics.benchPress}
            onChange={handleStrengthChange("benchPress")}
            min={20}
            max={300}
          />

          <NumberInput
            label="Back Squat 1RM (kg)"
            placeholder="Enter weight"
            value={assessment.strengthMetrics.squat}
            onChange={handleStrengthChange("squat")}
            min={20}
            max={350}
          />

          <NumberInput
            label="Deadlift 1RM (kg)"
            placeholder="Enter weight"
            value={assessment.strengthMetrics.deadlift}
            onChange={handleStrengthChange("deadlift")}
            min={20}
            max={400}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="md">
          <NumberInput
            label="Power Clean 1RM (kg)"
            placeholder="Enter weight"
            value={assessment.strengthMetrics.powerClean}
            onChange={handleStrengthChange("powerClean")}
            min={20}
            max={200}
          />

          <NumberInput
            label="Pull-Ups (Max Reps)"
            placeholder="Enter reps"
            value={assessment.strengthMetrics.pullUps}
            onChange={handleStrengthChange("pullUps")}
            min={0}
            max={50}
            decimalScale={0}
          />
        </SimpleGrid>

        <Text size="sm" mb="xs">
          Perceived Strength Level
        </Text>
        <Text size="xs" c="dimmed" mb="xs">
          How would you rate your overall strength compared to other bobsleigh athletes?
        </Text>
        <Slider
          value={assessment.perceivedStrength}
          onChange={handleSliderChange("perceivedStrength")}
          marks={[
            { value: 0, label: "Needs Work" },
            { value: 50, label: "Average" },
            { value: 100, label: "Excellent" },
          ]}
          mb="lg"
        />
      </Paper>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Group mb="md">
          <IconJumpRope size={24} color={theme.colors.green[6]} />
          <Title order={3}>Power Metrics</Title>
        </Group>

        <Text size="sm" c="dimmed" mb="lg">
          Explosive power is critical for bobsleigh performance. Enter your best results if known.
        </Text>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="md">
          <NumberInput
            label="Vertical Jump (cm)"
            placeholder="Enter height"
            value={assessment.powerMetrics.verticalJump}
            onChange={handlePowerChange("verticalJump")}
            min={10}
            max={120}
            decimalScale={1}
          />

          <NumberInput
            label="Broad Jump (cm)"
            placeholder="Enter distance"
            value={assessment.powerMetrics.broadJump}
            onChange={handlePowerChange("broadJump")}
            min={100}
            max={400}
            decimalScale={1}
          />

          <NumberInput
            label="Medicine Ball Throw (m)"
            placeholder="Enter distance"
            value={assessment.powerMetrics.medicineBallThrow}
            onChange={handlePowerChange("medicineBallThrow")}
            min={1}
            max={30}
            decimalScale={1}
          />
        </SimpleGrid>

        <Text size="sm" mb="xs">
          Perceived Power/Explosiveness
        </Text>
        <Text size="xs" c="dimmed" mb="xs">
          How would you rate your explosive power compared to other bobsleigh athletes?
        </Text>
        <Slider
          value={assessment.perceivedPower}
          onChange={handleSliderChange("perceivedPower")}
          marks={[
            { value: 0, label: "Needs Work" },
            { value: 50, label: "Average" },
            { value: 100, label: "Excellent" },
          ]}
          mb="lg"
        />
      </Paper>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Group mb="md">
          <IconTimeline size={24} color={theme.colors.violet[6]} />
          <Title order={3}>Body Composition & Additional Information</Title>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="md">
          <NumberInput
            label="Current Weight (kg)"
            placeholder="Enter weight"
            value={assessment.bodyComposition.weight}
            onChange={handleBodyChange("weight")}
            min={40}
            max={150}
            decimalScale={1}
          />

          <NumberInput
            label="Current Body Fat (%)"
            placeholder="Enter percentage"
            value={assessment.bodyComposition.bodyFat}
            onChange={handleBodyChange("bodyFat")}
            min={3}
            max={30}
            decimalScale={1}
          />
        </SimpleGrid>

        <Text size="sm" mb="xs">
          Perceived Endurance
        </Text>
        <Text size="xs" c="dimmed" mb="xs">
          How would you rate your endurance and conditioning?
        </Text>
        <Slider
          value={assessment.perceivedEndurance}
          onChange={handleSliderChange("perceivedEndurance")}
          marks={[
            { value: 0, label: "Needs Work" },
            { value: 50, label: "Average" },
            { value: 100, label: "Excellent" },
          ]}
          mb="lg"
        />

        <Textarea
          label="Additional Notes"
          placeholder="Any other information about your current physical condition, abilities, or limitations?"
          value={assessment.additionalNotes}
          onChange={handleTextChange("additionalNotes")}
          minRows={3}
        />
      </Paper>

      <Group justify="flex-end" mt="xl">
        <Button
          onClick={handleSaveAssessment}
          leftSection={<IconDeviceFloppy size={16} />}
          loading={loading}
          size="lg"
          color="green"
        >
          Save Assessment
        </Button>
      </Group>
    </Box>
  );
};

export default InitialAssessment;
