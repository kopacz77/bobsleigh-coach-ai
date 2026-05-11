"use client";

import {
  Burger,
  Divider,
  Group,
  NavLink,
  AppShell as MantineAppShell,
  ScrollArea,
  Text,
  ThemeIcon,
  rem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBarbell,
  IconChartBar,
  IconDashboard,
  IconHeart,
  IconLogout,
  IconSettings,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ColorSchemeToggle } from "@/components/ui/ColorSchemeToggle";

interface NavItem {
  icon: typeof IconDashboard;
  label: string;
  href: string;
}

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const pathname = usePathname();
  const { isCoach, user, logout } = useAuth();

  const coachLinks: NavItem[] = [
    { icon: IconDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: IconUsers, label: "Athletes", href: "/athletes" },
    { icon: IconChartBar, label: "Performance", href: "/performance" },
    { icon: IconSettings, label: "Settings", href: "/settings" },
  ];

  const athleteLinks: NavItem[] = [
    { icon: IconDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: IconBarbell, label: "Training", href: "/training" },
    { icon: IconChartBar, label: "Performance", href: "/performance" },
    { icon: IconHeart, label: "Wellbeing", href: "/wellbeing" },
    { icon: IconUser, label: "Profile", href: "/profile" },
    { icon: IconSettings, label: "Settings", href: "/settings" },
  ];

  const navLinks = isCoach ? coachLinks : athleteLinks;

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text
              fw={700}
              size="lg"
              variant="gradient"
              gradient={{ from: "steelBlue.7", to: "steelBlue.5", deg: 135 }}
            >
              Bobsleigh Coach AI
            </Text>
          </Group>
          <Group gap="sm">
            {user?.email && (
              <Text size="sm" c="dimmed" visibleFrom="sm">
                {user.email}
              </Text>
            )}
            <ColorSchemeToggle />
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="sm">
        <MantineAppShell.Section grow component={ScrollArea}>
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <NavLink
                key={link.href}
                component={Link}
                href={link.href}
                label={link.label}
                active={active}
                onClick={close}
                leftSection={
                  <ThemeIcon variant={active ? "light" : "subtle"} size="md" radius="md">
                    <link.icon size={rem(18)} stroke={1.5} />
                  </ThemeIcon>
                }
                styles={{
                  root: {
                    borderRadius: "var(--mantine-radius-md)",
                    marginBottom: 4,
                  },
                }}
              />
            );
          })}
        </MantineAppShell.Section>

        <Divider my="sm" />

        <MantineAppShell.Section>
          <NavLink
            label="Logout"
            onClick={logout}
            leftSection={
              <ThemeIcon variant="subtle" size="md" radius="md" color="red">
                <IconLogout size={rem(18)} stroke={1.5} />
              </ThemeIcon>
            }
            styles={{
              root: {
                borderRadius: "var(--mantine-radius-md)",
              },
            }}
          />
        </MantineAppShell.Section>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  );
}

export default AppShell;
