"use client";

import { Alert, List, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

interface InjuryRiskBannerProps {
  riskScore: number;
  riskLevel: string;
  riskFactors: string[];
}

/**
 * Injury risk warning banner for athletes.
 *
 * Only renders when risk is moderate or high. Shows a colored Alert
 * with bullet-pointed risk factors. Low risk renders nothing.
 */
export function InjuryRiskBanner({ riskScore, riskLevel, riskFactors }: InjuryRiskBannerProps) {
  // Only render for moderate or high risk
  if (riskLevel !== "moderate" && riskLevel !== "high") {
    return null;
  }

  const isHigh = riskLevel === "high";

  return (
    <Alert
      icon={<IconAlertTriangle size={20} />}
      title={isHigh ? "High Injury Risk Warning" : "Elevated Injury Risk"}
      color={isHigh ? "red" : "yellow"}
      variant="light"
      radius="md"
    >
      <Text size="sm" mb="xs">
        Your training load patterns show elevated risk. Your coach has been notified.
      </Text>
      {riskFactors.length > 0 && (
        <List size="sm" spacing={4}>
          {riskFactors.map((factor) => (
            <List.Item key={factor}>{factor}</List.Item>
          ))}
        </List>
      )}
    </Alert>
  );
}
