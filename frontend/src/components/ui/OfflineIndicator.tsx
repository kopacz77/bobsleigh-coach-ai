"use client";

import { Badge, Group } from "@mantine/core";
import { IconCloudOff, IconCloudUpload } from "@tabler/icons-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";

/**
 * Compact, non-intrusive offline/sync status indicator.
 *
 * States:
 *   - offline:                        amber "Offline" badge
 *   - online with pendingCount > 0:   blue "Syncing N workout(s)..." badge
 *   - online with no queued items:    renders nothing
 */
export function OfflineIndicator() {
  const { isOnline, pendingCount } = useOfflineSync();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  if (!isOnline) {
    return (
      <Group justify="flex-end" gap="xs">
        <Badge
          color="orange"
          variant="filled"
          size="md"
          leftSection={<IconCloudOff size={14} />}
          aria-label="Offline mode"
        >
          {pendingCount > 0 ? `Offline -- ${pendingCount} pending` : "Offline"}
        </Badge>
      </Group>
    );
  }

  // Online, but pending items still queued (sync in progress / failed earlier)
  return (
    <Group justify="flex-end" gap="xs">
      <Badge
        color="blue"
        variant="light"
        size="md"
        leftSection={<IconCloudUpload size={14} />}
        aria-label={`Syncing ${pendingCount} workout${pendingCount === 1 ? "" : "s"}`}
      >
        {`Syncing ${pendingCount} workout${pendingCount === 1 ? "" : "s"}...`}
      </Badge>
    </Group>
  );
}
