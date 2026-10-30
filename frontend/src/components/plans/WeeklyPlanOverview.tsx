"use client";

import { Badge, Card, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { IconCalendarOff, IconClock, IconMoon } from "@tabler/icons-react";

import { useCurrentPlan } from "@/hooks/usePlans";
import { InjuryRiskBanner } from "./InjuryRiskBanner";

// ---- Types matching backend response ----

interface PlanDay {
  day_number: number;
  day_name: string;
  date?: string;
  is_rest_day: boolean;
  session_type: string | null;
  title: string;
  estimated_duration_minutes: number;
  target_rpe: number;
  target_intensity: string;
}

interface PlanData {
  training_phase?: string;
  days?: PlanDay[];
}

interface CurrentPlan {
  id: string;
  week_start: string;
  week_end: string;
  training_phase: string;
  plan_data: PlanData;
  injury_risk_score?: number;
  injury_risk_factors?: string[];
  status: string;
}

// ---- Helpers ----

const SESSION_TYPE_COLORS: Record<string, string> = {
  strength: "violet",
  power: "orange",
  speed: "green",
  endurance: "blue",
  recovery: "teal",
  technique: "cyan",
};

const PHASE_LABELS: Record<string, string> = {
  general_prep: "General Preparation",
  specific_prep: "Specific Preparation",
  pre_competition: "Pre-Competition",
  competition: "Competition",
  transition: "Transition",
};

function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return dateStr === `${yyyy}-${mm}-${dd}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function riskLevelFromScore(score: number): string {
  if (score >= 0.6) return "high";
  if (score >= 0.3) return "moderate";
  return "low";
}

// ---- Day Card ----

function DayCard({ day }: { day: PlanDay }) {
  const today = isToday(day.date);

  return (
    <Card
      withBorder
      shadow={today ? "sm" : "xs"}
      radius="md"
      p="sm"
      style={{
        borderLeft: today
          ? "4px solid var(--mantine-color-blue-5)"
          : day.is_rest_day
            ? "4px solid var(--mantine-color-gray-3)"
            : "4px solid var(--mantine-color-green-5)",
        opacity: day.is_rest_day ? 0.8 : 1,
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={2}>
          <Group gap="xs">
            <Text fw={today ? 700 : 500} size="sm">
              {day.day_name}
            </Text>
            {day.date && (
              <Text size="sm" c="dimmed">
                {formatDate(day.date)}
              </Text>
            )}
            {today && (
              <Badge size="xs" variant="filled" color="blue">
                Today
              </Badge>
            )}
          </Group>
          <Text
            size="sm"
            c={day.is_rest_day ? "dimmed" : undefined}
            fs={day.is_rest_day ? "italic" : undefined}
          >
            {day.title}
          </Text>
        </Stack>

        <Group gap="xs" wrap="nowrap">
          {day.is_rest_day ? (
            <Badge variant="light" color="gray" leftSection={<IconMoon size={12} />}>
              Rest
            </Badge>
          ) : (
            <>
              {day.session_type && (
                <Badge
                  variant="light"
                  color={SESSION_TYPE_COLORS[day.session_type] ?? "gray"}
                  size="sm"
                >
                  {day.session_type}
                </Badge>
              )}
              {day.estimated_duration_minutes > 0 && (
                <Badge variant="outline" size="sm" leftSection={<IconClock size={12} />}>
                  {day.estimated_duration_minutes}m
                </Badge>
              )}
              {day.target_rpe > 0 && (
                <Badge variant="outline" size="sm" color="orange">
                  RPE {day.target_rpe}
                </Badge>
              )}
            </>
          )}
        </Group>
      </Group>
    </Card>
  );
}

// ---- Main Component ----

/**
 * Athlete-facing weekly plan overview.
 *
 * Uses useCurrentPlan() to fetch the approved plan for the current week.
 * Shows all 7 days in a vertical stack with today highlighted.
 * Displays training phase badge and injury risk banner when applicable.
 */
export function WeeklyPlanOverview() {
  const { data, isLoading, isError } = useCurrentPlan();

  // Loading state
  if (isLoading) {
    return (
      <Stack align="center" gap="md" py="xl">
        <Loader size="md" />
        <Text c="dimmed" size="sm">
          Loading your weekly plan...
        </Text>
      </Stack>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card withBorder p="lg" radius="md">
        <Text c="red" ta="center">
          Failed to load weekly plan. Please try refreshing.
        </Text>
      </Card>
    );
  }

  // No plan / 204 state
  if (!data) {
    return (
      <Card withBorder p="lg" radius="md">
        <Stack align="center" gap="sm">
          <IconCalendarOff size={40} color="var(--mantine-color-gray-5)" />
          <Title order={4}>No Plan This Week</Title>
          <Text c="dimmed" ta="center" size="sm">
            No approved plan for the current week. Your coach will generate and approve one soon.
          </Text>
        </Stack>
      </Card>
    );
  }

  const plan = data as CurrentPlan;
  const planData = plan.plan_data ?? {};
  const days = planData.days ?? [];
  const phase = plan.training_phase || planData.training_phase;
  const riskScore = plan.injury_risk_score ?? 0;
  const riskLevel = riskLevelFromScore(riskScore);
  const riskFactors = plan.injury_risk_factors ?? [];

  return (
    <Stack gap="md">
      {/* Training phase badge */}
      {phase && (
        <Group justify="space-between" wrap="wrap">
          <Badge variant="filled" size="lg" color="blue">
            {PHASE_LABELS[phase] || phase}
          </Badge>
          <Text size="sm" c="dimmed">
            {plan.week_start} to {plan.week_end}
          </Text>
        </Group>
      )}

      {/* Injury risk banner */}
      <InjuryRiskBanner riskScore={riskScore} riskLevel={riskLevel} riskFactors={riskFactors} />

      {/* 7-day vertical stack */}
      <Stack gap="xs">
        {days.map((day) => (
          <DayCard key={day.day_number} day={day} />
        ))}
      </Stack>

      {days.length === 0 && (
        <Text c="dimmed" ta="center" fs="italic" size="sm">
          This plan has no day entries. Contact your coach.
        </Text>
      )}
    </Stack>
  );
}
