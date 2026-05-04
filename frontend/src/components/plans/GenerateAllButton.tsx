"use client";

import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconWand } from "@tabler/icons-react";
import React from "react";

import { useGenerateBatch } from "@/hooks/usePlans";

/**
 * Calculate the next Monday date (or today if today is Monday).
 */
function getNextMonday(): string {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split("T")[0];
}

const GenerateAllButton = () => {
  const generateBatch = useGenerateBatch();

  const handleGenerate = () => {
    const weekStart = getNextMonday();
    generateBatch.mutate(weekStart, {
      onSuccess: (data) => {
        notifications.show({
          title: "Plans generating",
          message: `Plans are being generated for ${data.athlete_count} athletes. Refresh in a moment.`,
          color: "blue",
        });
      },
      onError: (error: any) => {
        notifications.show({
          title: "Generation failed",
          message: error?.response?.data?.detail || "Failed to generate plans",
          color: "red",
        });
      },
    });
  };

  return (
    <Button
      leftSection={<IconWand size={16} />}
      onClick={handleGenerate}
      loading={generateBatch.isPending}
    >
      Generate All Plans
    </Button>
  );
};

export default GenerateAllButton;
