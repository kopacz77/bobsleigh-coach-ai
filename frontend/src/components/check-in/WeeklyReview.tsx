import {
  Badge,
  Box,
  Button,
  Group,
  MantineColor,
  MultiSelect,
  Paper,
  Progress,
  rem,
  Select,
  SimpleGrid,
  Slider,
  Tabs,
  Text,
  Textarea,
  ThemeIcon,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { DatePicker, DatePickerInput, type DateValue } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useSupabase } from '@/providers/SupabaseProvider';
import {
  IconArrowRight,
  IconCalendarStats,
  IconCaretRight,
  IconChartBar,
  IconEqual,
  IconMedal,
  IconNotes,
  IconRun,
  IconTarget,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WeeklyReviewProps {
  userId: string;
}

interface ReviewFormState {
  week_start: Date;
  overall_performance: number;
  achievements: string;
  challenges: string;
  technique_progress: number;
  physical_progress: number;
  mental_progress: number;
  goal_progress: string[];
  next_week_goals: string;
  coach_feedback: string;
  focus_areas: string[];
  key_learnings: string;
}

interface FocusArea {
  value: string;
  label: string;
}

interface DailyCheckIn {
  date: string;
  user_id: string;
  sleep_quality: number;
  fatigue_level: number;
  muscle_soreness: number;
  mental_readiness: number;
  nutrition_quality: number;
  hydration_level: number;
  [key: string]: any; // For any additional properties
}

interface WeeklyReviewData extends Omit<ReviewFormState, "week_start"> {
  id?: number;
  user_id: string;
  week_start: string; // ISO date string in DB
  created_at?: string;
  updated_at?: string;
}

interface ChartDataPoint {
  date: string;
  readiness: number | null;
  fatigue: number | null;
  soreness: number | null;
  mental: number | null;
}

interface Averages {
  sleep_quality: string;
  fatigue_level: string;
  muscle_soreness: string;
  mental_readiness: string;
  nutrition_quality: string;
  hydration_level: string;
  avg_readiness: string;
  readiness_scores: number[];
}

/**
 * WeeklyReview component for athletes to assess their weekly performance,
 * set goals for the upcoming week, and review progress
 */
const WeeklyReview: React.FC<WeeklyReviewProps> = ({ userId }) => {
  const theme = useMantineTheme();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const [loading, setLoading] = useState<boolean>(false);
  const [weekData, setWeekData] = useState<DailyCheckIn[]>([]);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(getStartOfWeek(new Date()));
  const [savedReview, setSavedReview] = useState<WeeklyReviewData | null>(null);

  // Review form state
  const [review, setReview] = useState<ReviewFormState>({
    week_start: getStartOfWeek(new Date()),
    overall_performance: 5,
    achievements: "",
    challenges: "",
    technique_progress: 5,
    physical_progress: 5,
    mental_progress: 5,
    goal_progress: [],
    next_week_goals: "",
    coach_feedback: "",
    focus_areas: [],
    key_learnings: "",
  });

  // Bobsleigh-specific focus areas
  const focusAreas: FocusArea[] = [
    { value: "push_technique", label: "Push Technique" },
    { value: "start_speed", label: "Start Speed" },
    { value: "driving_line", label: "Driving Line" },
    { value: "entry_exit", label: "Entry/Exit Technique" },
    { value: "loading", label: "Loading Technique" },
    { value: "team_coordination", label: "Team Coordination" },
    { value: "strength", label: "Strength Training" },
    { value: "power", label: "Power Development" },
    { value: "sprint_mechanics", label: "Sprint Mechanics" },
    { value: "recovery", label: "Recovery Strategies" },
    { value: "mental_focus", label: "Mental Focus" },
    { value: "race_strategy", label: "Race Strategy" },
  ];

  // Helper function to get the start of a week (Sunday) from a date
  function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  // Helper function to format date for display
  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // Generate array of dates for the selected week
  function getWeekDates(startDate: Date): Date[] {
    const dates: Date[] = [];
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  // Fetch existing review data for the selected week
  useEffect(() => {
    const fetchReview = async () => {
      if (!supabase) return;
      try {
        const weekStartString = selectedWeekStart.toISOString().split("T")[0];

        const { data, error } = await supabase
          .from("weekly_reviews")
          .select("*")
          .eq("user_id", userId)
          .eq("week_start", weekStartString)
          .single();

        if (error && error.code !== "PGRST116") {
          // Code for no rows returned
          console.error("Error fetching weekly review:", error);
          return;
        }

        if (data) {
          setSavedReview(data);
          setReview({
            week_start: new Date(data.week_start),
            overall_performance: data.overall_performance,
            achievements: data.achievements || "",
            challenges: data.challenges || "",
            technique_progress: data.technique_progress,
            physical_progress: data.physical_progress,
            mental_progress: data.mental_progress,
            goal_progress: data.goal_progress || [],
            next_week_goals: data.next_week_goals || "",
            coach_feedback: data.coach_feedback || "",
            focus_areas: data.focus_areas || [],
            key_learnings: data.key_learnings || "",
          });
        } else {
          // Reset form for new week
          setReview({
            week_start: selectedWeekStart,
            overall_performance: 5,
            achievements: "",
            challenges: "",
            technique_progress: 5,
            physical_progress: 5,
            mental_progress: 5,
            goal_progress: [],
            next_week_goals: "",
            coach_feedback: "",
            focus_areas: [],
            key_learnings: "",
          });
          setSavedReview(null);
        }
      } catch (error) {
        console.error("Error in weekly review fetch:", error);
      }
    };

    // Fetch daily check-in data for the week
    const fetchWeekData = async () => {
      if (!supabase) return;
      try {
        const weekDates = getWeekDates(selectedWeekStart);
        const startDate = weekDates[0].toISOString().split("T")[0];
        const endDate = weekDates[6].toISOString().split("T")[0];

        const { data, error } = await supabase
          .from("daily_checkins")
          .select("*")
          .eq("user_id", userId)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date");

        if (error) {
          console.error("Error fetching week data:", error);
          return;
        }

        setWeekData(data || []);
      } catch (error) {
        console.error("Error in week data fetch:", error);
      }
    };

    if (userId) {
      fetchReview();
      fetchWeekData();
    }
  }, [userId, selectedWeekStart, supabase]);

  // Handle week selection change
  const handleWeekChange = (date: DateValue) => {
    if (date) {
      setSelectedWeekStart(getStartOfWeek(date));
    }
  };

  // Handle text input changes
  const handleTextChange =
    (field: keyof ReviewFormState) => (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setReview((prev) => ({ ...prev, [field]: event.target.value }));
    };

  // Handle slider changes
  const handleSliderChange = (field: keyof ReviewFormState) => (value: number) => {
    setReview((prev) => ({ ...prev, [field]: value }));
  };

  // Handle focus areas selection
  const handleFocusAreasChange = (values: string[]) => {
    setReview((prev) => ({ ...prev, focus_areas: values }));
  };

  // Submit review
  const handleSubmit = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      const reviewData: Omit<WeeklyReviewData, "id" | "created_at" | "updated_at"> = {
        user_id: userId,
        week_start: review.week_start.toISOString().split("T")[0],
        overall_performance: review.overall_performance,
        achievements: review.achievements,
        challenges: review.challenges,
        technique_progress: review.technique_progress,
        physical_progress: review.physical_progress,
        mental_progress: review.mental_progress,
        goal_progress: review.goal_progress,
        next_week_goals: review.next_week_goals,
        coach_feedback: review.coach_feedback,
        focus_areas: review.focus_areas,
        key_learnings: review.key_learnings,
      };

      let query;

      if (savedReview) {
        // Update existing review
        query = supabase.from("weekly_reviews").update(reviewData).eq("id", savedReview.id);
      } else {
        // Insert new review
        query = supabase.from("weekly_reviews").insert(reviewData);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      notifications.show({
        title: "Success",
        message: "Weekly review saved successfully",
        color: "green",
      });

      // Refresh data
      const { data } = await supabase
        .from("weekly_reviews")
        .select("*")
        .eq("user_id", userId)
        .eq("week_start", reviewData.week_start)
        .single();

      if (data) {
        setSavedReview(data);
      }
    } catch (error) {
      console.error("Error saving weekly review:", error);
      notifications.show({
        title: "Error",
        message: "Failed to save weekly review",
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

  // Calculate averages from daily check-ins
  const calculateAverages = (): Averages | null => {
    if (!weekData.length) return null;

    const metrics = {
      sleep_quality: 0,
      fatigue_level: 0,
      muscle_soreness: 0,
      mental_readiness: 0,
      nutrition_quality: 0,
      hydration_level: 0,
      readiness_scores: [] as number[],
    };

    weekData.forEach((day) => {
      metrics.sleep_quality += day.sleep_quality || 0;
      metrics.fatigue_level += day.fatigue_level || 0;
      metrics.muscle_soreness += day.muscle_soreness || 0;
      metrics.mental_readiness += day.mental_readiness || 0;
      metrics.nutrition_quality += day.nutrition_quality || 0;
      metrics.hydration_level += day.hydration_level || 0;

      // Calculate readiness score for each day
      const readinessScore = Math.round(
        (day.sleep_quality * 1.2 +
          (11 - day.fatigue_level) * 1.2 +
          (11 - day.muscle_soreness) * 1.0 +
          day.mental_readiness * 1.5 +
          day.nutrition_quality * 0.7 +
          day.hydration_level * 0.7) /
          6.3
      );

      metrics.readiness_scores.push(readinessScore);
    });

    // Calculate averages
    const count = weekData.length;
    return {
      sleep_quality: (metrics.sleep_quality / count).toFixed(1),
      fatigue_level: (metrics.fatigue_level / count).toFixed(1),
      muscle_soreness: (metrics.muscle_soreness / count).toFixed(1),
      mental_readiness: (metrics.mental_readiness / count).toFixed(1),
      nutrition_quality: (metrics.nutrition_quality / count).toFixed(1),
      hydration_level: (metrics.hydration_level / count).toFixed(1),
      avg_readiness: (metrics.readiness_scores.reduce((a, b) => a + b, 0) / count).toFixed(1),
      readiness_scores: metrics.readiness_scores,
    };
  };

  // Prepare chart data for weekly metrics
  const prepareChartData = (): ChartDataPoint[] => {
    if (!weekData.length) return [];

    const weekDates = getWeekDates(selectedWeekStart);
    const formattedDates = weekDates.map((date) => formatDate(date));

    // Prepare data with all dates, filled with null values initially
    const chartData: ChartDataPoint[] = formattedDates.map((date) => ({
      date,
      readiness: null,
      fatigue: null,
      soreness: null,
      mental: null,
    }));

    // Fill in actual values from week data
    weekData.forEach((day) => {
      const dayIndex = weekDates.findIndex((date) => date.toISOString().split("T")[0] === day.date);

      if (dayIndex !== -1) {
        // Calculate readiness score
        const readinessScore = Math.round(
          (day.sleep_quality * 1.2 +
            (11 - day.fatigue_level) * 1.2 +
            (11 - day.muscle_soreness) * 1.0 +
            day.mental_readiness * 1.5 +
            day.nutrition_quality * 0.7 +
            day.hydration_level * 0.7) /
            6.3
        );

        chartData[dayIndex] = {
          ...chartData[dayIndex],
          readiness: readinessScore,
          fatigue: day.fatigue_level,
          soreness: day.muscle_soreness,
          mental: day.mental_readiness,
        };
      }
    });

    return chartData;
  };

  const averages = calculateAverages();
  const chartData = prepareChartData();

  return (
    <Box>
      <Title order={2} mb="md">
        Weekly Performance Review
      </Title>
      <Text c="dimmed" mb="xl">
        Review your past week's performance, set goals for the upcoming week, and track your
        progress. This helps identify patterns and improve your training program.
      </Text>

      <Group justify="space-between" mb="xl">
        <Group>
          <IconCalendarStats size={24} color={theme.colors.blue[6]} />
          <Title order={3}>
            Week of {formatDate(selectedWeekStart)} -{" "}
            {formatDate(getWeekDates(selectedWeekStart)[6])}
          </Title>
        </Group>

        <DatePicker
          value={selectedWeekStart}
          onChange={handleWeekChange}
          firstDayOfWeek={0}
          maxDate={new Date()}
          hideOutsideDates
          w={300}
        />
      </Group>

      <Tabs defaultValue="summary">
        <Tabs.List mb="md">
          <Tabs.Tab value="summary" leftSection={<IconChartBar size={14} />}>
            Weekly Summary
          </Tabs.Tab>
          <Tabs.Tab value="goals" leftSection={<IconTarget size={14} />}>
            Goals & Progress
          </Tabs.Tab>
          <Tabs.Tab value="notes" leftSection={<IconNotes size={14} />}>
            Reflections
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="summary">
          {weekData.length > 0 ? (
            <>
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
                <Paper p="md" radius="md" withBorder>
                  <Text fw={600} size="lg" mb="md">
                    Weekly Readiness Trend
                  </Text>

                  <Box style={{ height: 270 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="readiness"
                          name="Readiness Score"
                          stroke={theme.colors.blue[6]}
                          strokeWidth={2}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Text fw={600} size="lg" mb="md">
                    Weekly Metrics
                  </Text>

                  <Box style={{ height: 270 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="fatigue"
                          name="Fatigue"
                          stroke={theme.colors.red[6]}
                          strokeWidth={2}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="soreness"
                          name="Soreness"
                          stroke={theme.colors.orange[6]}
                          strokeWidth={2}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="mental"
                          name="Mental Readiness"
                          stroke={theme.colors.violet[6]}
                          strokeWidth={2}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="xl">
                <Paper p="md" radius="md" withBorder>
                  <Text ta="center" size="sm" c="dimmed" mb="xs">
                    Average Readiness
                  </Text>
                  <Text
                    ta="center"
                    fw={700}
                    size="xl"
                    mb="xs"
                    c={getSliderColor(Number.parseFloat(averages!.avg_readiness))}
                  >
                    {averages!.avg_readiness}/10
                  </Text>

                  <Progress
                    value={(Number.parseFloat(averages!.avg_readiness) / 10) * 100}
                    color={getSliderColor(Number.parseFloat(averages!.avg_readiness))}
                    size="md"
                    radius="xl"
                  />
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Text ta="center" size="sm" c="dimmed" mb="xs">
                    Sleep Quality
                  </Text>
                  <Text
                    ta="center"
                    fw={700}
                    size="xl"
                    mb="xs"
                    c={getSliderColor(Number.parseFloat(averages!.sleep_quality))}
                  >
                    {averages!.sleep_quality}/10
                  </Text>

                  <Progress
                    value={(Number.parseFloat(averages!.sleep_quality) / 10) * 100}
                    color={getSliderColor(Number.parseFloat(averages!.sleep_quality))}
                    size="md"
                    radius="xl"
                  />
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Text ta="center" size="sm" c="dimmed" mb="xs">
                    Mental Readiness
                  </Text>
                  <Text
                    ta="center"
                    fw={700}
                    size="xl"
                    mb="xs"
                    c={getSliderColor(Number.parseFloat(averages!.mental_readiness))}
                  >
                    {averages!.mental_readiness}/10
                  </Text>

                  <Progress
                    value={(Number.parseFloat(averages!.mental_readiness) / 10) * 100}
                    color={getSliderColor(Number.parseFloat(averages!.mental_readiness))}
                    size="md"
                    radius="xl"
                  />
                </Paper>
              </SimpleGrid>
            </>
          ) : (
            <Paper p="xl" radius="md" withBorder>
              <Text ta="center" size="lg" fw={500} mb="md">
                No check-in data available for this week
              </Text>
              <Text ta="center" c="dimmed">
                Complete your daily check-ins to see your weekly metrics and trends
              </Text>
            </Paper>
          )}

          <Paper p="md" radius="md" withBorder mb="xl">
            <Text fw={600} size="lg" mb="md">
              Overall Performance Rating
            </Text>
            <Text size="sm" c="dimmed" mb="md">
              How would you rate your overall performance this week?
            </Text>

            <Slider
              value={review.overall_performance}
              onChange={handleSliderChange("overall_performance")}
              min={1}
              max={10}
              step={1}
              marks={[
                { value: 1, label: "Poor" },
                { value: 5, label: "Average" },
                { value: 10, label: "Excellent" },
              ]}
              color={getSliderColor(review.overall_performance)}
              mb="lg"
              labelAlwaysOn
            />
          </Paper>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="xl">
            <Paper p="md" radius="md" withBorder>
              <Group mb="xs">
                <IconRun size={20} color={theme.colors.green[6]} />
                <Text fw={600}>Technique Progress</Text>
              </Group>

              <Slider
                value={review.technique_progress}
                onChange={handleSliderChange("technique_progress")}
                min={1}
                max={10}
                step={1}
                color={getSliderColor(review.technique_progress)}
                mb="lg"
              />
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group mb="xs">
                <IconMedal size={20} color={theme.colors.blue[6]} />
                <Text fw={600}>Physical Progress</Text>
              </Group>

              <Slider
                value={review.physical_progress}
                onChange={handleSliderChange("physical_progress")}
                min={1}
                max={10}
                step={1}
                color={getSliderColor(review.physical_progress)}
                mb="lg"
              />
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group mb="xs">
                <IconTarget size={20} color={theme.colors.violet[6]} />
                <Text fw={600}>Mental Progress</Text>
              </Group>

              <Slider
                value={review.mental_progress}
                onChange={handleSliderChange("mental_progress")}
                min={1}
                max={10}
                step={1}
                color={getSliderColor(review.mental_progress)}
                mb="lg"
              />
            </Paper>
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="goals">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
            <Paper p="md" radius="md" withBorder>
              <Group mb="md">
                <IconMedal size={24} color={theme.colors.yellow[6]} />
                <Text fw={600} size="lg">
                  Key Achievements
                </Text>
              </Group>

              <Textarea
                placeholder="What were your biggest achievements or wins this week?"
                value={review.achievements}
                onChange={handleTextChange("achievements")}
                minRows={5}
                mb="md"
              />
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group mb="md">
                <IconTrendingDown size={24} color={theme.colors.red[6]} />
                <Text fw={600} size="lg">
                  Challenges Faced
                </Text>
              </Group>

              <Textarea
                placeholder="What challenges or setbacks did you encounter?"
                value={review.challenges}
                onChange={handleTextChange("challenges")}
                minRows={5}
                mb="md"
              />
            </Paper>
          </SimpleGrid>

          <Paper p="md" radius="md" withBorder mb="xl">
            <Group mb="md">
              <IconTarget size={24} color={theme.colors.blue[6]} />
              <Text fw={600} size="lg">
                Focus Areas for Next Week
              </Text>
            </Group>

            <MultiSelect
              data={focusAreas}
              value={review.focus_areas}
              onChange={handleFocusAreasChange}
              placeholder="Select areas to focus on"
              mb="lg"
            />

            <Text fw={500} mb="md">
              Next Week's Goals
            </Text>
            <Textarea
              placeholder="What specific goals do you want to achieve next week?"
              value={review.next_week_goals}
              onChange={handleTextChange("next_week_goals")}
              minRows={4}
              mb="md"
            />
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="notes">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
            <Paper p="md" radius="md" withBorder>
              <Group mb="md">
                <IconCaretRight size={24} color={theme.colors.green[6]} />
                <Text fw={600} size="lg">
                  Key Learnings
                </Text>
              </Group>

              <Textarea
                placeholder="What important lessons or insights did you gain this week?"
                value={review.key_learnings}
                onChange={handleTextChange("key_learnings")}
                minRows={6}
                mb="md"
              />
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group mb="md">
                <IconNotes size={24} color={theme.colors.orange[6]} />
                <Text fw={600} size="lg">
                  Coach Feedback
                </Text>
              </Group>

              <Text size="sm" c="dimmed" mb="md">
                Feedback from your coach will appear here.
              </Text>

              <Textarea
                value={review.coach_feedback}
                onChange={handleTextChange("coach_feedback")}
                minRows={6}
                mb="md"
                disabled={true}
                placeholder="No coach feedback available yet"
              />
            </Paper>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      <Group justify="flex-end" mt="xl">
        <Button onClick={handleSubmit} loading={loading} size="lg" variant="filled" color="blue">
          {savedReview ? "Update Review" : "Save Weekly Review"}
        </Button>
      </Group>
    </Box>
  );
};

export default WeeklyReview;
