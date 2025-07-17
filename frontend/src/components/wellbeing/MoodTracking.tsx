"use client";

import {
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { Calendar } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  IconMoodCry,
  IconMoodHappy,
  IconMoodNeutral,
  IconMoodSad,
  IconMoodSmile,
  IconPlus,
} from "@tabler/icons-react";
import type React from "react";
import { useEffect, useState } from "react";

/**
 * Emotion option type
 */
interface EmotionOption {
  value: string;
  label: string;
}

/**
 * Mood entry from database
 */
interface MoodEntry {
  id: number;
  user_id: string;
  date: string;
  mood_score: number;
  energy_level: number;
  primary_emotion: string;
  secondary_emotion: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Current mood form state
 */
interface CurrentMood {
  mood_score: string;
  energy_level: string;
  primary_emotion: string;
  secondary_emotion: string;
  notes: string;
}

/**
 * MoodTracking component props
 */
interface MoodTrackingProps {
  userId: string;
}

/**
 * MoodTracking component allows athletes to track their daily mood and emotions
 * to help correlate mental state with performance and recovery metrics.
 */
const MoodTracking: React.FC<MoodTrackingProps> = ({ userId }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [moodData, setMoodData] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [opened, { open, close }] = useDisclosure(false);

  // Form state
  const [currentMood, setCurrentMood] = useState<CurrentMood>({
    mood_score: "3",
    energy_level: "3",
    primary_emotion: "",
    secondary_emotion: "",
    notes: "",
  });

  // Available emotion options
  const emotionOptions: EmotionOption[] = [
    { value: "happy", label: "Happy" },
    { value: "excited", label: "Excited" },
    { value: "content", label: "Content" },
    { value: "relaxed", label: "Relaxed" },
    { value: "grateful", label: "Grateful" },
    { value: "motivated", label: "Motivated" },
    { value: "focused", label: "Focused" },
    { value: "tired", label: "Tired" },
    { value: "stressed", label: "Stressed" },
    { value: "anxious", label: "Anxious" },
    { value: "frustrated", label: "Frustrated" },
    { value: "overwhelmed", label: "Overwhelmed" },
    { value: "angry", label: "Angry" },
    { value: "disappointed", label: "Disappointed" },
    { value: "sad", label: "Sad" },
    { value: "nervous", label: "Nervous" },
  ];

  // Fetch mood data for the current month
  useEffect(() => {
    const fetchMoodData = async () => {
      if (!userId) return;

      try {
        const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

        const { data, error } = await supabase
          .from("mood_entries")
          .select("*")
          .eq("user_id", userId)
          .gte("date", startOfMonth.toISOString().split("T")[0])
          .lte("date", endOfMonth.toISOString().split("T")[0]);

        if (error) {
          console.error("Error fetching mood data:", error);
          return;
        }

        setMoodData(data || []);
      } catch (error) {
        console.error("Error in mood data fetch:", error);
      }
    };

    fetchMoodData();
  }, [userId, selectedDate, supabase]);

  // Check if a mood entry exists for the selected date
  const getMoodEntryForDate = (date: Date): MoodEntry | undefined => {
    const dateString = date.toISOString().split("T")[0];
    return moodData.find((entry) => entry.date === dateString);
  };

  // Get mood icon based on score
  const getMoodIcon = (score: string): React.ReactNode => {
    const iconProps = { size: 24 };
    switch (score) {
      case "1":
        return <IconMoodCry {...iconProps} color={theme.colors.red[6]} />;
      case "2":
        return <IconMoodSad {...iconProps} color={theme.colors.orange[6]} />;
      case "3":
        return <IconMoodNeutral {...iconProps} color={theme.colors.yellow[6]} />;
      case "4":
        return <IconMoodSmile {...iconProps} color={theme.colors.lime[6]} />;
      case "5":
        return <IconMoodHappy {...iconProps} color={theme.colors.green[6]} />;
      default:
        return <IconMoodNeutral {...iconProps} color={theme.colors.gray[6]} />;
    }
  };

  // Handle form field changes
  const handleMoodChange = (value: string) =>
    setCurrentMood((prev) => ({ ...prev, mood_score: value }));
  const handleEnergyChange = (value: string) =>
    setCurrentMood((prev) => ({ ...prev, energy_level: value }));
  const handlePrimaryEmotionChange = (value: string) =>
    setCurrentMood((prev) => ({ ...prev, primary_emotion: value }));
  const handleSecondaryEmotionChange = (value: string) =>
    setCurrentMood((prev) => ({ ...prev, secondary_emotion: value }));
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setCurrentMood((prev) => ({ ...prev, notes: e.target.value }));

  // Open modal with existing data or reset form
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const existingEntry = getMoodEntryForDate(date);

    if (existingEntry) {
      setCurrentMood({
        mood_score: String(existingEntry.mood_score),
        energy_level: String(existingEntry.energy_level),
        primary_emotion: existingEntry.primary_emotion,
        secondary_emotion: existingEntry.secondary_emotion || "",
        notes: existingEntry.notes || "",
      });
    } else {
      setCurrentMood({
        mood_score: "3",
        energy_level: "3",
        primary_emotion: "",
        secondary_emotion: "",
        notes: "",
      });
    }

    open();
  };

  // Submit mood data
  const handleSubmit = async () => {
    if (!currentMood.primary_emotion) {
      showNotification({
        title: "Missing Information",
        message: "Please select at least a primary emotion",
        color: "orange",
      });
      return;
    }

    setLoading(true);

    try {
      const dateString = selectedDate.toISOString().split("T")[0];
      const existingEntry = getMoodEntryForDate(selectedDate);

      const moodEntry = {
        user_id: userId,
        date: dateString,
        mood_score: Number.parseInt(currentMood.mood_score),
        energy_level: Number.parseInt(currentMood.energy_level),
        primary_emotion: currentMood.primary_emotion,
        secondary_emotion: currentMood.secondary_emotion || null,
        notes: currentMood.notes || null,
      };

      let query;

      if (existingEntry) {
        // Update existing entry
        query = supabase.from("mood_entries").update(moodEntry).eq("id", existingEntry.id);
      } else {
        // Insert new entry
        query = supabase.from("mood_entries").insert(moodEntry);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      showNotification({
        title: "Success",
        message: "Mood entry saved successfully",
        color: "green",
      });

      // Refresh mood data
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const { data } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .lte("date", endOfMonth.toISOString().split("T")[0]);

      setMoodData(data || []);
      close();
    } catch (error) {
      console.error("Error saving mood entry:", error);
      showNotification({
        title: "Error",
        message: "Failed to save mood entry",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Custom day renderer for the calendar
  const renderDay = (date: Date): React.ReactNode => {
    const moodEntry = getMoodEntryForDate(date);

    if (!moodEntry) {
      return <div>{date.getDate()}</div>;
    }

    return (
      <Box style={{ position: "relative" }}>
        <div>{date.getDate()}</div>
        <Box
          style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)" }}
        >
          {getMoodIcon(String(moodEntry.mood_score))}
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Title order={2} mb="md">
        Mood Tracking
      </Title>
      <Text color="dimmed" mb="xl">
        Track your daily mood and energy levels to identify patterns and optimize your mental
        well-being.
      </Text>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        <Paper p="md" radius="md" withBorder>
          <Group justify="apart" mb="lg">
            <Text fw={600} size="lg">
              Monthly Mood Calendar
            </Text>
            <Button
              leftSection={<IconPlus size={16} />}
              size="sm"
              onClick={() => handleDateClick(new Date())}
            >
              Add Today's Mood
            </Button>
          </Group>

          <Calendar
            date={selectedDate}
            onDateChange={handleDateClick}
            size="lg"
            styles={{
              day: {
                height: 60,
              },
            }}
            style={{ width: "100%" }} // Use style prop instead of styles.calendarBase
            renderDay={renderDay}
          />
        </Paper>

        <Paper p="md" radius="md" withBorder style={{ height: "fit-content" }}>
          <Text fw={600} size="lg" mb="lg">
            Mood Insights
          </Text>

          {moodData.length > 0 ? (
            <Box>
              <SimpleGrid cols={2} spacing="xl" mb="xl">
                <Paper p="xs" radius="md" withBorder>
                  <Text ta="center" size="sm" color="dimmed">
                    Average Mood
                  </Text>
                  <Group justify="center" mt="xs">
                    {getMoodIcon(
                      String(
                        Math.round(
                          moodData.reduce((sum, entry) => sum + entry.mood_score, 0) /
                            moodData.length
                        )
                      )
                    )}
                    <Text fw={600} size="xl">
                      {(
                        moodData.reduce((sum, entry) => sum + entry.mood_score, 0) / moodData.length
                      ).toFixed(1)}
                    </Text>
                  </Group>
                </Paper>

                <Paper p="xs" radius="md" withBorder>
                  <Text ta="center" size="sm" color="dimmed">
                    Top Emotion
                  </Text>
                  <Text ta="center" fw={600} size="xl" mt="xs">
                    {(() => {
                      const emotions = moodData.map((entry) => entry.primary_emotion);
                      const emotionCounts = emotions.reduce<Record<string, number>>(
                        (acc, emotion) => {
                          acc[emotion] = (acc[emotion] || 0) + 1;
                          return acc;
                        },
                        {}
                      );
                      const topEmotion = Object.keys(emotionCounts).reduce((a, b) =>
                        emotionCounts[a] > emotionCounts[b] ? a : b
                      );
                      return topEmotion.charAt(0).toUpperCase() + topEmotion.slice(1);
                    })()}
                  </Text>
                </Paper>
              </SimpleGrid>

              <Text size="sm" color="dimmed">
                You've tracked your mood on {moodData.length} days this month. Consistent tracking
                helps identify patterns in your mental wellbeing and its impact on your performance.
              </Text>
            </Box>
          ) : (
            <Text color="dimmed" ta="center" py="xl">
              No mood data available for this month. Start tracking to see insights.
            </Text>
          )}
        </Paper>
      </SimpleGrid>

      {/* Mood entry modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={<Text fw={600}>Record Your Mood</Text>}
        size="lg"
      >
        <Box mb="xl">
          <Text fw={500} mb="xs">
            How are you feeling today?
          </Text>
          <Group justify="center" style={{ gap: "1rem" }} mb="md">
            <Button
              variant={currentMood.mood_score === "1" ? "filled" : "light"}
              color={currentMood.mood_score === "1" ? "red" : "gray"}
              onClick={() => handleMoodChange("1")}
              style={{ borderRadius: "50%", width: 60, height: 60, padding: 0 }}
            >
              <IconMoodCry size={32} />
            </Button>
            <Button
              variant={currentMood.mood_score === "2" ? "filled" : "light"}
              color={currentMood.mood_score === "2" ? "orange" : "gray"}
              onClick={() => handleMoodChange("2")}
              style={{ borderRadius: "50%", width: 60, height: 60, padding: 0 }}
            >
              <IconMoodSad size={32} />
            </Button>
            <Button
              variant={currentMood.mood_score === "3" ? "filled" : "light"}
              color={currentMood.mood_score === "3" ? "yellow" : "gray"}
              onClick={() => handleMoodChange("3")}
              style={{ borderRadius: "50%", width: 60, height: 60, padding: 0 }}
            >
              <IconMoodNeutral size={32} />
            </Button>
            <Button
              variant={currentMood.mood_score === "4" ? "filled" : "light"}
              color={currentMood.mood_score === "4" ? "lime" : "gray"}
              onClick={() => handleMoodChange("4")}
              style={{ borderRadius: "50%", width: 60, height: 60, padding: 0 }}
            >
              <IconMoodSmile size={32} />
            </Button>
            <Button
              variant={currentMood.mood_score === "5" ? "filled" : "light"}
              color={currentMood.mood_score === "5" ? "green" : "gray"}
              onClick={() => handleMoodChange("5")}
              style={{ borderRadius: "50%", width: 60, height: 60, padding: 0 }}
            >
              <IconMoodHappy size={32} />
            </Button>
          </Group>
        </Box>

        <Box mb="xl">
          <Text fw={500} mb="xs">
            Energy Level
          </Text>
          <Group justify="center" style={{ gap: "0.5rem" }} mb="md">
            {["1", "2", "3", "4", "5"].map((level) => (
              <Button
                key={level}
                variant={currentMood.energy_level === level ? "filled" : "light"}
                color={currentMood.energy_level === level ? "blue" : "gray"}
                onClick={() => handleEnergyChange(level)}
              >
                {level}
              </Button>
            ))}
          </Group>
          <Group justify="apart" px="md">
            <Text size="sm" color="dimmed">
              Low Energy
            </Text>
            <Text size="sm" color="dimmed">
              High Energy
            </Text>
          </Group>
        </Box>

        <SimpleGrid cols={{ base: 1, sm: 2 }} mb="md">
          <Select
            label="Primary Emotion"
            placeholder="Select emotion"
            data={emotionOptions}
            value={currentMood.primary_emotion}
            onChange={(value) => handlePrimaryEmotionChange(value || "")}
            required
            searchable
            clearable
          />
          <Select
            label="Secondary Emotion (Optional)"
            placeholder="Select emotion"
            data={emotionOptions.filter((option) => option.value !== currentMood.primary_emotion)}
            value={currentMood.secondary_emotion}
            onChange={(value) => handleSecondaryEmotionChange(value || "")}
            searchable
            clearable
            disabled={!currentMood.primary_emotion}
          />
        </SimpleGrid>

        <Textarea
          label="Notes (Optional)"
          placeholder="Add any details about your mood or factors affecting it"
          value={currentMood.notes}
          onChange={handleNotesChange}
          minRows={3}
          mb="xl"
        />

        <Group justify="right">
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!currentMood.primary_emotion}>
            Save Mood
          </Button>
        </Group>
      </Modal>
    </Box>
  );
};

export default MoodTracking;
