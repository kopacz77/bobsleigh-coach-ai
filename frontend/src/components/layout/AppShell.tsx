"use client";

import {
  Burger,
  Group,
  AppShell as MantineAppShell,
  rem,
  ScrollArea,
  Text,
  UnstyledButton,
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

interface NavLinkItem {
  icon: ReactNode;
  label: string;
  href: string;
}

interface NavLinkProps extends NavLinkItem {
  active?: boolean;
}

function NavLink({ icon, label, active, href }: NavLinkProps) {
  return (
    <Link href={href} passHref style={{ textDecoration: "none" }}>
      <UnstyledButton
        w="100%"
        p="md"
        style={{
          borderRadius: "6px",
          backgroundColor: active ? "var(--mantine-color-blue-light)" : "transparent",
          color: active ? "var(--mantine-color-blue-filled)" : "inherit",
        }}
      >
        <Group>
          {icon}
          <Text size="sm">{label}</Text>
        </Group>
      </UnstyledButton>
    </Link>
  );
}

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [opened, { toggle }] = useDisclosure(false);
  const pathname = usePathname();
  const { isCoach, user, logout } = useAuth();

  const iconSize = rem(20);

  const coachLinks: NavLinkItem[] = [
    {
      icon: <IconDashboard size={iconSize} stroke={1.5} />,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: <IconUsers size={iconSize} stroke={1.5} />,
      label: "Athletes",
      href: "/athletes",
    },
    {
      icon: <IconChartBar size={iconSize} stroke={1.5} />,
      label: "Performance",
      href: "/performance",
    },
    {
      icon: <IconSettings size={iconSize} stroke={1.5} />,
      label: "Settings",
      href: "/settings",
    },
  ];

  const athleteLinks: NavLinkItem[] = [
    {
      icon: <IconDashboard size={iconSize} stroke={1.5} />,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: <IconBarbell size={iconSize} stroke={1.5} />,
      label: "Training",
      href: "/training",
    },
    {
      icon: <IconChartBar size={iconSize} stroke={1.5} />,
      label: "Performance",
      href: "/performance",
    },
    {
      icon: <IconHeart size={iconSize} stroke={1.5} />,
      label: "Wellbeing",
      href: "/wellbeing",
    },
    {
      icon: <IconUser size={iconSize} stroke={1.5} />,
      label: "Profile",
      href: "/profile",
    },
    {
      icon: <IconSettings size={iconSize} stroke={1.5} />,
      label: "Settings",
      href: "/settings",
    },
  ];

  const navLinks = isCoach ? coachLinks : athleteLinks;

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg">
              Bobsleigh Coach AI
            </Text>
          </Group>
          {user?.email && (
            <Text size="sm" c="dimmed">
              {user.email}
            </Text>
          )}
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="md">
        <MantineAppShell.Section grow component={ScrollArea}>
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} active={pathname === link.href} />
          ))}
        </MantineAppShell.Section>

        <MantineAppShell.Section>
          <UnstyledButton
            w="100%"
            p="md"
            onClick={logout}
            style={{
              borderRadius: "6px",
            }}
          >
            <Group>
              <IconLogout size={iconSize} stroke={1.5} />
              <Text size="sm">Logout</Text>
            </Group>
          </UnstyledButton>
        </MantineAppShell.Section>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  );
}

export default AppShell;
