'use client';

import { Button, Container, Stack, Text, Title } from '@mantine/core';

export function Welcome() {
  return (
    <Container>
      <Stack gap="xl" my="xl">
        <Title order={1}>Welcome to Bobsleigh Coach AI</Title>
        <Text>
          An AI-powered training application for bobsleigh athletes with personalized recommendations
          and performance tracking.
        </Text>
        <Button size="lg">Get Started</Button>
      </Stack>
    </Container>
  );
}
