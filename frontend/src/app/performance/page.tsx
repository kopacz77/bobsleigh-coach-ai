import { Container, Paper, Text, Title } from "@mantine/core";
import React from "react";
import { PerformanceAssessment } from "../../components/performance";

/**
 * Performance Assessment Page
 * This page demonstrates how to use the performance assessment component
 */
export default function PerformancePage() {
  // In a real application, this would come from your auth context
  const currentUserId = "123e4567-e89b-12d3-a456-426614174000";

  return (
    <Container size="xl" py="xl">
      <Paper p="md" radius="md" withBorder mb="xl">
        <Title order={1} mb="sm">
          Performance Metrics & Assessments
        </Title>
        <Text c="dimmed" mb="xl">
          Track your performance metrics, set targets, and analyze progress over time.
        </Text>
      </Paper>

      <PerformanceAssessment userId={currentUserId} />
    </Container>
  );
}
