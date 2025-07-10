"use client";

import { useState } from "react";
import {
  Card,
  Stack,
  Title,
  Text,
  Group,
  Badge,
  Button,
  Divider,
  Alert,
  Modal,
  Tabs,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconCalendar,
  IconClock,
  IconTarget,
  IconCheck,
  IconEdit,
  IconRefresh,
  IconInfoCircle,
  IconActivity,
} from "@tabler/icons-react";
import { SessionRecommendation } from "@/lib/types/training";
import { ExerciseCard } from "./ExerciseCard";
import { LoadAdjustments } from "./LoadAdjustments";

interface SessionRecommendationsProps {
  recommendation: SessionRecommendation;
  onAcceptSession?: (sessionId: string) => void;
  onModifySession?: (sessionId: string) => void;
  onRegenerateSession?: (sessionId: string) => void;
  onSetComplete?: (exerciseId: string, setNumber: number) => void;
  onExerciseComplete?: (exerciseId: string) => void;
  isLoading?: boolean;
}

export function SessionRecommendations({
  recommendation,
  onAcceptSession,
  onModifySession,
  onRegenerateSession,
  onSetComplete,
  onExerciseComplete,
  isLoading = false,
}: SessionRecommendationsProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { session, loadAdjustments, reasoning, confidence } = recommendation;

  const getSessionTypeColor = (type: string) => {
    const colors = {
      strength: "blue",
      power: "red",
      speed: "green",
      recovery: "teal",
      technique: "purple",
    };
    return colors[type as keyof typeof colors] || "gray";
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getTotalVolume = () => {
    return session.exercises.reduce((total, sessionExercise) => {
      return total + sessionExercise.sets.reduce((exerciseTotal, set) => {
        return exerciseTotal + (set.reps * set.weight);
      }, 0);
    }, 0);
  };

  const getMainExercises = () => session.exercises.filter(ex => ex.isMainExercise);
  const getAccessoryExercises = () => session.exercises.filter(ex => !ex.isMainExercise);

  const renderSessionSummary = () => (
    <Card padding="md" radius="sm" withBorder>
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Group align="center" gap="sm">
            <IconActivity size={20} />
            <Text fw={600} size="lg" tt="capitalize">
              {session.sessionType} Training
            </Text>
          </Group>
          <Badge
            color={getSessionTypeColor(session.sessionType)}
            variant="light"
            size="lg"
          >
            {session.sessionType.toUpperCase()}
          </Badge>
        </Group>

        <Group grow>
          <Group align="center" gap="xs">
            <IconCalendar size={16} />
            <Stack gap={2}>
              <Text size="xs" c="dimmed">Date</Text>
              <Text size="sm" fw={500}>
                {session.date.toLocaleDateString()}
              </Text>
            </Stack>
          </Group>

          <Group align="center" gap="xs">
            <IconClock size={16} />
            <Stack gap={2}>
              <Text size="xs" c="dimmed">Duration</Text>
              <Text size="sm" fw={500}>
                {formatDuration(session.plannedDuration)}
              </Text>
            </Stack>
          </Group>

          <Group align="center" gap="xs">
            <IconTarget size={16} />
            <Stack gap={2}>
              <Text size="xs" c="dimmed">Total Volume</Text>
              <Text size="sm" fw={500}>
                {Math.round(getTotalVolume())}kg
              </Text>
            </Stack>
          </Group>
        </Group>

        {session.notes && (
          <Alert color="blue" variant="light" title="Session Focus">
            <Text size="sm">{session.notes}</Text>
          </Alert>
        )}
      </Stack>
    </Card>
  );

  const renderExercisesList = (exercises: typeof session.exercises, title: string) => (
    <Stack gap="md">
      <Text fw={600} size="md">{title}</Text>
      {exercises.map((sessionExercise, index) => (
        <ExerciseCard
          key={sessionExercise.id}
          sessionExercise={sessionExercise}
          onSetComplete={onSetComplete}
          onExerciseComplete={onExerciseComplete}
          showAdaptations={true}
        />
      ))}
    </Stack>
  );

  return (
    <>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="center">
            <Stack gap={4}>
              <Title order={2}>Today's Training Recommendation</Title>
              <Text size="sm" c="dimmed">
                Generated on {recommendation.createdAt.toLocaleString()}
              </Text>
            </Stack>

            <Group align="center" gap="xs">
              <Tooltip label="View detailed analysis">
                <ActionIcon
                  variant="light"
                  onClick={() => setShowDetails(true)}
                >
                  <IconInfoCircle size={16} />
                </ActionIcon>
              </Tooltip>
              
              <Badge
                color={confidence >= 0.8 ? "green" : confidence >= 0.6 ? "yellow" : "red"}
                variant="light"
              >
                {Math.round(confidence * 100)}% confidence
              </Badge>
            </Group>
          </Group>

          {/* Session Summary */}
          {renderSessionSummary()}

          {/* Load Adjustments */}
          {loadAdjustments.length > 0 && (
            <LoadAdjustments
              adjustments={loadAdjustments}
              reasoning={reasoning}
              confidence={confidence}
              showDetails={false}
            />
          )}

          {/* Main Exercises Preview */}
          <Stack gap="sm">
            <Text fw={600} size="md">Main Exercises ({getMainExercises().length})</Text>
            {getMainExercises().slice(0, 2).map((sessionExercise) => (
              <Card key={sessionExercise.id} padding="sm" radius="sm" withBorder>
                <Group justify="space-between" align="center">
                  <Group align="center" gap="sm">
                    <Text fw={500}>{sessionExercise.exercise.name}</Text>
                    <Badge size="xs" variant="light">
                      {sessionExercise.sets.length} sets
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {sessionExercise.sets[0]?.reps} × {sessionExercise.sets[0]?.weight}kg
                  </Text>
                </Group>
                {sessionExercise.adaptationReason && (
                  <Text size="xs" c="blue" mt={4}>
                    {sessionExercise.adaptationReason}
                  </Text>
                )}
              </Card>
            ))}
            
            {getMainExercises().length > 2 && (
              <Text size="sm" c="dimmed" ta="center">
                +{getMainExercises().length - 2} more exercises
              </Text>
            )}
          </Stack>

          {/* Action Buttons */}
          <Group justify="center" grow>
            <Button
              leftSection={<IconCheck size={16} />}
              onClick={() => onAcceptSession?.(session.id)}
              loading={isLoading}
              size="md"
            >
              Start Session
            </Button>
            
            <Button
              variant="light"
              leftSection={<IconEdit size={16} />}
              onClick={() => onModifySession?.(session.id)}
              disabled={isLoading}
              size="md"
            >
              Modify
            </Button>
            
            <Button
              variant="subtle"
              leftSection={<IconRefresh size={16} />}
              onClick={() => onRegenerateSession?.(session.id)}
              disabled={isLoading}
              size="md"
            >
              Regenerate
            </Button>
          </Group>

          {/* Confidence Warning */}
          {confidence < 0.6 && (
            <Alert color="yellow" variant="light" title="Low Confidence Warning">
              <Text size="sm">
                The AI has lower confidence in today's recommendations. Consider reviewing
                your recent feedback or consulting with a coach.
              </Text>
            </Alert>
          )}
        </Stack>
      </Card>

      {/* Detailed View Modal */}
      <Modal
        opened={showDetails}
        onClose={() => setShowDetails(false)}
        title="Detailed Session Analysis"
        size="xl"
        scrollAreaComponent="div"
      >
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="exercises">All Exercises</Tabs.Tab>
            <Tabs.Tab value="adaptations">AI Analysis</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <Stack gap="md">
              {renderSessionSummary()}
              
              <Text fw={600} size="md">Exercise Summary</Text>
              <Group grow>
                <Card padding="sm" withBorder>
                  <Stack gap={4} align="center">
                    <Text size="lg" fw={700} c="blue">
                      {getMainExercises().length}
                    </Text>
                    <Text size="xs" c="dimmed">Main Exercises</Text>
                  </Stack>
                </Card>
                
                <Card padding="sm" withBorder>
                  <Stack gap={4} align="center">
                    <Text size="lg" fw={700} c="gray">
                      {getAccessoryExercises().length}
                    </Text>
                    <Text size="xs" c="dimmed">Accessory</Text>
                  </Stack>
                </Card>
                
                <Card padding="sm" withBorder>
                  <Stack gap={4} align="center">
                    <Text size="lg" fw={700} c="green">
                      {session.exercises.reduce((total, ex) => total + ex.sets.length, 0)}
                    </Text>
                    <Text size="xs" c="dimmed">Total Sets</Text>
                  </Stack>
                </Card>
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="exercises" pt="md">
            <Stack gap="lg">
              {getMainExercises().length > 0 && 
                renderExercisesList(getMainExercises(), "Main Exercises")
              }
              
              {getAccessoryExercises().length > 0 && (
                <>
                  <Divider />
                  {renderExercisesList(getAccessoryExercises(), "Accessory Exercises")}
                </>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="adaptations" pt="md">
            <LoadAdjustments
              adjustments={loadAdjustments}
              reasoning={reasoning}
              confidence={confidence}
              modelVersion={recommendation.modelVersion}
              showDetails={true}
            />
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </>
  );
}