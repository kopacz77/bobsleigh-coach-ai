"use client";

import {
  Badge,
  Card,
  Center,
  Grid,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { Calendar } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import {
  IconBarbell,
  IconMoodNervous,
  IconMoodSmile,
  IconSalad,
  IconZzz,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type WellbeingData = {
  id: string;
  date: string;
  sleep_quality: number;
  stress_level: number;
  nutrition_quality: number;
  physical_readiness: number;
  mental_clarity: number;
  notes: string;
  created_at: string;
};

export function WellbeingCalendar() {
  const [assessments, setAssessments] = useState<WellbeingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [_selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<WellbeingData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const theme = useMantineTheme();

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("wellbeing_assessments")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch wellbeing data";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate the average wellbeing score for a given assessment
  const calculateAvgScore = (assessment: WellbeingData) => {
    const scores = [
      assessment.sleep_quality,
      10 - assessment.stress_level, // Invert stress level
      assessment.nutrition_quality,
      assessment.physical_readiness,
      assessment.mental_clarity,
    ];
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  // Determine day color based on wellbeing score
  const getDayColor = (date: Date) => {
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    const dayAssessment = assessments.find((a) => a.date === dateStr);

    if (!dayAssessment) return "";

    const avgScore = calculateAvgScore(dayAssessment);

    if (avgScore >= 8) return theme.colors.green[4];
    if (avgScore >= 6) return theme.colors.teal[3];
    if (avgScore >= 4) return theme.colors.yellow[4];
    if (avgScore >= 2) return theme.colors.orange[4];
    return theme.colors.red[4];
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    const dayAssessment = assessments.find((a) => a.date === dateStr);

    if (dayAssessment) {
      setSelectedAssessment(dayAssessment);
      setModalOpen(true);
    } else {
      setSelectedAssessment(null);
    }
  };

  // Render color indicators for the calendar legend
  const renderLegend = () => (
    <Group mt="xs" gap="sm" wrap="wrap">
      <Group gap="xs" align="center" wrap="nowrap">
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: theme.colors.green[4],
            flexShrink: 0,
          }}
        />
        <Text size="xs">Great (8-10)</Text>
      </Group>
      <Group gap="xs" align="center" wrap="nowrap">
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: theme.colors.teal[3],
            flexShrink: 0,
          }}
        />
        <Text size="xs">Good (6-8)</Text>
      </Group>
      <Group gap="xs" align="center" wrap="nowrap">
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: theme.colors.yellow[4],
            flexShrink: 0,
          }}
        />
        <Text size="xs">Avg (4-6)</Text>
      </Group>
      <Group gap="xs" align="center" wrap="nowrap">
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: theme.colors.orange[4],
            flexShrink: 0,
          }}
        />
        <Text size="xs">Low (2-4)</Text>
      </Group>
      <Group gap="xs" align="center" wrap="nowrap">
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: theme.colors.red[4],
            flexShrink: 0,
          }}
        />
        <Text size="xs">Poor (0-2)</Text>
      </Group>
    </Group>
  );

  return (
    <Card withBorder p={{ base: "sm", md: "md" }} radius="md">
      <Stack>
        <Title order={3} fz={{ base: "md", md: "lg" }}>
          Wellbeing Calendar
        </Title>

        <Text c="dimmed" size="sm">
          View your wellbeing over time. Click on a date to see your assessment for that day.
        </Text>

        {loading ? (
          <Center h={300}>
            <Loader />
          </Center>
        ) : (
          <>
            <Calendar
              size="md"
              style={{ width: "100%", maxWidth: "100%" }}
              maxDate={new Date()}
              getDayProps={(date) => ({
                style: {
                  backgroundColor: getDayColor(date),
                  opacity: getDayColor(date) ? 1 : undefined,
                },
                onClick: () => handleDayClick(date),
              })}
              styles={{
                day: {
                  "&[data-selected]": {
                    backgroundColor: theme.colors.blue[6],
                  },
                },
              }}
            />

            {renderLegend()}

            <Modal
              opened={modalOpen}
              onClose={() => setModalOpen(false)}
              title={<Title order={4}>Wellbeing Assessment</Title>}
              centered
              size="lg"
            >
              {selectedAssessment && (
                <Stack>
                  <Text fw={500} size="lg">
                    Date: {dayjs(selectedAssessment.date).format("MMMM D, YYYY")}
                  </Text>

                  <Grid>
                    <Grid.Col span={{ base: 12, xs: 6 }}>
                      <Paper withBorder p="md" radius="md">
                        <Group align="center" gap="xs">
                          <IconZzz size={20} color={theme.colors.blue[6]} />
                          <Text>Sleep Quality:</Text>
                          <Badge
                            color={
                              selectedAssessment.sleep_quality >= 7
                                ? "green"
                                : selectedAssessment.sleep_quality >= 4
                                  ? "yellow"
                                  : "red"
                            }
                          >
                            {selectedAssessment.sleep_quality}/10
                          </Badge>
                        </Group>
                      </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, xs: 6 }}>
                      <Paper withBorder p="md" radius="md">
                        <Group align="center" gap="xs">
                          <IconMoodNervous size={20} color={theme.colors.red[6]} />
                          <Text>Stress Level:</Text>
                          <Badge
                            color={
                              selectedAssessment.stress_level <= 3
                                ? "green"
                                : selectedAssessment.stress_level <= 6
                                  ? "yellow"
                                  : "red"
                            }
                          >
                            {selectedAssessment.stress_level}/10
                          </Badge>
                        </Group>
                      </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, xs: 6 }}>
                      <Paper withBorder p="md" radius="md">
                        <Group align="center" gap="xs">
                          <IconSalad size={20} color={theme.colors.green[6]} />
                          <Text>Nutrition Quality:</Text>
                          <Badge
                            color={
                              selectedAssessment.nutrition_quality >= 7
                                ? "green"
                                : selectedAssessment.nutrition_quality >= 4
                                  ? "yellow"
                                  : "red"
                            }
                          >
                            {selectedAssessment.nutrition_quality}/10
                          </Badge>
                        </Group>
                      </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, xs: 6 }}>
                      <Paper withBorder p="md" radius="md">
                        <Group align="center" gap="xs">
                          <IconBarbell size={20} color={theme.colors.orange[6]} />
                          <Text>Physical Readiness:</Text>
                          <Badge
                            color={
                              selectedAssessment.physical_readiness >= 7
                                ? "green"
                                : selectedAssessment.physical_readiness >= 4
                                  ? "yellow"
                                  : "red"
                            }
                          >
                            {selectedAssessment.physical_readiness}/10
                          </Badge>
                        </Group>
                      </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, xs: 6 }}>
                      <Paper withBorder p="md" radius="md">
                        <Group align="center" gap="xs">
                          <IconMoodSmile size={20} color={theme.colors.violet[6]} />
                          <Text>Mental Clarity:</Text>
                          <Badge
                            color={
                              selectedAssessment.mental_clarity >= 7
                                ? "green"
                                : selectedAssessment.mental_clarity >= 4
                                  ? "yellow"
                                  : "red"
                            }
                          >
                            {selectedAssessment.mental_clarity}/10
                          </Badge>
                        </Group>
                      </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, xs: 6 }}>
                      <Paper withBorder p="md" radius="md">
                        <Group align="center" gap="xs">
                          <IconMoodSmile size={20} color={theme.colors.blue[6]} />
                          <Text>Overall Score:</Text>
                          <Badge
                            color={
                              calculateAvgScore(selectedAssessment) >= 7
                                ? "green"
                                : calculateAvgScore(selectedAssessment) >= 4
                                  ? "yellow"
                                  : "red"
                            }
                          >
                            {calculateAvgScore(selectedAssessment).toFixed(1)}/10
                          </Badge>
                        </Group>
                      </Paper>
                    </Grid.Col>
                  </Grid>

                  {selectedAssessment.notes && (
                    <Paper withBorder p="md" radius="md">
                      <Text fw={500}>Notes:</Text>
                      <Text mt="xs">{selectedAssessment.notes}</Text>
                    </Paper>
                  )}
                </Stack>
              )}
            </Modal>
          </>
        )}
      </Stack>
    </Card>
  );
}
