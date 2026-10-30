import type { Meta, StoryObj } from "@storybook/react";
import { ColorSchemeToggle } from "./ColorSchemeToggle";

const meta: Meta<typeof ColorSchemeToggle> = {
  title: "UI/ColorSchemeToggle",
  component: ColorSchemeToggle,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Theme toggle that flips Mantine between light and dark mode. Renders a sun in dark mode and a moon in light mode. Use the toolbar at the top of the canvas to preview both themes.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ColorSchemeToggle>;

export const Default: Story = {};
