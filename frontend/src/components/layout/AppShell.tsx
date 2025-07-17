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
  IconSettings,
  IconUser,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavLinkProps {
  icon: ReactNode;
  label: string;
  href: string;
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

  const iconSize = rem(20);
  const navLinks = [
    {
      icon: <IconDashboard size={iconSize} stroke={1.5} />,
      label: "Dashboard",
      href: "/",
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
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text fw={700} size="lg">
            Bobsleigh Coach AI
          </Text>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="md">
        <MantineAppShell.Section grow component={ScrollArea}>
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} active={pathname === link.href} />
          ))}
        </MantineAppShell.Section>

        <MantineAppShell.Section>{/* Footer content if needed */}</MantineAppShell.Section>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  );
}
