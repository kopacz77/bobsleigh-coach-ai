"use client";

import { ActionIcon, Tooltip, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === "dark" ? "light" : "dark");
  };

  return (
    <Tooltip label={computedColorScheme === "dark" ? "Light mode" : "Dark mode"}>
      <ActionIcon
        onClick={toggleColorScheme}
        variant="subtle"
        size="lg"
        aria-label="Toggle color scheme"
      >
        {computedColorScheme === "dark" ? (
          <IconSun size={20} stroke={1.5} />
        ) : (
          <IconMoon size={20} stroke={1.5} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}
