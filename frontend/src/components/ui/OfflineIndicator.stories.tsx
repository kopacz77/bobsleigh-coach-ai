import { Badge, Group } from "@mantine/core";
import { IconCloudOff, IconCloudUpload } from "@tabler/icons-react";
import type { Meta, StoryObj } from "@storybook/react";

/**
 * Presentational shell of OfflineIndicator that takes props directly instead of
 * reading from useOfflineSync. The real component lives at OfflineIndicator.tsx
 * and pulls state from the Dexie-backed hook; this story renders the same
 * markup so the visual variants can be reviewed in isolation.
 */
interface OfflineIndicatorPreviewProps {
  isOnline: boolean;
  pendingCount: number;
}

function OfflineIndicatorPreview({ isOnline, pendingCount }: OfflineIndicatorPreviewProps) {
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

const meta: Meta<typeof OfflineIndicatorPreview> = {
  title: "UI/OfflineIndicator",
  component: OfflineIndicatorPreview,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Visual states for OfflineIndicator: amber when offline, blue while syncing, hidden when fully synced. The real component reads from useOfflineSync; this story renders presentational equivalents driven by props.",
      },
    },
  },
  argTypes: {
    pendingCount: { control: { type: "number", min: 0, max: 25 } },
  },
};

export default meta;
type Story = StoryObj<typeof OfflineIndicatorPreview>;

export const OfflineWithoutQueue: Story = {
  args: { isOnline: false, pendingCount: 0 },
};

export const OfflineWithQueue: Story = {
  args: { isOnline: false, pendingCount: 3 },
};

export const Syncing: Story = {
  args: { isOnline: true, pendingCount: 2 },
};

export const SyncingSingle: Story = {
  args: { isOnline: true, pendingCount: 1 },
};

export const FullySynced: Story = {
  args: { isOnline: true, pendingCount: 0 },
};
