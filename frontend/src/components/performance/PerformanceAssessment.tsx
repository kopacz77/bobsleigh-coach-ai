"use client";

import {
  Badge,
  Box,
  Button,
  Divider,
  Group,
  List,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Slider,
  Text,
  Textarea,
  ThemeIcon,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { showNotification } from "@mantine/notifications";
import {
  IconArrowRight,
  IconBulb,
  IconClockHour4,
  IconDeviceAnalytics,
  IconJumpRope,
  IconRun, // Using IconRun instead of the missing IconRunning
  IconTrendingDown,
  IconTrendingUp,
  IconWeight,
} from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSupabase } from "@/providers/SupabaseProvider";

/**
 * Test Category Option
 */
interface TestCategoryOption {
  value: string;
  label: string;
}

/**
 * Test Type Option
 */
interface TestTypeOption {
  value: string;
  label: string;
  unit: string;
  target: "higher" | "lower";
}

/**
 * Performance Assessment Data
 */
interface Assessment {
  id: number;
  user_id: string;
  date: string;
  test_category: string;
  test_name: string;
  value: number;
  measurement_unit: string;
  conditions: string | null;
  rating: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Assessment Form State
 */
interface AssessmentForm {
  date: Date;
  test_category: string;
  test_name: string;
  value: string | number;
  measurement_unit: string;
  conditions: string;
  rating: number;
  notes: string;
}

/**
 * Comparison State
 */
interface ComparisonState {
  previousValue: number | null;
  percentChange: string | null;
  direction: "better" | "worse" | "same" | null;
  targetDirection?: "higher" | "lower";
}

/**
 * Enhanced Assessment with Target Info
 */
interface EnhancedAssessment extends Assessment {
  targetDirection?: "higher" | "lower";
  progressPercentage: number | null;
}

/**
 * Best & Worst Tests
 */
interface BestWorstTests {
  best: EnhancedAssessment | null;
  worst: EnhancedAssessment | null;
}

/**
 * Chart Data Point
 */
interface ChartDataPoint {
  date: string;
  value: number;
}

/**
 * Chart Data by Test
 */
type ChartData = Record<string, ChartDataPoint[]>;

/**
 * Test Types By Category
 */
type TestTypesByCategory = Record<string, TestTypeOption[]>;

/**
 * Target Values
 */
type TargetValues = Record<string, number>;

/**
 * Component Props
 */
interface PerformanceAssessmentProps {
  userId: string;
}

/**
 * PerformanceAssessment component for tracking and evaluating athlete's
 * performance metrics like sprint times, jump heights, strength tests, etc.
 */
const PerformanceAssessment: React.FC<PerformanceAssessmentProps> = ({ userId }) => {
  const theme = useMantineTheme();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const [loading, setLoading] = useState<boolean>(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [testCategories, setTestCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [targetValues, setTargetValues] = useState<TargetValues>({});
  const [comparison, setComparison] = useState<ComparisonState>({
    previousValue: null,
    percentChange: null,
    direction: null,
  });

  // Form state
  const [assessment, setAssessment] = useState<AssessmentForm>({
    date: new Date(),
    test_category: "",
    test_name: "",
    value: "",
    measurement_unit: "",
    conditions: "",
    rating: 5,
    notes: "",
  });

  // Common test categories for bobsleigh athletes
  const bobsleighTestCategories: TestCategoryOption[] = [
    { value: "sprint", label: "Sprint Tests" },
    { value: "strength", label: "Strength Tests" },
    { value: "power", label: "Power Tests" },
    { value: "endurance", label: "Endurance Tests" },
    { value: "technique", label: "Technique Assessments" },
  ];

  // Common test types by category
  const testTypesByCategory: TestTypesByCategory = {
    sprint: [
      { value: "30m_sprint", label: "30m Sprint", unit: "seconds", target: "lower" },
      { value: "60m_sprint", label: "60m Sprint", unit: "seconds", target: "lower" },
      { value: "100m_sprint", label: "100m Sprint", unit: "seconds", target: "lower" },
      { value: "flying_30m", label: "Flying 30m", unit: "seconds", target: "lower" },
      { value: "push_start_time", label: "Push Start Time", unit: "seconds", target: "lower" },
    ],
    strength: [
      { value: "back_squat_1rm", label: "Back Squat 1RM", unit: "kg", target: "higher" },
      { value: "deadlift_1rm", label: "Deadlift 1RM", unit: "kg", target: "higher" },
      { value: "bench_press_1rm", label: "Bench Press 1RM", unit: "kg", target: "higher" },
      { value: "power_clean_1rm", label: "Power Clean 1RM", unit: "kg", target: "higher" },
      { value: "pull_ups_max", label: "Pull-ups (Max Reps)", unit: "reps", target: "higher" },
    ],
    power: [
      { value: "vertical_jump", label: "Vertical Jump", unit: "cm", target: "higher" },
      { value: "broad_jump", label: "Broad Jump", unit: "cm", target: "higher" },
      { value: "med_ball_throw", label: "Medicine Ball Throw", unit: "m", target: "higher" },
      {
        value: "power_clean_80pct",
        label: "Power Clean @ 80% (Power)",
        unit: "watts",
        target: "higher",
      },
      { value: "jump_squat", label: "Jump Squat Power", unit: "watts", target: "higher" },
    ],
    endurance: [
      { value: "beep_test", label: "Beep Test", unit: "level", target: "higher" },
      { value: "400m_time", label: "400m Run", unit: "seconds", target: "lower" },
      { value: "1000m_time", label: "1000m Run", unit: "seconds", target: "lower" },
      { value: "5min_push_test", label: "5min Push Test (Distance)", unit: "m", target: "higher" },
      { value: "lactate_threshold", label: "Lactate Threshold", unit: "watts", target: "higher" },
    ],
    technique: [
      {
        value: "push_technique_score",
        label: "Push Technique Score",
        unit: "points",
        target: "higher",
      },
      {
        value: "loading_efficiency",
        label: "Loading Efficiency",
        unit: "points",
        target: "higher",
      },
      {
        value: "driving_line_accuracy",
        label: "Driving Line Accuracy",
        unit: "points",
        target: "higher",
      },
      {
        value: "turn_execution",
        label: "Turn Execution Quality",
        unit: "points",
        target: "higher",
      },
      {
        value: "start_coordination",
        label: "Start Coordination",
        unit: "points",
        target: "higher",
      },
    ],
  };

  // Fetch assessments for the selected category
  useEffect(() => {
    const fetchAssessments = async () => {
      if (!userId || !selectedCategory || !supabase) return;

      try {
        const query = supabase
          .from("performance_assessments")
          .select("*")
          .eq("user_id", userId)
          .eq("test_category", selectedCategory)
          .order("date", { ascending: false });

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching performance assessments:", error);
          return;
        }

        setAssessments(data || []);
      } catch (error) {
        console.error("Error in performance assessments fetch:", error);
      }
    };

    fetchAssessments();
  }, [userId, selectedCategory, supabase]);

  // Fetch test categories for the user
  useEffect(() => {
    const fetchTestCategories = async () => {
      if (!userId) return;
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from("performance_assessments")
          .select("test_category")
          .eq("user_id", userId)
          .order("test_category");

        if (error) {
          console.error("Error fetching test categories:", error);
          return;
        }

        // Fix for Set iteration issue in TypeScript
        const categoriesSet = new Set<string>();
        data.forEach((item) => {
          categoriesSet.add(item.test_category);
        });
        const uniqueCategories = Array.from(categoriesSet);

        setTestCategories(uniqueCategories);

        // If we have categories but none selected, select the first one
        if (uniqueCategories.length > 0 && !selectedCategory) {
          setSelectedCategory(uniqueCategories[0]);
        }
      } catch (error) {
        console.error("Error in test categories fetch:", error);
      }
    };

    fetchTestCategories();
  }, [userId, supabase, selectedCategory]);

  // Fetch target values for the selected category
  useEffect(() => {
    const fetchTargetValues = async () => {
      if (!userId || !selectedCategory || !supabase) return;

      try {
        const { data, error } = await supabase
          .from("performance_targets")
          .select("*")
          .eq("user_id", userId)
          .eq("category", selectedCategory);

        if (error) {
          console.error("Error fetching target values:", error);
          return;
        }

        // Convert to an object keyed by test_name
        const targets: TargetValues = {};
        if (data) {
          data.forEach((target) => {
            targets[target.test_name] = target.target_value;
          });
        }

        setTargetValues(targets);
      } catch (error) {
        console.error("Error in target values fetch:", error);
      }
    };

    fetchTargetValues();
  }, [userId, selectedCategory, supabase]);

  // Handle form field changes
  const handleDateChange = (value: Date | null) => {
    if (value) {
      setAssessment((prev) => ({ ...prev, date: value }));
    }
  };

  const handleCategoryChange = (value: string | null) => {
    if (value) {
      setAssessment((prev) => ({
        ...prev,
        test_category: value,
        test_name: "",
        measurement_unit: "",
      }));
    }
  };

  const handleTestNameChange = (value: string | null) => {
    if (!value) return;

    const selectedTest = testTypesByCategory[assessment.test_category]?.find(
      (test) => test.value === value
    );

    setAssessment((prev) => ({
      ...prev,
      test_name: value,
      measurement_unit: selectedTest?.unit || "",
    }));

    // Look for previous result for comparison
    if (assessments.length > 0) {
      const previousAssessment = assessments.find((a) => a.test_name === value);

      if (previousAssessment) {
        const previousValue = previousAssessment.value;
        const targetDirection = selectedTest?.target;

        // Don't calculate yet since we don't have a new value
        setComparison({
          previousValue,
          percentChange: null,
          direction: null,
          targetDirection,
        });
      } else {
        setComparison({
          previousValue: null,
          percentChange: null,
          direction: null,
        });
      }
    }
  };

  const handleValueChange = (value: string | number) => {
    setAssessment((prev) => ({ ...prev, value }));

    // Update comparison if we have a previous value
    if (comparison.previousValue !== null && value) {
      const numValue = Number.parseFloat(value.toString());
      const prevValue = Number.parseFloat(comparison.previousValue.toString());
      const percentChange = (((numValue - prevValue) / prevValue) * 100).toFixed(2);

      // Determine if this change is good or bad based on target direction
      let direction: "better" | "worse" | "same";
      if (comparison.targetDirection === "lower") {
        // For lower targets (like sprint times), negative change is good
        direction = numValue < prevValue ? "better" : numValue > prevValue ? "worse" : "same";
      } else {
        // For higher targets (like strength), positive change is good
        direction = numValue > prevValue ? "better" : numValue < prevValue ? "worse" : "same";
      }

      setComparison((prev) => ({
        ...prev,
        percentChange,
        direction,
      }));
    }
  };

  const handleConditionsChange = (value: string | null) => {
    setAssessment((prev) => ({ ...prev, conditions: value || "" }));
  };

  const handleRatingChange = (value: number) => {
    setAssessment((prev) => ({ ...prev, rating: value }));
  };

  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAssessment((prev) => ({ ...prev, notes: event.target.value }));
  };

  // Submit assessment
  const handleSubmit = async () => {
    if (!assessment.test_category || !assessment.test_name || !assessment.value) {
      showNotification({
        title: "Missing Information",
        message: "Please fill in all required fields",
        color: "orange",
      });
      return;
    }

    if (!supabase) return;
    setLoading(true);

    try {
      const assessmentData = {
        user_id: userId,
        date: assessment.date.toISOString().split("T")[0],
        test_category: assessment.test_category,
        test_name: assessment.test_name,
        value: Number.parseFloat(assessment.value.toString()),
        measurement_unit: assessment.measurement_unit,
        conditions: assessment.conditions || null,
        rating: assessment.rating,
        notes: assessment.notes || null,
      };

      const { error } = await supabase.from("performance_assessments").insert(assessmentData);

      if (error) {
        throw error;
      }

      showNotification({
        title: "Success",
        message: "Performance assessment saved successfully",
        color: "green",
      });

      // Refresh assessments
      const { data } = await supabase
        .from("performance_assessments")
        .select("*")
        .eq("user_id", userId)
        .eq("test_category", selectedCategory)
        .order("date", { ascending: false });

      setAssessments(data || []);

      // Reset form
      setAssessment({
        date: new Date(),
        test_category: assessment.test_category,
        test_name: "",
        value: "",
        measurement_unit: "",
        conditions: "",
        rating: 5,
        notes: "",
      });

      // Reset comparison
      setComparison({
        previousValue: null,
        percentChange: null,
        direction: null,
      });
    } catch (error) {
      console.error("Error saving performance assessment:", error);
      showNotification({
        title: "Error",
        message: "Failed to save performance assessment",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get category icon
  const getCategoryIcon = (category: string): React.ReactNode => {
    switch (category) {
      case "sprint":
        return <IconRun size={20} color={theme.colors.blue[6]} />;
      case "strength":
        return <IconWeight size={20} color={theme.colors.red[6]} />;
      case "power":
        return <IconJumpRope size={20} color={theme.colors.green[6]} />;
      case "endurance":
        return <IconClockHour4 size={20} color={theme.colors.orange[6]} />;
      case "technique":
        return <IconDeviceAnalytics size={20} color={theme.colors.violet[6]} />;
      default:
        return <IconDeviceAnalytics size={20} color={theme.colors.gray[6]} />;
    }
  };

  // Prepare chart data
  const prepareChartData = (): Record<string, ChartDataPoint[]> => {
    if (!assessments.length) return {};

    // Group by test_name
    const groupedData: Record<string, ChartDataPoint[]> = {};

    assessments.forEach((assessment) => {
      if (!groupedData[assessment.test_name]) {
        groupedData[assessment.test_name] = [];
      }

      groupedData[assessment.test_name].push({
        date: assessment.date,
        value: assessment.value,
      });
    });

    // For chart, we need one array per test, sorted by date
    const chartData: Record<string, ChartDataPoint[]> = {};

    Object.entries(groupedData).forEach(([testName, data]) => {
      chartData[testName] = data.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });

    return chartData;
  };

  // Find the best and worst tests based on recent assessments
  const findBestAndWorstTests = (): BestWorstTests => {
    if (!assessments.length) return { best: null, worst: null };

    // Group by test_name and get the latest assessment for each
    const latestByTest: Record<string, Assessment> = {};
    assessments.forEach((assessment) => {
      if (
        !latestByTest[assessment.test_name] ||
        new Date(assessment.date) > new Date(latestByTest[assessment.test_name].date)
      ) {
        latestByTest[assessment.test_name] = assessment;
      }
    });

    // Get corresponding tests with target information
    const testsWithTargets: EnhancedAssessment[] = Object.values(latestByTest).map((assessment) => {
      const testInfo = testTypesByCategory[assessment.test_category]?.find(
        (test) => test.value === assessment.test_name
      );

      // Calculate progress percentage if we have a target
      let progressPercentage = null;
      if (targetValues[assessment.test_name]) {
        const target = Number.parseFloat(targetValues[assessment.test_name].toString());
        const current = Number.parseFloat(assessment.value.toString());

        if (testInfo?.target === "lower") {
          // For lower targets (like sprint times), calculate how close we are
          // If current value is already better than target, we're over 100%
          progressPercentage = current <= target ? 100 : (1 - (current - target) / target) * 100;
        } else {
          // For higher targets (like strength), calculate progress towards target
          progressPercentage = current >= target ? 100 : (current / target) * 100;
        }
      }

      return {
        ...assessment,
        targetDirection: testInfo?.target,
        progressPercentage,
      };
    });

    // Sort based on target direction and progress percentage
    const sortedTests = [...testsWithTargets].sort((a, b) => {
      // If we have progress percentages for both, compare them
      if (a.progressPercentage !== null && b.progressPercentage !== null) {
        return b.progressPercentage - a.progressPercentage;
      }

      // Otherwise sort by rating
      return b.rating - a.rating;
    });

    return {
      best: sortedTests.length > 0 ? sortedTests[0] : null,
      worst: sortedTests.length > 1 ? sortedTests[sortedTests.length - 1] : null,
    };
  };

  const { best, worst } = findBestAndWorstTests();

  // Format improvement text
  const getImprovementText = (test: EnhancedAssessment | null): string | null => {
    if (!test || test.progressPercentage === null) return null;

    if (test.progressPercentage >= 100) {
      return "Target achieved!";
    }

    return `${Math.round(test.progressPercentage)}% of target`;
  };

  return (
    <Box>
      <Title order={2} mb="md">
        Performance Assessment
      </Title>
      <Text c="dimmed" mb="xl">
        Track and analyze your performance metrics to measure progress and identify areas for
        improvement.
      </Text>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        <Box>
          <Paper p="md" radius="md" withBorder mb="xl">
            <Text fw={600} size="lg" mb="lg">
              Record New Assessment
            </Text>

            <DatePickerInput
              label="Date"
              placeholder="Select date"
              value={assessment.date}
              onChange={handleDateChange}
              maxDate={new Date()}
              clearable={false}
              mb="md"
              required
            />

            <Select
              label="Test Category"
              placeholder="Select test category"
              data={bobsleighTestCategories}
              value={assessment.test_category}
              onChange={handleCategoryChange}
              mb="md"
              required
            />

            {assessment.test_category && (
              <Select
                label="Test Name"
                placeholder="Select specific test"
                data={testTypesByCategory[assessment.test_category] || []}
                value={assessment.test_name}
                onChange={handleTestNameChange}
                mb="md"
                required
              />
            )}

            {assessment.test_name && (
              <>
                <Group grow mb="md">
                  <NumberInput
                    label={`Value (${assessment.measurement_unit})`}
                    placeholder="Enter result"
                    value={
                      typeof assessment.value === "string"
                        ? Number.parseFloat(assessment.value) || undefined
                        : assessment.value
                    }
                    onChange={handleValueChange}
                    // Remove precision prop as it's not supported in current Mantine version
                    required
                  />

                  <Select
                    label="Conditions"
                    placeholder="Select conditions"
                    data={[
                      { value: "optimal", label: "Optimal" },
                      { value: "good", label: "Good" },
                      { value: "average", label: "Average" },
                      { value: "challenging", label: "Challenging" },
                      { value: "poor", label: "Poor" },
                    ]}
                    value={assessment.conditions}
                    onChange={handleConditionsChange}
                  />
                </Group>

                {comparison.previousValue && (
                  <Paper p="xs" radius="md" withBorder mb="md">
                    <Group>
                      <Text size="sm">
                        Previous: {comparison.previousValue} {assessment.measurement_unit}
                      </Text>
                      {comparison.percentChange && (
                        <>
                          <IconArrowRight size={16} />
                          <Text
                            size="sm"
                            fw={500}
                            color={
                              comparison.direction === "better"
                                ? "green"
                                : comparison.direction === "worse"
                                  ? "red"
                                  : "gray"
                            }
                          >
                            {Number.parseFloat(comparison.percentChange) > 0 ? "+" : ""}
                            {comparison.percentChange}%
                            {comparison.direction === "better" && " (Improved)"}
                            {comparison.direction === "worse" && " (Declined)"}
                          </Text>
                        </>
                      )}
                    </Group>
                  </Paper>
                )}

                <Box mb="md">
                  <Text fw={500} size="sm" mb="xs">
                    Overall Rating
                  </Text>
                  <Slider
                    value={assessment.rating}
                    onChange={handleRatingChange}
                    min={1}
                    max={10}
                    step={1}
                    marks={[
                      { value: 1, label: "Poor" },
                      { value: 5, label: "Average" },
                      { value: 10, label: "Excellent" },
                    ]}
                    color={
                      assessment.rating <= 3 ? "red" : assessment.rating <= 6 ? "yellow" : "green"
                    }
                  />
                </Box>

                <Textarea
                  label="Notes"
                  placeholder="Add any additional notes about this test (e.g., technique issues, how you felt)"
                  value={assessment.notes}
                  onChange={handleNotesChange}
                  minRows={3}
                  mb="xl"
                />

                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={!assessment.test_category || !assessment.test_name || !assessment.value}
                  mb="md"
                >
                  Save Assessment
                </Button>
              </>
            )}
          </Paper>

          {(best || worst) && (
            <Paper p="md" radius="md" withBorder>
              <Text fw={600} size="lg" mb="lg">
                Performance Highlights
              </Text>

              {best && (
                <Box mb="md">
                  <Group mb="xs">
                    <ThemeIcon color="green" size={24} radius="xl">
                      <IconTrendingUp size={16} />
                    </ThemeIcon>
                    <Text fw={500}>Strongest Area</Text>
                  </Group>
                  <Paper p="sm" radius="md" withBorder>
                    <Group justify="apart" mb="xs">
                      <Text fw={500}>
                        {testTypesByCategory[best.test_category]?.find(
                          (t) => t.value === best.test_name
                        )?.label || best.test_name}
                      </Text>
                      <Badge color="green">
                        {best.value} {best.measurement_unit}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {formatDate(best.date)}
                    </Text>
                    {getImprovementText(best) && (
                      <Text size="sm" fw={500} color="green" mt="xs">
                        {getImprovementText(best)}
                      </Text>
                    )}
                  </Paper>
                </Box>
              )}

              {worst && (
                <Box>
                  <Group mb="xs">
                    <ThemeIcon color="orange" size={24} radius="xl">
                      <IconTrendingDown size={16} />
                    </ThemeIcon>
                    <Text fw={500}>Focus Area</Text>
                  </Group>
                  <Paper p="sm" radius="md" withBorder>
                    <Group justify="apart" mb="xs">
                      <Text fw={500}>
                        {testTypesByCategory[worst.test_category]?.find(
                          (t) => t.value === worst.test_name
                        )?.label || worst.test_name}
                      </Text>
                      <Badge color="orange">
                        {worst.value} {worst.measurement_unit}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {formatDate(worst.date)}
                    </Text>
                    {getImprovementText(worst) && (
                      <Text size="sm" fw={500} color="orange" mt="xs">
                        {getImprovementText(worst)}
                      </Text>
                    )}
                  </Paper>
                </Box>
              )}
            </Paper>
          )}
        </Box>

        <Box>
          <Paper p="md" radius="md" withBorder mb="xl">
            <Group justify="apart" mb="md">
              <Text fw={600} size="lg">
                Assessment History
              </Text>

              <Select
                placeholder="Select category"
                data={[
                  ...bobsleighTestCategories,
                  ...testCategories
                    .filter((cat) => !bobsleighTestCategories.some((c) => c.value === cat))
                    .map((cat) => ({
                      value: cat,
                      label: cat.charAt(0).toUpperCase() + cat.slice(1),
                    })),
                ]}
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value || "")}
                style={{ width: 200 }}
              />
            </Group>

            {selectedCategory && assessments.length > 0 ? (
              <Box>
                <Box mb="xl">
                  <Text fw={500} mb="sm">
                    {getCategoryIcon(selectedCategory)}
                    <span style={{ marginLeft: 8 }}>
                      {bobsleighTestCategories.find((c) => c.value === selectedCategory)?.label ||
                        selectedCategory}
                    </span>
                  </Text>

                  <Text size="sm" c="dimmed" mb="md">
                    {assessments.length} assessments recorded
                  </Text>

                  <Divider mb="md" />

                  <List spacing="md">
                    {assessments.slice(0, 5).map((item) => {
                      const testInfo = testTypesByCategory[item.test_category]?.find(
                        (test) => test.value === item.test_name
                      );

                      return (
                        <List.Item
                          key={item.id}
                          icon={
                            <ThemeIcon
                              color={
                                item.rating <= 3 ? "red" : item.rating <= 6 ? "yellow" : "green"
                              }
                              size={24}
                              radius="xl"
                            >
                              {item.rating}
                            </ThemeIcon>
                          }
                        >
                          <Group justify="apart">
                            <Box>
                              <Text fw={500}>
                                {testInfo?.label || item.test_name}: {item.value}{" "}
                                {item.measurement_unit}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {formatDate(item.date)}
                              </Text>
                            </Box>
                          </Group>
                        </List.Item>
                      );
                    })}
                  </List>
                </Box>

                <Divider mb="md" />

                <Text fw={500} mb="md">
                  Performance Trends
                </Text>

                {Object.entries(prepareChartData()).length > 0 && (
                  <Box style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis
                          dataKey="date"
                          type="category"
                          tick={{ fontSize: 12 }}
                          allowDuplicatedCategory={false}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />

                        {Object.entries(prepareChartData()).map(([testName, data], index) => {
                          const testInfo = testTypesByCategory[selectedCategory]?.find(
                            (test) => test.value === testName
                          );

                          const colorKeys = Object.keys(theme.colors);
                          const colorIndex = index % colorKeys.length;
                          const color = theme.colors[colorKeys[colorIndex]][6];

                          // Add reference line for target if available
                          const targetValue = targetValues[testName];

                          return (
                            <React.Fragment key={testName}>
                              <Line
                                data={data}
                                dataKey="value"
                                name={testInfo?.label || testName}
                                stroke={color}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                              />

                              {targetValue && (
                                <ReferenceLine
                                  y={targetValue}
                                  stroke="green"
                                  strokeDasharray="3 3"
                                  label={{
                                    value: `Target: ${targetValue}`,
                                    fill: "green",
                                    fontSize: 12,
                                  }}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Box>
            ) : (
              <Box py="xl" style={{ textAlign: "center" }}>
                <IconBulb size={40} color={theme.colors.gray[5]} style={{ marginBottom: 10 }} />
                <Text size="lg" fw={500} mb="xs">
                  No performance data yet
                </Text>
                <Text c="dimmed" mb="md">
                  Select a test category and add your first assessment to start tracking
                  performance.
                </Text>
              </Box>
            )}
          </Paper>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default PerformanceAssessment;
