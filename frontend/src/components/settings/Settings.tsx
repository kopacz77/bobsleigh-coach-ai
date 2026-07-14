"use client";

import { Button, Card, Group, SegmentedControl, Stack, Switch, Text, Title } from "@mantine/core";
import { useState } from "react";
import MFASetup from "./MFASetup"; // Import the MFA component

export function Settings() {
  const [units, setUnits] = useState("metric");
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [dataSharing, setDataSharing] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, you would submit to your API
      console.log("Saving settings:", {
        units,
        notifications,
        emailUpdates,
        dataSharing,
        autoSync,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success message
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap="lg">
      <Card withBorder p={{ base: "sm", md: "md" }} radius="md">
        <Stack>
          <Title order={3} fz={{ base: "md", md: "lg" }}>
            Application Settings
          </Title>

          <Group justify="space-between" wrap="wrap" gap="sm">
            <Text>Units</Text>
            <SegmentedControl
              value={units}
              onChange={setUnits}
              data={[
                { label: "Metric", value: "metric" },
                { label: "Imperial", value: "imperial" },
              ]}
            />
          </Group>

          <Group justify="space-between">
            <Text>Push Notifications</Text>
            <Switch
              checked={notifications}
              onChange={(event) => setNotifications(event.currentTarget.checked)}
              size="md"
            />
          </Group>

          <Group justify="space-between">
            <Text>Email Updates</Text>
            <Switch
              checked={emailUpdates}
              onChange={(event) => setEmailUpdates(event.currentTarget.checked)}
              size="md"
            />
          </Group>
        </Stack>
      </Card>

      <Card withBorder p={{ base: "sm", md: "md" }} radius="md">
        <Stack>
          <Title order={3} fz={{ base: "md", md: "lg" }}>
            Security Settings
          </Title>
          <MFASetup />
        </Stack>
      </Card>

      <Card withBorder p={{ base: "sm", md: "md" }} radius="md">
        <Stack>
          <Title order={3} fz={{ base: "md", md: "lg" }}>
            Data Settings
          </Title>

          <Group justify="space-between" wrap="nowrap" gap="sm">
            <div style={{ flex: 1 }}>
              <Text>Anonymous Data Sharing</Text>
              <Text size="xs" c="dimmed">
                Share anonymous training data to improve AI recommendations
              </Text>
            </div>
            <Switch
              checked={dataSharing}
              onChange={(event) => setDataSharing(event.currentTarget.checked)}
              size="md"
              style={{ flexShrink: 0 }}
            />
          </Group>

          <Group justify="space-between" wrap="nowrap" gap="sm">
            <div style={{ flex: 1 }}>
              <Text>Auto-Sync Data</Text>
              <Text size="xs" c="dimmed">
                Automatically sync data with connected devices
              </Text>
            </div>
            <Switch
              checked={autoSync}
              onChange={(event) => setAutoSync(event.currentTarget.checked)}
              size="md"
              style={{ flexShrink: 0 }}
            />
          </Group>
        </Stack>
      </Card>

      <Button onClick={handleSubmit} loading={isSubmitting} fullWidth>
        Save Settings
      </Button>
    </Stack>
  );
}
