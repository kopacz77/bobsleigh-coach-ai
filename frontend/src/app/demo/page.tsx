"use client";

import { Container, Paper, Stack, Text, Title } from "@mantine/core";

export default function DemoPage() {
  return (
    <Container size="md" py="xl">
      <Paper p="xl" radius="md" withBorder>
        <Stack gap="md" ta="center">
          <Title order={1}>Demo Page</Title>
          <Text size="lg" c="dimmed">
            Coming soon - this page will showcase the adaptive training AI capabilities.
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
}
