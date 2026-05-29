import { Card, Group, Stack, Text, Title, useMantineTheme } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react";

/**
 * Palette swatch row that renders all 10 shades of a Mantine color tuple.
 */
function PaletteRow({ name, color }: { name: string; color: string }) {
  const theme = useMantineTheme();
  const shades = theme.colors[color] ?? [];

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="baseline">
        <Text fw={600}>{name}</Text>
        <Text size="xs" c="dimmed">
          theme.colors.{color}
        </Text>
      </Group>
      <Group gap={0} wrap="nowrap">
        {shades.map((shade, idx) => (
          <Stack key={shade} gap={4} align="center" style={{ flex: 1 }}>
            <div
              style={{
                width: "100%",
                height: 48,
                backgroundColor: shade,
                border: idx === 0 ? "1px solid var(--mantine-color-gray-3)" : "none",
              }}
            />
            <Text size="xs" c="dimmed">
              {idx}
            </Text>
            <Text size="xs" ff="monospace">
              {shade}
            </Text>
          </Stack>
        ))}
      </Group>
    </Stack>
  );
}

function DesignTokens() {
  return (
    <Stack gap="xl">
      <div>
        <Title order={2}>Design tokens</Title>
        <Text c="dimmed" size="sm" mt="xs">
          Sport-coaching palette from DESIGN.md. Steel blue carries the brand,
          coaching green signals positive outcomes, intensity orange flags load.
        </Text>
      </div>

      <Card withBorder p="lg">
        <Stack gap="xl">
          <PaletteRow name="Steel Blue -- primary" color="steelBlue" />
          <PaletteRow name="Coaching Green -- success / recovery" color="coaching" />
          <PaletteRow name="Intensity Orange -- warnings / load" color="intensity" />
        </Stack>
      </Card>
    </Stack>
  );
}

const meta: Meta<typeof DesignTokens> = {
  title: "Foundations/Design Tokens",
  component: DesignTokens,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Sport-coaching palette from DESIGN.md. Each row shows the full 10-shade tuple registered with Mantine's theme so designers can reference exact shade indices.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DesignTokens>;

export const Palette: Story = {};
