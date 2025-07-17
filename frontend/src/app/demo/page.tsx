"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Notifications,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { IconActivity, IconBrain, IconChartLine, IconRocket } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { TrendCharts } from "@/components/charts/TrendCharts";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AIProcessingLoader, SmartLoadingWrapper } from "@/components/common/LoadingStates";
import { DailyFeedbackForm } from "@/components/feedback/DailyFeedbackForm";
import { SessionRecommendations } from "@/components/training/SessionRecommendations";
import { generateMockSession, MOCK_FEEDBACK_HISTORY } from "@/lib/mockData/sessionData";
import { toast } from "@/lib/notifications/toast";
import { useLocalStorage } from "@/lib/storage/localStorage";
import type { DailyFeedback } from "@/lib/types/training";

export default function DemoPage() {
  const storage = useLocalStorage();
  const [currentFeedback, setCurrentFeedback] = useState<DailyFeedback | undefined>();
  const [feedbackHistory, setFeedbackHistory] = useState<DailyFeedback[]>([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("recommendations");
  const [aiStage, setAiStage] = useState<"analyzing" | "adapting" | "generating" | "complete">(
    "complete"
  );
  const [timeRange, setTimeRange] = useState<"7d" | "14d" | "30d" | "90d">("14d");

  // Load data from localStorage on mount
  useEffect(() => {
    const storedHistory = storage.getFeedbackHistory();
    const recentFeedback = storage.getMostRecentFeedback();

    if (storedHistory.length > 0) {
      setFeedbackHistory(storedHistory);
      setCurrentFeedback(recentFeedback || undefined);
      toast.dataRestored();
    } else {
      // Use mock data if no stored data
      setFeedbackHistory(MOCK_FEEDBACK_HISTORY);
      setCurrentFeedback(MOCK_FEEDBACK_HISTORY[0]);
    }
  }, []);

  // Generate session recommendation based on current feedback
  const sessionRecommendation = generateMockSession(
    new Date(),
    currentFeedback,
    "strength" // Can be made dynamic
  );

  const handleFeedbackSubmit = async (feedback: DailyFeedback) => {
    setIsLoading(true);

    // Start AI processing stages
    const processingId = "ai-processing";
    toast.aiProcessing(processingId);

    setAiStage("analyzing");
    await new Promise((resolve) => setTimeout(resolve, 800));

    setAiStage("adapting");
    await new Promise((resolve) => setTimeout(resolve, 700));

    setAiStage("generating");
    await new Promise((resolve) => setTimeout(resolve, 600));

    setAiStage("complete");

    // Update feedback with generated ID and current date
    const updatedFeedback: DailyFeedback = {
      ...feedback,
      id: `feedback-${Date.now()}`,
      athleteId: "joshua-hudson",
      date: new Date(),
      createdAt: new Date(),
    };

    // Save to localStorage and update state
    storage.saveFeedback(updatedFeedback);
    setCurrentFeedback(updatedFeedback);
    setFeedbackHistory((prev) => [updatedFeedback, ...prev]);

    // Determine adaptation type for toast
    const avgScore =
      (feedback.sessionRpe +
        feedback.muscleSoreness -
        feedback.energyLevel -
        feedback.motivationLevel) /
      4;
    const adaptationType = avgScore > 2 ? "decrease" : avgScore < -1 ? "increase" : "maintain";

    toast.aiComplete(processingId, adaptationType);
    toast.feedbackSubmitted();

    setShowFeedbackForm(false);
    setActiveTab("recommendations");
    setIsLoading(false);
  };

  const handleAcceptSession = async (sessionId: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.sessionAccepted();
    console.log("Accepted session:", sessionId);
    setIsLoading(false);
  };

  const handleModifySession = (sessionId: string) => {
    toast.sessionModified();
    console.log("Modify session:", sessionId);
  };

  const handleRegenerateSession = (sessionId: string) => {
    toast.info({ message: "Regenerating session with new parameters..." });
    console.log("Regenerate session:", sessionId);
  };

  const handleSetComplete = (exerciseId: string, setNumber: number) => {
    toast.setCompleted("Exercise", setNumber);
  };

  const handleExerciseComplete = (exerciseId: string) => {
    toast.exerciseCompleted("Exercise");
  };

  return (
    <ErrorBoundary>
      <Notifications position="top-right" />
      <Container size="lg" py="xl">
        <Stack gap="xl">
          {/* Header */}
          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack gap="md" align="center">
              <Group align="center" gap="sm">
                <IconRocket size={32} color="blue" />
                <Title order={1} ta="center">
                  Adaptive Training AI Demo
                </Title>
              </Group>

              <Text size="lg" c="dimmed" ta="center" maw={600}>
                Experience the future of personalized training. Submit your daily feedback and watch
                the AI adapt your training in real-time.
              </Text>

              <Group>
                <Badge size="lg" variant="light" color="blue">
                  Rule-Based AI v1.0
                </Badge>
                <Badge size="lg" variant="light" color="green">
                  Joshua Hudson Training Method
                </Badge>
              </Group>
            </Stack>
          </Card>

          {/* Demo Status */}
          <Alert color="blue" title="Demo Mode Active" icon={<IconBrain size={16} />}>
            <Text size="sm">
              This demo uses mock data based on the Joshua Hudson Training Template analysis. All
              adaptations are generated using rule-based AI that mimics real coaching decisions.
            </Text>
          </Alert>

          {/* Main Content */}
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List grow>
              <Tabs.Tab value="recommendations" leftSection={<IconActivity size={16} />}>
                Today's Training
              </Tabs.Tab>
              <Tabs.Tab value="feedback" leftSection={<IconBrain size={16} />}>
                Submit Feedback
              </Tabs.Tab>
              <Tabs.Tab value="trends" leftSection={<IconChartLine size={16} />}>
                Trends & Analytics
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="recommendations" pt="md">
              <Stack gap="md">
                {currentFeedback && (
                  <Alert color="green" title="Feedback Based Adaptation">
                    <Text size="sm">
                      Training adapted based on your recent feedback (RPE:{" "}
                      {currentFeedback.sessionRpe}/10, Soreness: {currentFeedback.muscleSoreness}
                      /10, Energy: {currentFeedback.energyLevel}/10)
                    </Text>
                  </Alert>
                )}

                <SmartLoadingWrapper
                  isLoading={isLoading && aiStage !== "complete"}
                  loadingComponent={<AIProcessingLoader stage={aiStage} />}
                >
                  <SessionRecommendations
                    recommendation={sessionRecommendation}
                    onAcceptSession={handleAcceptSession}
                    onModifySession={handleModifySession}
                    onRegenerateSession={handleRegenerateSession}
                    onSetComplete={handleSetComplete}
                    onExerciseComplete={handleExerciseComplete}
                    isLoading={isLoading}
                  />
                </SmartLoadingWrapper>

                <Group justify="center">
                  <Button
                    variant="light"
                    onClick={() => {
                      setActiveTab("feedback");
                      setShowFeedbackForm(true);
                    }}
                  >
                    Submit New Feedback to See Adaptation
                  </Button>
                </Group>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="feedback" pt="md">
              <Stack gap="md">
                <Text size="md" fw={500} ta="center">
                  Submit your training feedback to see real-time adaptations
                </Text>

                {!showFeedbackForm ? (
                  <Card padding="xl" withBorder>
                    <Stack gap="md" align="center">
                      <Text size="lg" c="dimmed">
                        Ready to submit today's training feedback?
                      </Text>
                      <Button size="lg" onClick={() => setShowFeedbackForm(true)}>
                        Start Feedback Form
                      </Button>
                    </Stack>
                  </Card>
                ) : (
                  <DailyFeedbackForm
                    onSubmit={handleFeedbackSubmit}
                    onCancel={() => setShowFeedbackForm(false)}
                    isLoading={isLoading}
                  />
                )}

                {/* Current Feedback Summary */}
                {currentFeedback && (
                  <Card padding="md" withBorder>
                    <Stack gap="sm">
                      <Text fw={500} size="sm">
                        Most Recent Feedback:
                      </Text>
                      <Group>
                        <Badge variant="light">RPE: {currentFeedback.sessionRpe}/10</Badge>
                        <Badge variant="light">Soreness: {currentFeedback.muscleSoreness}/10</Badge>
                        <Badge variant="light">Energy: {currentFeedback.energyLevel}/10</Badge>
                        <Badge variant="light">
                          Motivation: {currentFeedback.motivationLevel}/10
                        </Badge>
                      </Group>
                      {currentFeedback.whatFeltGood && (
                        <Text size="xs" c="dimmed">
                          Felt good: {currentFeedback.whatFeltGood}
                        </Text>
                      )}
                      {currentFeedback.whatFeltDifficult && (
                        <Text size="xs" c="dimmed">
                          Felt difficult: {currentFeedback.whatFeltDifficult}
                        </Text>
                      )}
                    </Stack>
                  </Card>
                )}
              </Stack>
            </Tabs.Panel>
            <Tabs.Panel value="trends" pt="md">
              <ErrorBoundary>
                <TrendCharts
                  feedbackHistory={feedbackHistory}
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                />
              </ErrorBoundary>
            </Tabs.Panel>
          </Tabs>

          {/* Demo Instructions */}
          <Card padding="md" withBorder>
            <Stack gap="sm">
              <Text fw={500} size="sm">
                Try These Demo Scenarios:
              </Text>
              <Stack gap="xs">
                <Text size="xs" c="dimmed">
                  • Submit high RPE (8-10) and high soreness (8-10) to see load reductions
                </Text>
                <Text size="xs" c="dimmed">
                  • Submit low energy (1-3) to see volume adjustments
                </Text>
                <Text size="xs" c="dimmed">
                  • Submit excellent metrics (RPE≤5, Energy≥8, Soreness≤4) to see progression
                </Text>
                <Text size="xs" c="dimmed">
                  • Submit low motivation to see exercise substitutions
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </ErrorBoundary>
  );
}
