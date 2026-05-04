"use client";

import { Group, Loader, Stack, Text, Title } from "@mantine/core";
import React from "react";

import { usePendingPlans } from "@/hooks/usePlans";

import GenerateAllButton from "./GenerateAllButton";
import PlanReviewCard from "./PlanReviewCard";

const CoachPlanQueue = () => {
  const { data: plans, isLoading, error } = usePendingPlans();

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={3}>Plan Review Queue</Title>
        <GenerateAllButton />
      </Group>

      {isLoading && (
        <Stack align="center" py="xl">
          <Loader size="md" />
          <Text c="dimmed">Loading pending plans...</Text>
        </Stack>
      )}

      {error && (
        <Text c="red" ta="center" py="xl">
          Failed to load pending plans. Please try again.
        </Text>
      )}

      {!isLoading && !error && (!plans || plans.length === 0) && (
        <Text c="dimmed" ta="center" py="xl">
          No plans pending review. Use &quot;Generate All Plans&quot; to create plans for your
          athletes.
        </Text>
      )}

      {!isLoading &&
        plans &&
        plans.length > 0 &&
        plans.map((plan: any) => <PlanReviewCard key={plan.id} plan={plan} />)}
    </Stack>
  );
};

export default CoachPlanQueue;
