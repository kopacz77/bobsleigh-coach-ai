"use client";

import {
  Anchor,
  Button,
  Card,
  Container,
  Divider,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconBrandGoogle } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) => (value.length >= 6 ? null : "Password must be at least 6 characters"),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError("");
    try {
      const result = await login(values.email, values.password);
      if (result?.error) {
        const err = result.error as { message?: string };
        setError(err.message ?? "Login failed");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred during login";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred during Google login";
      setError(message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = form.values.email;
    if (!email || !/^\S+@\S+$/.test(email)) {
      setError("Please enter a valid email address first");
      return;
    }
    setResetSent(true);
    setError("");
  };

  return (
    <Container size="xs" py="xl">
      <Card withBorder shadow="md" p="xl" radius="md">
        <Stack>
          <Title order={2} ta="center" mt="md" mb="md">
            Bobsleigh Coach AI
          </Title>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              {error && (
                <Text c="red" size="sm">
                  {error}
                </Text>
              )}

              {resetSent && (
                <Text c="green" size="sm">
                  Check your email for a password reset link.
                </Text>
              )}

              <TextInput
                label="Email"
                placeholder="your@email.com"
                required
                {...form.getInputProps("email")}
              />

              <PasswordInput
                label="Password"
                placeholder="Your password"
                required
                {...form.getInputProps("password")}
              />

              <Group justify="flex-end">
                <Anchor component="button" type="button" size="sm" onClick={handleForgotPassword}>
                  Forgot password?
                </Anchor>
              </Group>

              <Button type="submit" mt="sm" loading={loading}>
                Sign in
              </Button>
            </Stack>
          </form>

          <Divider label="Or continue with" labelPosition="center" my="lg" />

          <Group grow>
            <Button
              leftSection={<IconBrandGoogle size="1rem" />}
              variant="outline"
              onClick={handleGoogleLogin}
              loading={loading}
            >
              Google
            </Button>
          </Group>

          <Text ta="center" size="sm" mt="md">
            Don&apos;t have an account?{" "}
            <Anchor component={Link} href="/auth/signup">
              Sign up
            </Anchor>
          </Text>
        </Stack>
      </Card>
    </Container>
  );
}
