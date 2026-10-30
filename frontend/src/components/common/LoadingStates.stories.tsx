import { Stack } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react";
import { AIProcessingLoader } from "./LoadingStates";

const meta: Meta<typeof AIProcessingLoader> = {
  title: "Common/AIProcessingLoader",
  component: AIProcessingLoader,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Animated four-stage progress loader for AI plan generation: analyzing → adapting → generating → complete. Each stage advances the progress bar and shows a contextual message.",
      },
    },
  },
  argTypes: {
    stage: {
      control: "radio",
      options: ["analyzing", "adapting", "generating", "complete"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof AIProcessingLoader>;

export const Analyzing: Story = {
  args: { stage: "analyzing" },
};

export const Adapting: Story = {
  args: { stage: "adapting" },
};

export const Generating: Story = {
  args: { stage: "generating" },
};

export const Complete: Story = {
  args: { stage: "complete" },
};

export const AllStages: Story = {
  render: () => (
    <Stack gap="xl">
      <AIProcessingLoader stage="analyzing" />
      <AIProcessingLoader stage="adapting" />
      <AIProcessingLoader stage="generating" />
      <AIProcessingLoader stage="complete" />
    </Stack>
  ),
};
