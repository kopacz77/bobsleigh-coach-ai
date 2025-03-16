import React, { useState, useEffect } from 'react';
import {
  AppShell as MantineAppShell,
  Navbar,
  Header,
  Footer,
  Aside,
  Text,
  MediaQuery,
  Burger,
  useMantineTheme,
  Group,
  Box,
  UnstyledButton,
  ThemeIcon,
  Avatar,
  Menu,
  Divider,
  Button
} from '@mantine/core';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  IconDashboard,
  IconCalendarEvent,
  IconChartBar,
  IconClipboardText,
  IconUsers,
  IconSettings,
  IconLogout,
  IconBell,
  IconChevronRight
} from '@tabler/icons-react';

// Import app logo
import appLogo from '../../../public/images/logo.png';

/**
 * AppShell component provides the main layout for the application with
 * navigation, header, and footer
 */
const AppShell = ({ children, userProfile, onSignOut }) => {
  const theme = useMantineTheme();
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [opened, setOpened] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Check if user is on the auth pages or onboarding
  const isAuthPage = router.pathname.includes('/auth/');
  const isOnboarding = router.pathname.includes('/onboarding');

  // If on auth page or onboarding, don't show the full layout
  if (isAuthPage || isOnboarding) {
    return <>{children}</>;
  }

  // Navigation items
  const athleteNavItems = [
    { label: 'Dashboard', icon: IconDashboard, href: '/dashboard' },
    { label: 'Training Schedule', icon: IconCalendarEvent, href: '/workouts' },
    { label: 'Check-Ins', icon: IconClipboardText, href: '/check-in' },
    { label: 'Performance', icon: IconChartBar, href: '/performance' },
    { label: 'Settings', icon: IconSettings, href: '/settings' },
  ];

  const coachNavItems = [
    { label: 'Dashboard', icon: IconDashboard, href: '/dashboard' },
    { label: 'Athletes', icon: IconUsers, href: '/athletes' },
    { label: 'Training Programs', icon: IconCalendarEvent, href: '/training-programs' },
    { label: 'Performance Data', icon: IconChartBar, href: '/performance-data' },
    { label: 'Settings', icon: IconSettings, href: '/settings' },
  ];

  // Determine which nav items to show based on user role
  const navItems = userProfile?.role === 'coach' ? coachNavItems : athleteNavItems;

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (onSignOut) {
      onSignOut();
    }
    router.push('/auth/signin');
  };

  // Navigation links
  const NavLink = ({ icon: Icon, label, href }) => {
    const isActive = router.pathname === href;
    
    return (
      <UnstyledButton
        sx={(theme) => ({
          display: 'block',
          width: '100%',
          padding: theme.spacing.xs,
          borderRadius: theme.radius.sm,
          color: isActive ? theme.colors.blue[7] : theme.colors.gray[7],
          backgroundColor: isActive ? theme.colors.blue[0] : 'transparent',
          '&:hover': {
            backgroundColor: theme.colors.gray[0],
          },
        })}
        onClick={() => router.push(href)}
      >
        <Group>
          <ThemeIcon 
            size={30} 
            variant={isActive ? 'filled' : 'light'}
            color={isActive ? 'blue' : 'gray'}
          >
            <Icon size={18} />
          </ThemeIcon>
          <Text weight={isActive ? 600 : 500}>{label}</Text>
        </Group>
      </UnstyledButton>
    );
  };

  return (
    <MantineAppShell
      styles={{
        main: {
          background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      }}
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      navbar={
        <Navbar p="md" hiddenBreakpoint="sm" hidden={!opened} width={{ sm: 250, lg: 300 }}>
          <Navbar.Section grow mt="md">
            <Box px="xs">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                />
              ))}
            </Box>
          </Navbar.Section>
          
          <Navbar.Section>
            <Divider my="sm" />
            
            <Group position="apart" px="xs">
              <Avatar 
                src={userProfile?.avatarUrl} 
                radius="xl"
                color="blue"
                size="md"
              >
                {userProfile?.firstName?.charAt(0)}{userProfile?.lastName?.charAt(0)}
              </Avatar>
              
              <Menu position="top-end">
                <Menu.Target>
                  <Box sx={{ flex: 1 }}>
                    <Text size="sm" weight={500}>
                      {userProfile?.firstName} {userProfile?.lastName}
                    </Text>
                    <Text size="xs" color="dimmed">
                      {userProfile?.email}
                    </Text>
                  </Box>
                </Menu.Target>
                
                <Menu.Dropdown>
                  <Menu.Item icon={<IconSettings size={14} />}>Settings</Menu.Item>
                  <Menu.Item 
                    icon={<IconLogout size={14} />}
                    onClick={handleSignOut}
                  >
                    Sign out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Navbar.Section>
        </Navbar>
      }
      header={
        <Header height={70} p="md">
          <div style={{ display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'space-between' }}>
            <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
              <Burger
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                color={theme.colors.gray[6]}
                mr="xl"
              />
            </MediaQuery>

            <Group>
              <Image
                src="/images/logo.png"
                alt="Bobsleigh Coach AI"
                width={40}
                height={40}
              />
              <Text size="lg" weight={700} color="blue">Bobsleigh Coach AI</Text>
            </Group>

            <Group>
              <Menu position="bottom-end">
                <Menu.Target>
                  <Button variant="subtle" p={0}>
                    <IconBell size={20} />
                  </Button>
                </Menu.Target>
                
                <Menu.Dropdown>
                  <Menu.Label>Notifications</Menu.Label>
                  {notifications && notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                      <Menu.Item key={index}>
                        {notification.message}
                      </Menu.Item>
                    ))
                  ) : (
                    <Menu.Item disabled>No new notifications</Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
              
              <MediaQuery smallerThan="sm" styles={{ display: 'none' }}>
                <Avatar 
                  src={userProfile?.avatarUrl} 
                  radius="xl" 
                  size="sm"
                  color="blue"
                >
                  {userProfile?.firstName?.charAt(0)}{userProfile?.lastName?.charAt(0)}
                </Avatar>
              </MediaQuery>
            </Group>
          </div>
        </Header>
      }
      footer={
        <Footer height={60} p="md">
          <Group position="apart" style={{ height: '100%' }}>
            <Text size="sm" color="dimmed">
              © 2025 Bobsleigh Coach AI. All rights reserved.
            </Text>
            <Text size="sm" color="dimmed">
              Version 1.0.0
            </Text>
          </Group>
        </Footer>
      }
    >
      {children}
    </MantineAppShell>
  );
};

export default AppShell;