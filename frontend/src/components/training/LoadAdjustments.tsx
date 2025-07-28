"use client";

import {
  ActionIcon,
  Alert,
  Badge,
  Card,
  Divider,
  Group,
  List,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconBrain,
  IconChartLine,
  IconInfoCircle,
  IconMinus,
  IconTarget,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import type { LoadAdjustment } from "@/lib/types/training";

interface LoadAdjustmentsProps {
  adjustments: LoadAdjustment[];
  reasoning: string[];
  confidence: number;
  modelVersion?: string;
  showDetails?: boolean;
}

export function LoadAdjustments({
  adjustments,
  reasoning,
  confidence,
  modelVersion = "Rule-based v1.0",
  showDetails = true,
}: LoadAdjustmentsProps) {
  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case "increase":
        return <IconTrendingUp size={18} />;
      case "decrease":
        return <IconTrendingDown size={18} />;
      default:
        return <IconMinus size={18} />;
    }
  };

  const getAdjustmentColor = (type: string) => {
    switch (type) {
      case "increase":
        return "green";
      case "decrease":
        return "orange";
      default:
        return "blue";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "green";
    if (confidence >= 0.6) return "yellow";
    return "red";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High Confidence";
    if (confidence >= 0.6) return "Moderate Confidence";
    return "Low Confidence";
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage > 0 ? "+" : "";
    return `${sign}${percentage}%`;
  };

  const getPrimaryAdjustment = () => {
    if (adjustments.length === 0) return null;
    return adjustments.reduce((max, adj) =>
      Math.abs(adj.percentage) > Math.abs(max.percentage) ? adj : max
    );
  };

  const primaryAdjustment = getPrimaryAdjustment();

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" ta="center">
          <Group ta="center" gap="sm">
            <ThemeIcon color="blue" variant="light" size="lg">
              <IconBrain size={20} />
            </ThemeIcon>
            <Stack gap={2}>
              <Text fw={600} size="lg">
                AI Training Adaptations
              </Text>
              <Text size="xs" c="dimmed">
                {modelVersion}
              </Text>
            </Stack>
          </Group>

          <Group ta="center" gap="xs">
            <Tooltip label={`Model confidence: ${Math.round(confidence * 100)}%`}>
              <ActionIcon variant="subtle" size="sm">
                <IconInfoCircle size={16} />
              </ActionIcon>
            </Tooltip>
            <Badge color={getConfidenceColor(confidence)} variant="light" size="sm">
              {getConfidenceLabel(confidence)}
            </Badge>
          </Group>
        </Group>

        {/* Confidence Meter */}
        <Stack gap={4}>
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              Prediction Confidence
            </Text>
            <Text size="sm" c="dimmed">
              {Math.round(confidence * 100)}%
            </Text>
          </Group>
          <Progress value={confidence * 100} size="sm" color={getConfidenceColor(confidence)} />
        </Stack>

        {/* Primary Adjustment Summary */}
        {primaryAdjustment && (
          <Alert
            color={getAdjustmentColor(primaryAdjustment.type)}
            variant="light"
            title="Primary Adaptation"
            icon={getAdjustmentIcon(primaryAdjustment.type)}
          >
            <Text size="sm">
              Training load{" "}
              {primaryAdjustment.type === "increase"
                ? "increased"
                : primaryAdjustment.type === "decrease"
                  ? "decreased"
                  : "maintained"}{" "}
              by{" "}
              <Text component="span" fw={600}>
                {formatPercentage(Math.abs(primaryAdjustment.percentage))}
              </Text>
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              {primaryAdjustment.reason}
            </Text>
          </Alert>
        )}

        {showDetails && (
          <>
            <Divider />

            {/* Detailed Adjustments */}
            <Stack gap="sm">
              <Group ta="center" gap="sm">
                <IconTarget size={16} />
                <Text fw={500} size="sm">
                  Detailed Adjustments
                </Text>
              </Group>

              {adjustments.map((adjustment, index) => (
                <Card key={index} padding="sm" radius="sm" withBorder>
                  <Group justify="space-between" ta="center">
                    <Group ta="center" gap="sm">
                      <ThemeIcon
                        color={getAdjustmentColor(adjustment.type)}
                        variant="light"
                        size="sm"
                      >
                        {getAdjustmentIcon(adjustment.type)}
                      </ThemeIcon>
                      <Stack gap={2}>
                        <Text size="sm" fw={500} tt="capitalize">
                          {adjustment.type} Load
                        </Text>
                        <Text size="xs" c="dimmed">
                          {adjustment.reason}
                        </Text>
                      </Stack>
                    </Group>

                    <Stack gap={2} align="flex-end">
                      <Badge color={getAdjustmentColor(adjustment.type)} variant="light" size="sm">
                        {formatPercentage(adjustment.percentage)}
                      </Badge>
                      <Progress
                        value={adjustment.confidence * 100}
                        size="xs"
                        w={60}
                        color={getConfidenceColor(adjustment.confidence)}
                      />
                    </Stack>
                  </Group>
                </Card>
              ))}
            </Stack>

            <Divider />

            {/* Reasoning */}
            <Stack gap="sm">
              <Group ta="center" gap="sm">
                <IconChartLine size={16} />
                <Text fw={500} size="sm">
                  AI Reasoning
                </Text>
              </Group>

              <List size="sm" spacing="xs">
                {reasoning.map((reason, index) => (
                  <List.Item key={index}>
                    <Text size="sm" c="dimmed">
                      {reason}
                    </Text>
                  </List.Item>
                ))}
              </List>
            </Stack>
          </>
        )}

        {/* Low Confidence Warning */}
        {confidence < 0.6 && (
          <Alert color="yellow" variant="light" title="Low Confidence Warning">
            <Text size="sm">
              The AI has low confidence in these recommendations. Consider manual review or
              additional data collection before proceeding.
            </Text>
          </Alert>
        )}
      </Stack>
    </Card>
  );
}
