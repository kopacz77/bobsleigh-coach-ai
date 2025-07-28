import { Button, Container, Group, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";

export default function NotFound() {
  return (
    <Container size="md" py="xl">
      <Stack ta="center" gap="xl" my="xl">
        <Title order={1} size="3rem" ta="center">
          404
        </Title>
        <Title order={2} ta="center">
          Page Not Found
        </Title>

        <Text ta="center" c="dimmed" size="lg">
          The page you are looking for doesn't exist or has been moved.
        </Text>

        <Group>
          <Link href="/" passHref>
            <Button component="a" size="md">
              Back to Dashboard
            </Button>
          </Link>
        </Group>
      </Stack>
    </Container>
  );
}
