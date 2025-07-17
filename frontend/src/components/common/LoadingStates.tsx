"use client";

import {
  Alert,
  Card,
  Group,
  Loader,
  Progress,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Timeline,
} from "@mantine/core";
import {
  IconActivity,
  IconBrain,
  IconChartLine,
  IconCheck,
  IconTargetArrow,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface AIProcessingLoaderProps {
  stage: "analyzing" | "adapting" | "generating" | "complete";
  progress?: number;
  message?: string;
}

export function AIProcessingLoader({ stage, progress = 0, message }: AIProcessingLoaderProps) {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    const targetProgress =
      stage === "analyzing" ? 25 : stage === "adapting" ? 50 : stage === "generating" ? 85 : 100;

    const interval = setInterval(() => {
      setCurrentProgress((prev) => {
        if (prev < targetProgress) {
          return Math.min(prev + 2, targetProgress);
        }
        return targetProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [stage]);

  const getStageInfo = () => {
    switch (stage) {
      case "analyzing":
        return {
          icon: <IconChartLine size={20} />,
          title: "Analyzing Feedback",
          description: "Processing your training response data...",
          color: "blue",
        };
      case "adapting":
        return {
          icon: <IconBrain size={20} />,
          title: "AI Adaptation",
          description: "Calculating optimal training adjustments...",
          color: "purple",
        };
      case "generating":
        return {
          icon: <IconTargetArrow size={20} />,
          title: "Generating Session",
          description: "Creating your personalized workout...",
          color: "green",
        };
      case "complete":
        return {
          icon: <IconCheck size={20} />,
          title: "Complete",
          description: "Your adaptive training session is ready!",
          color: "green",
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group align="center" gap="sm">
          <ThemeIcon color={stageInfo.color} variant="light" size="lg">
            {stageInfo.icon}
          </ThemeIcon>
          <Stack gap={2}>
            <Text fw={600} size="lg">
              {stageInfo.title}
            </Text>
            <Text size="sm" c="dimmed">
              {message || stageInfo.description}
            </Text>
          </Stack>
        </Group>

        <Progress value={currentProgress} size="lg" radius="xl" animated />

        <Text size="xs" c="dimmed" ta="center">
          {currentProgress}% complete
        </Text>

        {stage !== "complete" && (
          <Group justify="center">
            <Loader size="sm" />
          </Group>
        )}
      </Stack>
    </Card>
  );
}

interface ProcessingTimelineProps {
  currentStep: number;
  steps: Array<{
    title: string;
    description: string;
    duration?: string;
  }>;
}

export function ProcessingTimeline({ currentStep, steps }: ProcessingTimelineProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Text fw={600} size="lg" ta="center">
          AI Processing Pipeline
        </Text>

        <Timeline active={currentStep} bulletSize={24} lineWidth={2}>
          {steps.map((step, index) => (
            <Timeline.Item
              key={index}
              bullet={
                index < currentStep ? (
                  <IconCheck size={12} />
                ) : index === currentStep ? (
                  <Loader size={12} />
                ) : (
                  <div />
                )
              }
              title={step.title}
            >
              <Text c="dimmed" size="sm">
                {step.description}
              </Text>
              {step.duration && (
                <Text size="xs" c="dimmed">
                  ~{step.duration}
                </Text>
              )}
            </Timeline.Item>
          ))}
        </Timeline>
      </Stack>
    </Card>
  );
}

export function ExerciseCardSkeleton() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Skeleton height={24} width="60%" />
            <Group gap="xs">
              <Skeleton height={16} width={80} />
              <Skeleton height={16} width={60} />
            </Group>
          </Stack>
          <Skeleton height={20} width={60} />
        </Group>

        <Skeleton height={8} />

        <Stack gap="xs">
          {Array.from({ length: 4 }, (_, i) => (
            <Group key={i} justify="space-between">
              <Skeleton height={16} width="20%" />
              <Skeleton height={16} width="15%" />
              <Skeleton height={16} width="15%" />
              <Skeleton height={16} width="15%" />
              <Skeleton height={24} width="20%" />
            </Group>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}

export function SessionRecommendationSkeleton() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="lg">
        <Group justify="space-between">
          <Stack gap="xs">
            <Skeleton height={28} width="60%" />
            <Skeleton height={16} width="40%" />
          </Stack>
          <Skeleton height={24} width={100} />
        </Group>

        <Card padding="md" radius="sm" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Skeleton height={20} width="40%" />
              <Skeleton height={24} width={80} />
            </Group>
            <Group grow>
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </Group>
          </Stack>
        </Card>

        <Stack gap="md">
          <Skeleton height={20} width="30%" />
          <ExerciseCardSkeleton />
          <ExerciseCardSkeleton />
        </Stack>

        <Group justify="center" grow>
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
        </Group>
      </Stack>
    </Card>
  );
}

interface SmartLoadingWrapperProps {
  isLoading: boolean;
  loadingComponent?: React.ReactNode;
  children: React.ReactNode;
  minLoadingTime?: number; // Minimum time to show loading (UX improvement)
}

export function SmartLoadingWrapper({
  isLoading,
  loadingComponent,
  children,
  minLoadingTime = 500,
}: SmartLoadingWrapperProps) {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      setStartTime(Date.now());
      setShowLoading(true);
    } else if (startTime) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadingTime - elapsed);

      setTimeout(() => {
        setShowLoading(false);
        setStartTime(null);
      }, remaining);
    }
  }, [isLoading, startTime, minLoadingTime]);

  if (showLoading) {
    return <>{loadingComponent || <Loader />}</>;
  }

  return <>{children}</>;
}
