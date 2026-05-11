import { type MantineColorsTuple, createTheme } from "@mantine/core";

/**
 * Design tokens from DESIGN.md applied as Mantine v7 theme.
 *
 * Primary: Steel Blue (#1971C2) -- trust, precision, athletic authority
 * Secondary: Forest Green (#2B8A3E) -- positive outcomes, recovery, targets met
 * Tertiary: Burnt Orange (#E8590C) -- warnings, elevated attention, intensity
 */

const steelBlue: MantineColorsTuple = [
  "#E7F5FF",
  "#D0EBFF",
  "#A5D8FF",
  "#74C0FC",
  "#4DABF7",
  "#339AF0",
  "#228BE6",
  "#1C7ED6",
  "#1971C2",
  "#1864AB",
];

const coaching: MantineColorsTuple = [
  "#E6FCF5",
  "#C3FAE8",
  "#96F2D7",
  "#63E6BE",
  "#38D9A9",
  "#20C997",
  "#12B886",
  "#0CA678",
  "#099268",
  "#087F5B",
];

const intensity: MantineColorsTuple = [
  "#FFF4E6",
  "#FFE8CC",
  "#FFD8A8",
  "#FFC078",
  "#FFA94D",
  "#FF922B",
  "#FD7E14",
  "#F76707",
  "#E8590C",
  "#D9480F",
];

export const theme = createTheme({
  primaryColor: "steelBlue",
  fontFamily:
    "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  headings: {
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
    sizes: {
      h1: { fontSize: "1.875rem", fontWeight: "700", lineHeight: "1.2" },
      h2: { fontSize: "1.5rem", fontWeight: "600", lineHeight: "1.3" },
      h3: { fontSize: "1.25rem", fontWeight: "600", lineHeight: "1.35" },
      h4: { fontSize: "1.125rem", fontWeight: "600", lineHeight: "1.4" },
      h5: { fontSize: "1rem", fontWeight: "600", lineHeight: "1.45" },
      h6: { fontSize: "0.875rem", fontWeight: "600", lineHeight: "1.5" },
    },
  },
  colors: {
    steelBlue,
    coaching,
    intensity,
  },
  defaultRadius: "md",
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        root: {
          fontWeight: 600,
          minHeight: "44px",
        },
      },
    },
    Card: {
      defaultProps: {
        radius: "lg",
        padding: "lg",
        shadow: "sm",
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        input: {
          minHeight: "44px",
        },
      },
    },
    NumberInput: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        input: {
          minHeight: "44px",
        },
      },
    },
    Select: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        input: {
          minHeight: "44px",
        },
      },
    },
    ActionIcon: {
      defaultProps: {
        variant: "subtle",
        radius: "md",
      },
    },
    Paper: {
      defaultProps: {
        radius: "lg",
        shadow: "sm",
      },
    },
  },
});
