"use client";

import {
  Badge,
  Card,
  Center,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useCoachReadiness } from "@/hooks/useWellbeing";

interface ReadinessAthlete {
  athlete_id: string;
  athlete_name: string;
  readiness_score: number | null;
  recovery_status: "green" | "yellow" | "red" | "gray";
  has_concern: boolean;
  last_checkin_date: string | null;
}

const STATUS_ORDER: Record<string, number> = {
  red: 0,
  yellow: 1,
  gray: 2,
  green: 3,
};

const STATUS_LABEL: Record<string, string> = {
  green: "Ready",
  yellow: "Caution",
  red: "Rest",
  gray: "No Check-in",
};

const STATUS_BADGE_COLOR: Record<string, string> = {
  green: "green",
  yellow: "yellow",
  red: "red",
  gray: "gray",
};

export default function CoachReadiness() {
  const theme = useMantineTheme();
  const { data, isLoading } = useCoachReadiness();

  if (isLoading) {
    return (
      <Card withBorder p="md" radius="md">
        <Center h={200}>
          <Loader />
        </Center>
      </Card>
    );
  }

  const athletes: ReadinessAthlete[] = data ?? [];

  // Sort: red first, then yellow, then gray, then green
  const sorted = [...athletes].sort(
    (a, b) => (STATUS_ORDER[a.recovery_status] ?? 4) - (STATUS_ORDER[b.recovery_status] ?? 4)
  );

  const dotColor = (status: string) => {
    switch (status) {
      case "green":
        return theme.colors.green[6];
      case "yellow":
        return theme.colors.yellow[6];
      case "red":
        return theme.colors.red[6];
      default:
        return theme.colors.gray[4];
    }
  };

  return (
    <Card withBorder p="md" radius="md">
      <Stack gap="xs" mb="md">
        <Title order={4}>Athlete Readiness</Title>
        <Text size="sm" c="dimmed">
          Today&apos;s wellness status
        </Text>
      </Stack>

      {sorted.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No athletes found
        </Text>
      ) : (
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Athlete</Table.Th>
              <Table.Th>Readiness</Table.Th>
              <Table.Th>Score</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Concerns</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sorted.map((athlete) => (
              <Table.Tr key={athlete.athlete_id}>
                <Table.Td>
                  <Text fw={500} size="sm">
                    {athlete.athlete_name}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      backgroundColor: dotColor(athlete.recovery_status),
                    }}
                  />
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {athlete.recovery_status === "gray" ? "-" : athlete.readiness_score}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={STATUS_BADGE_COLOR[athlete.recovery_status] ?? "gray"}
                    variant="light"
                  >
                    {STATUS_LABEL[athlete.recovery_status] ?? "Unknown"}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {athlete.has_concern ? (
                    <Tooltip label="Injury/concern flagged">
                      <Group gap={4}>
                        <IconAlertTriangle size={16} color={theme.colors.red[6]} />
                      </Group>
                    </Tooltip>
                  ) : (
                    <Text size="sm" c="dimmed">
                      -
                    </Text>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}
