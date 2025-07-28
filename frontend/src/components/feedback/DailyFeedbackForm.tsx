"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Progress,
  Slider,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { IconActivity, IconBrain, IconCheck, IconHeart } from "@tabler/icons-react";
import { useState } from "react";

interface DailyFeedback {
  sessionRpe: number;
  muscleSoreness: number;
  energyLevel: number;
  motivationLevel: number;
  whatFeltGood: string;
  whatFeltDifficult: string;
  suggestedChanges: string;
}

interface DailyFeedbackFormProps {
  onSubmit: (feedback: DailyFeedback) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function DailyFeedbackForm({ onSubmit, onCancel, isLoading }: DailyFeedbackFormProps) {
  const [feedback, setFeedback] = useState<DailyFeedback>({
    sessionRpe: 5,
    muscleSoreness: 5,
    energyLevel: 5,
    motivationLevel: 5,
    whatFeltGood: "",
    whatFeltDifficult: "",
    suggestedChanges: "",
  });

  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: "Session Intensity", icon: IconActivity },
    { title: "Physical State", icon: IconHeart },
    { title: "Mental State", icon: IconBrain },
    { title: "Feedback Notes", icon: IconCheck },
  ];

  const handleSubmit = () => {
    onSubmit(feedback);
  };

  const getScaleLabel = (value: number, type: "rpe" | "soreness" | "energy" | "motivation") => {
    const labels = {
      rpe: ["Very Easy", "Easy", "Moderate", "Hard", "Very Hard"],
      soreness: ["No Soreness", "Mild", "Moderate", "Significant", "Very Sore"],
      energy: ["Exhausted", "Low", "Moderate", "High", "Excellent"],
      motivation: ["None", "Low", "Moderate", "High", "Excellent"],
    };

    const index = Math.min(Math.floor((value - 1) / 2), 4);
    return labels[type][index];
  };

  const getScaleColor = (value: number, inverted = false) => {
    if (inverted) {
      if (value <= 3) return "green";
      if (value <= 6) return "yellow";
      return "red";
    }
    if (value <= 3) return "red";
    if (value <= 6) return "yellow";
    return "green";
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Stack gap="md">
            <Title order={3}>How did today's session feel?</Title>
            <Text size="sm" c="dimmed">
              Rate the overall intensity of your training session
            </Text>

            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={500}>Session RPE (Rate of Perceived Exertion)</Text>
                <Badge color={getScaleColor(feedback.sessionRpe)} variant="light">
                  {feedback.sessionRpe}/10 - {getScaleLabel(feedback.sessionRpe, "rpe")}
                </Badge>
              </Group>

              <Slider
                value={feedback.sessionRpe}
                onChange={(value) => setFeedback({ ...feedback, sessionRpe: value })}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: "1" },
                  { value: 3, label: "3" },
                  { value: 5, label: "5" },
                  { value: 7, label: "7" },
                  { value: 10, label: "10" },
                ]}
                color={getScaleColor(feedback.sessionRpe)}
              />

              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Very Easy
                </Text>
                <Text size="xs" c="dimmed">
                  Maximal
                </Text>
              </Group>
            </Stack>

            {feedback.sessionRpe > 8 && (
              <Alert color="orange" title="High Intensity Detected">
                Your session felt very intense. We may recommend easier training tomorrow.
              </Alert>
            )}
          </Stack>
        );

      case 1:
        return (
          <Stack gap="md">
            <Title order={3}>How does your body feel?</Title>
            <Text size="sm" c="dimmed">
              Rate your current physical state
            </Text>

            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={500}>Muscle Soreness</Text>
                <Badge color={getScaleColor(feedback.muscleSoreness, true)} variant="light">
                  {feedback.muscleSoreness}/10 -{" "}
                  {getScaleLabel(feedback.muscleSoreness, "soreness")}
                </Badge>
              </Group>

              <Slider
                value={feedback.muscleSoreness}
                onChange={(value) => setFeedback({ ...feedback, muscleSoreness: value })}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: "1" },
                  { value: 3, label: "3" },
                  { value: 5, label: "5" },
                  { value: 7, label: "7" },
                  { value: 10, label: "10" },
                ]}
                color={getScaleColor(feedback.muscleSoreness, true)}
              />

              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  No Soreness
                </Text>
                <Text size="xs" c="dimmed">
                  Very Sore
                </Text>
              </Group>
            </Stack>

            {feedback.muscleSoreness > 7 && (
              <Alert color="orange" title="High Soreness Detected">
                You're quite sore. Tomorrow's training may be adjusted for recovery.
              </Alert>
            )}
          </Stack>
        );

      case 2:
        return (
          <Stack gap="md">
            <Title order={3}>How do you feel mentally?</Title>
            <Text size="sm" c="dimmed">
              Rate your energy and motivation levels
            </Text>

            <Stack gap="xl">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text fw={500}>Energy Level</Text>
                  <Badge color={getScaleColor(feedback.energyLevel)} variant="light">
                    {feedback.energyLevel}/10 - {getScaleLabel(feedback.energyLevel, "energy")}
                  </Badge>
                </Group>

                <Slider
                  value={feedback.energyLevel}
                  onChange={(value) => setFeedback({ ...feedback, energyLevel: value })}
                  min={1}
                  max={10}
                  step={1}
                  marks={[
                    { value: 1, label: "1" },
                    { value: 5, label: "5" },
                    { value: 10, label: "10" },
                  ]}
                  color={getScaleColor(feedback.energyLevel)}
                />

                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Exhausted
                  </Text>
                  <Text size="xs" c="dimmed">
                    Excellent
                  </Text>
                </Group>
              </Stack>

              <Stack gap="xs">
                <Group justify="space-between">
                  <Text fw={500}>Motivation Level</Text>
                  <Badge color={getScaleColor(feedback.motivationLevel)} variant="light">
                    {feedback.motivationLevel}/10 -{" "}
                    {getScaleLabel(feedback.motivationLevel, "motivation")}
                  </Badge>
                </Group>

                <Slider
                  value={feedback.motivationLevel}
                  onChange={(value) => setFeedback({ ...feedback, motivationLevel: value })}
                  min={1}
                  max={10}
                  step={1}
                  marks={[
                    { value: 1, label: "1" },
                    { value: 5, label: "5" },
                    { value: 10, label: "10" },
                  ]}
                  color={getScaleColor(feedback.motivationLevel)}
                />

                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    None
                  </Text>
                  <Text size="xs" c="dimmed">
                    Excellent
                  </Text>
                </Group>
              </Stack>
            </Stack>

            {feedback.energyLevel < 4 && (
              <Alert color="blue" title="Low Energy Detected">
                You're feeling low on energy. We may recommend a lighter training load.
              </Alert>
            )}
          </Stack>
        );

      case 3:
        return (
          <Stack gap="md">
            <Title order={3}>Additional Feedback</Title>
            <Text size="sm" c="dimmed">
              Help us understand your training experience better (optional)
            </Text>

            <Textarea
              label="What felt good today?"
              placeholder="e.g., Form felt solid on squats, good power on sprints..."
              value={feedback.whatFeltGood}
              onChange={(event) =>
                setFeedback({ ...feedback, whatFeltGood: event.currentTarget.value })
              }
              minRows={2}
            />

            <Textarea
              label="What felt difficult?"
              placeholder="e.g., Lower back tight, couldn't maintain speed..."
              value={feedback.whatFeltDifficult}
              onChange={(event) =>
                setFeedback({ ...feedback, whatFeltDifficult: event.currentTarget.value })
              }
              minRows={2}
            />

            <Textarea
              label="Suggestions for tomorrow?"
              placeholder="e.g., Need more warm-up, reduce weight, focus on technique..."
              value={feedback.suggestedChanges}
              onChange={(event) =>
                setFeedback({ ...feedback, suggestedChanges: event.currentTarget.value })
              }
              minRows={2}
            />
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="lg">
        <Group justify="space-between" ta="center">
          <Title order={2}>Daily Training Feedback</Title>
          <Text size="sm" c="dimmed">
            Step {currentStep + 1} of {steps.length}
          </Text>
        </Group>

        <Progress value={((currentStep + 1) / steps.length) * 100} size="sm" />

        <div style={{ minHeight: "300px" }}>{renderStep()}</div>

        <Group justify="space-between">
          <Group>
            {currentStep > 0 && (
              <Button
                variant="light"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isLoading}
              >
                Previous
              </Button>
            )}
            {onCancel && (
              <Button variant="subtle" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
          </Group>

          <Group>
            {currentStep < steps.length - 1 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={isLoading}>
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={isLoading}
                leftSection={<IconCheck size={16} />}
              >
                Submit Feedback
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Card>
  );
}
