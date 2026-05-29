import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

import { MantineProvider } from "@mantine/core";
import type { Preview } from "@storybook/react";
import React from "react";
import { theme } from "../src/styles/theme";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
        ],
      },
    },
  },
  globalTypes: {
    colorScheme: {
      description: "Mantine color scheme",
      defaultValue: "light",
      toolbar: {
        title: "Color scheme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const colorScheme = (context.globals.colorScheme as "light" | "dark") ?? "light";
      return (
        <MantineProvider theme={theme} forceColorScheme={colorScheme}>
          <div style={{ padding: "1.5rem" }}>
            <Story />
          </div>
        </MantineProvider>
      );
    },
  ],
};

export default preview;
