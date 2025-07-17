import { createTheme } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "blue",
  fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  headings: {
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
    sizes: {
      h1: { fontSize: "2.25rem", fontWeight: "700" },
      h2: { fontSize: "1.875rem", fontWeight: "600" },
      h3: { fontSize: "1.5rem", fontWeight: "600" },
      h4: { fontSize: "1.25rem", fontWeight: "600" },
      h5: { fontSize: "1.125rem", fontWeight: "600" },
      h6: { fontSize: "1rem", fontWeight: "600" },
    },
  },
  colors: {
    // Custom brand colors
    brand: [
      "#F0F5FF",
      "#D6E4FF",
      "#ADC8FF",
      "#84A9FF",
      "#6690FF",
      "#4671F6",
      "#3355CC",
      "#2644A3",
      "#1B377A",
      "#102851",
    ],
  },
  components: {
    // Configure global component styles here
  },
});
