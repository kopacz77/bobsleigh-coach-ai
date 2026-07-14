"use client";

import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Group,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";

import { useApprovePlan, useRejectPlan } from "@/hooks/usePlans";

import RejectFeedbackModal from "./RejectFeedbackModal";

interface PlanReviewCardProps {
  plan: any;
}

function riskColor(score: number | null | undefined): string {
  if (score == null) return "gray";
  if (score < 0.3) return "green";
  if (score < 0.6) return "yellow";
  return "red";
}

function riskLabel(score: number | null | undefined): string {
  if (score == null) return "Unknown";
  if (score < 0.3) return "Low";
  if (score < 0.6) return "Moderate";
  return "High";
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const PlanReviewCard = ({ plan }: PlanReviewCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const approveMutation = useApprovePlan();
  const rejectMutation = useRejectPlan();

  const handleApprove = () => {
    approveMutation.mutate(plan.id, {
      onSuccess: () => {
        notifications.show({
          title: "Plan approved",
          message: `Plan for ${plan.athlete_name || "athlete"} has been approved.`,
          color: "green",
        });
      },
      onError: (error: any) => {
        notifications.show({
          title: "Approval failed",
          message: error?.response?.data?.detail || "Failed to approve plan",
          color: "red",
        });
      },
    });
  };

  const handleReject = (notes: string) => {
    rejectMutation.mutate(
      { planId: plan.id, rejectionNotes: notes },
      {
        onSuccess: () => {
          setRejectOpen(false);
          notifications.show({
            title: "Plan rejected",
            message: "A new plan version will be generated with your feedback.",
            color: "orange",
          });
        },
        onError: (error: any) => {
          notifications.show({
            title: "Rejection failed",
            message: error?.response?.data?.detail || "Failed to reject plan",
            color: "red",
          });
        },
      }
    );
  };

  const planData = plan.plan_data;
  const days = planData?.days || [];
  const riskScore = plan.injury_risk_score;
  const riskFactors = plan.injury_risk_factors || [];

  return (
    <>
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="sm">
          <Box>
            <Title order={4}>{plan.athlete_name || "Unknown Athlete"}</Title>
            <Text size="sm" c="dimmed">
              {formatDate(plan.week_start)} - {formatDate(plan.week_end)} | Phase:{" "}
              {plan.training_phase || "N/A"}
              {plan.version > 1 ? ` | v${plan.version}` : ""}
            </Text>
          </Box>
          <Badge color={riskColor(riskScore)} size="lg" variant="light">
            {riskLabel(riskScore)} Risk
            {riskScore != null ? ` (${(riskScore * 100).toFixed(0)}%)` : ""}
          </Badge>
        </Group>

        {/* Injury risk warning for moderate+ risk */}
        {riskScore != null && riskScore >= 0.3 && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title="Elevated Injury Risk"
            color={riskScore >= 0.6 ? "red" : "yellow"}
            mb="sm"
          >
            <Text size="sm">
              {riskFactors.length > 0
                ? `Contributing factors: ${riskFactors.join(", ")}`
                : "Elevated injury risk detected. Review plan carefully."}
            </Text>
          </Alert>
        )}

        {/* Expand/collapse button */}
        <Button
          variant="subtle"
          size="xs"
          onClick={() => setExpanded(!expanded)}
          leftSection={expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          mb="sm"
        >
          {expanded ? "Hide" : "Show"} Day-by-Day Detail
        </Button>

        {/* Expandable day-by-day breakdown */}
        <Collapse in={expanded}>
          <Stack gap="md" mb="md">
            {days.map((day: any, dayIdx: number) => (
              <Card key={dayIdx} withBorder radius="sm" p="sm" bg="gray.0">
                <Group justify="space-between" mb="xs">
                  <Text fw={600}>{day.day_name || `Day ${dayIdx + 1}`}</Text>
                  <Group gap="xs">
                    {day.session_type && (
                      <Badge size="sm" variant="outline">
                        {day.session_type}
                      </Badge>
                    )}
                  </Group>
                </Group>
                {day.title && (
                  <Text size="sm" c="dimmed" mb="xs">
                    {day.title}
                  </Text>
                )}

                {/* Render each section: warm_up, main, accessory, cool_down */}
                {["warm_up", "main", "accessory", "cool_down"].map((section) => {
                  const exercises = day[section];
                  if (!exercises || !Array.isArray(exercises) || exercises.length === 0)
                    return null;
                  const sectionLabel = section
                    .replace("_", " ")
                    .replace(/\b\w/g, (c: string) => c.toUpperCase());
                  return (
                    <Box key={section} mb="xs">
                      <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
                        {sectionLabel}
                      </Text>
                      <Table fz="xs" withRowBorders={false}>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Exercise</Table.Th>
                            <Table.Th ta="right">Sets</Table.Th>
                            <Table.Th ta="right">Reps</Table.Th>
                            <Table.Th ta="right">Weight</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {exercises.map((ex: any, exIdx: number) => (
                            <Table.Tr key={exIdx}>
                              <Table.Td>
                                <Text size="sm">{ex.exercise_name || ex.name || "---"}</Text>
                              </Table.Td>
                              <Table.Td ta="right">
                                <Text size="sm">{ex.sets ?? "-"}</Text>
                              </Table.Td>
                              <Table.Td ta="right">
                                <Text size="sm">{ex.reps ?? ex.duration ?? "-"}</Text>
                              </Table.Td>
                              <Table.Td ta="right">
                                <Text size="sm">
                                  {ex.weight ? `${ex.weight}kg` : ex.intensity || "-"}
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Box>
                  );
                })}

                {/* Handle rest days */}
                {day.session_type === "rest" && !day.warm_up && !day.main && (
                  <Text size="sm" c="dimmed" fs="italic">
                    Rest day - active recovery recommended
                  </Text>
                )}
              </Card>
            ))}
            {days.length === 0 && (
              <Text c="dimmed" ta="center">
                No day-by-day data available for this plan.
              </Text>
            )}
          </Stack>
        </Collapse>

        {/* Action buttons */}
        <Group justify="flex-end" gap="sm">
          <Button
            variant="outline"
            color="red"
            leftSection={<IconX size={14} />}
            onClick={() => setRejectOpen(true)}
            loading={rejectMutation.isPending}
            disabled={approveMutation.isPending}
          >
            Reject
          </Button>
          <Button
            color="green"
            leftSection={<IconCheck size={14} />}
            onClick={handleApprove}
            loading={approveMutation.isPending}
            disabled={rejectMutation.isPending}
          >
            Approve
          </Button>
        </Group>
      </Card>

      <RejectFeedbackModal
        opened={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={handleReject}
        loading={rejectMutation.isPending}
      />
    </>
  );
};

export default PlanReviewCard;
