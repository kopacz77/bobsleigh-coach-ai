import {
  Box,
  Button,
  Chip,
  Divider,
  Group,
  MultiSelect,
  Paper,
  Radio,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  TextInput,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { showNotification } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  IconArrowRight,
  IconCalendarEvent,
  IconDeviceFloppy,
  IconTarget,
  IconTrophy,
} from "@tabler/icons-react";
import React, { useState } from "react";

/**
 * GoalSetting component allows athletes to define their seasonal and competition goals
 * specifically focused on bobsleigh performance metrics and events
 */
const GoalSetting = ({ userId, onComplete }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);

  // Goals form state
  const [goals, setGoals] = useState({
    seasonStart: new Date(),
    seasonEnd: new Date(new Date().setMonth(new Date().getMonth() + 8)),
    primaryFocus: "performance",
    primaryGoal: "",
    secondaryGoal: "",
    targetCompetitions: [],
    specificMetrics: {
      startTime: "",
      topSpeed: "",
      strengthMetric: "",
      weightMetric: "",
    },
    developmentAreas: [],
    shortTermGoal: "",
    midTermGoal: "",
    longTermGoal: "",
    timeframePreference: "season",
  });

  // Bobsleigh development areas
  const developmentAreas = [
    { value: "push_technique", label: "Push Technique" },
    { value: "start_speed", label: "Start Speed" },
    { value: "driving_line", label: "Driving Line" },
    { value: "loading", label: "Loading Technique" },
    { value: "technical_skills", label: "Technical Skills" },
    { value: "strength", label: "Strength" },
    { value: "power", label: "Power" },
    { value: "speed", label: "Speed" },
    { value: "team_coordination", label: "Team Coordination" },
  ];

  // Bobsleigh competitions
  const competitionOptions = [
    { value: "local", label: "Local Competitions" },
    { value: "national", label: "National Championships" },
    { value: "world_cup", label: "World Cup" },
    { value: "world_championships", label: "World Championships" },
    { value: "olympic_games", label: "Olympic Games" },
    { value: "north_american_cup", label: "North American Cup" },
    { value: "european_cup", label: "European Cup" },
    { value: "intercontinental_cup", label: "Intercontinental Cup" },
  ];

  // Focus areas
  const focusOptions = [
    { value: "performance", label: "Performance Improvement" },
    { value: "technique", label: "Technique Refinement" },
    { value: "competition", label: "Competition Results" },
    { value: "team", label: "Team Development" },
    { value: "strength", label: "Strength Building" },
    { value: "power", label: "Power Development" },
  ];

  // Handle text input changes
  const handleTextChange = (field) => (event) => {
    setGoals((prev) => ({ ...prev, [field]: event.target.value }));
  };

  // Handle select changes
  const handleSelectChange = (field) => (value) => {
    setGoals((prev) => ({ ...prev, [field]: value }));
  };

  // Handle specific metric changes
  const handleMetricChange = (field) => (event) => {
    setGoals((prev) => ({
      ...prev,
      specificMetrics: {
        ...prev.specificMetrics,
        [field]: event.target.value,
      },
    }));
  };

  // Save goals data
  const handleSaveGoals = async () => {
    setLoading(true);

    try {
      // Prepare goals data
      const goalsData = {
        user_id: userId,
        season_start: goals.seasonStart.toISOString().split("T")[0],
        season_end: goals.seasonEnd.toISOString().split("T")[0],
        primary_focus: goals.primaryFocus,
        primary_goal: goals.primaryGoal,
        secondary_goal: goals.secondaryGoal,
        target_competitions: goals.targetCompetitions,
        start_time_target: goals.specificMetrics.startTime || null,
        top_speed_target: goals.specificMetrics.topSpeed || null,
        strength_metric_target: goals.specificMetrics.strengthMetric || null,
        weight_metric_target: goals.specificMetrics.weightMetric || null,
        development_areas: goals.developmentAreas,
        short_term_goal: goals.shortTermGoal,
        mid_term_goal: goals.midTermGoal,
        long_term_goal: goals.longTermGoal,
        timeframe_preference: goals.timeframePreference,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to athlete_goals table
      const { error } = await supabase
        .from("athlete_goals")
        .upsert(goalsData, { onConflict: "user_id" });

      if (error) {
        throw error;
      }

      showNotification({
        title: "Success",
        message: "Goals saved successfully",
        color: "green",
      });

      if (onComplete) {
        onComplete(goalsData);
      }
    } catch (error) {
      console.error("Error saving goals:", error);
      showNotification({
        title: "Error",
        message: "Failed to save goals",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Group position="apart" mb="md">
        <Title order={2}>Goal Setting</Title>
        <Button
          leftIcon={<IconArrowRight size={16} />}
          variant="subtle"
          onClick={() => {
            if (onComplete) onComplete({});
          }}
        >
          Skip for now
        </Button>
      </Group>

      <Text color="dimmed" mb="xl">
        Define your goals to help structure your training program and track your progress
        effectively.
      </Text>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Group mb="md">
          <IconCalendarEvent size={24} color={theme.colors.blue[6]} />
          <Title order={3}>Season Timeline</Title>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="md">
          <DatePickerInput
            label="Season Start Date"
            placeholder="Select season start date"
            value={goals.seasonStart}
            onChange={handleSelectChange("seasonStart")}
          />

          <DatePickerInput
            label="Season End Date"
            placeholder="Select season end date"
            value={goals.seasonEnd}
            onChange={handleSelectChange("seasonEnd")}
            minDate={goals.seasonStart}
          />
        </SimpleGrid>

        <Select
          label="Timeframe Preference"
          placeholder="Select your preferred planning timeframe"
          data={[
            { value: "season", label: "Full Season Planning" },
            { value: "quarterly", label: "Quarterly Planning" },
            { value: "monthly", label: "Monthly Planning" },
            { value: "weekly", label: "Weekly Focus" },
          ]}
          value={goals.timeframePreference}
          onChange={handleSelectChange("timeframePreference")}
          mb="md"
        />

        <MultiSelect
          label="Target Competitions"
          placeholder="Select your target competitions for this season"
          data={competitionOptions}
          value={goals.targetCompetitions}
          onChange={handleSelectChange("targetCompetitions")}
        />
      </Paper>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Group mb="md">
          <IconTarget size={24} color={theme.colors.orange[6]} />
          <Title order={3}>Primary Focus & Goals</Title>
        </Group>

        <Select
          label="Primary Area of Focus"
          placeholder="Select your primary focus"
          data={focusOptions}
          value={goals.primaryFocus}
          onChange={handleSelectChange("primaryFocus")}
          mb="md"
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="md">
          <TextInput
            label="Primary Season Goal"
            placeholder="e.g., Qualify for National Team"
            value={goals.primaryGoal}
            onChange={handleTextChange("primaryGoal")}
          />

          <TextInput
            label="Secondary Season Goal"
            placeholder="e.g., Improve push start time by 0.2s"
            value={goals.secondaryGoal}
            onChange={handleTextChange("secondaryGoal")}
          />
        </SimpleGrid>

        <Text weight={500} mb="xs">
          Development Areas
        </Text>
        <Text size="sm" color="dimmed" mb="md">
          Select the key areas you want to focus on improving
        </Text>

        <MultiSelect
          placeholder="Select areas to develop"
          data={developmentAreas}
          value={goals.developmentAreas}
          onChange={handleSelectChange("developmentAreas")}
          mb="md"
        />
      </Paper>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Group mb="md">
          <IconTrophy size={24} color={theme.colors.green[6]} />
          <Title order={3}>Specific Performance Targets</Title>
        </Group>

        <Text size="sm" color="dimmed" mb="md">
          Set specific, measurable targets for your key performance metrics
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="md">
          <TextInput
            label="Push Start Time Target"
            placeholder="e.g., 5.10 seconds"
            value={goals.specificMetrics.startTime}
            onChange={handleMetricChange("startTime")}
          />

          <TextInput
            label="Top Speed Target"
            placeholder="e.g., 140 km/h"
            value={goals.specificMetrics.topSpeed}
            onChange={handleMetricChange("topSpeed")}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="md">
          <TextInput
            label="Strength Metric Target"
            placeholder="e.g., Squat 150kg"
            value={goals.specificMetrics.strengthMetric}
            onChange={handleMetricChange("strengthMetric")}
          />

          <TextInput
            label="Weight/Body Composition Target"
            placeholder="e.g., 90kg at 10% body fat"
            value={goals.specificMetrics.weightMetric}
            onChange={handleMetricChange("weightMetric")}
          />
        </SimpleGrid>
      </Paper>

      <Paper p="lg" radius="md" withBorder mb="xl">
        <Title order={3} mb="md">
          Goal Timeframes
        </Title>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          <Box>
            <Text weight={500} mb="xs">
              Short-Term Goal (1-3 months)
            </Text>
            <Textarea
              placeholder="What do you want to achieve in the next 1-3 months?"
              value={goals.shortTermGoal}
              onChange={handleTextChange("shortTermGoal")}
              minRows={4}
            />
          </Box>

          <Box>
            <Text weight={500} mb="xs">
              Mid-Term Goal (3-6 months)
            </Text>
            <Textarea
              placeholder="What do you want to achieve in the next 3-6 months?"
              value={goals.midTermGoal}
              onChange={handleTextChange("midTermGoal")}
              minRows={4}
            />
          </Box>

          <Box>
            <Text weight={500} mb="xs">
              Long-Term Goal (6-12+ months)
            </Text>
            <Textarea
              placeholder="What do you want to achieve in the next year or beyond?"
              value={goals.longTermGoal}
              onChange={handleTextChange("longTermGoal")}
              minRows={4}
            />
          </Box>
        </SimpleGrid>
      </Paper>

      <Group position="right" mt="xl">
        <Button
          onClick={handleSaveGoals}
          leftIcon={<IconDeviceFloppy size={16} />}
          loading={loading}
          size="lg"
          color="green"
        >
          Save Goals
        </Button>
      </Group>
    </Box>
  );
};

export default GoalSetting;
