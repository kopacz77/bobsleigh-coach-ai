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
import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { signup, loginWithGoogle } = useAuth();

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length >= 8 ? null : "Password must be at least 8 characters",
      confirmPassword: (value, values) =>
        value === values.password ? null : "Passwords do not match",
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const result = await signup(values.email, values.password);
      if (result?.error) {
        const err = result.error as { message?: string };
        setError(err.message ?? "Sign up failed");
      } else {
        setSuccess(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred during sign up";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An error occurred during Google sign up";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Card withBorder shadow="md" p="xl" radius="md">
        <Stack>
          <Title order={2} ta="center" mt="md" mb="md">
            Create Account
          </Title>
          <Text ta="center" c="dimmed" size="sm" mb="md">
            Sign up for Bobsleigh Coach AI
          </Text>

          {success ? (
            <Stack>
              <Text c="green" size="sm" ta="center">
                Check your email to confirm your account. You can close this page.
              </Text>
              <Text ta="center" size="sm" mt="md">
                Already confirmed?{" "}
                <Anchor component={Link} href="/auth/login">
                  Sign in
                </Anchor>
              </Text>
            </Stack>
          ) : (
            <>
              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                  {error && (
                    <Text c="red" size="sm">
                      {error}
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
                    placeholder="At least 8 characters"
                    required
                    {...form.getInputProps("password")}
                  />

                  <PasswordInput
                    label="Confirm Password"
                    placeholder="Repeat your password"
                    required
                    {...form.getInputProps("confirmPassword")}
                  />

                  <Button type="submit" mt="xl" loading={loading}>
                    Create account
                  </Button>
                </Stack>
              </form>

              <Divider label="Or continue with" labelPosition="center" my="lg" />

              <Group grow>
                <Button
                  leftSection={<IconBrandGoogle size="1rem" />}
                  variant="outline"
                  onClick={handleGoogleSignup}
                  loading={loading}
                >
                  Google
                </Button>
              </Group>

              <Text ta="center" size="sm" mt="md">
                Already have an account?{" "}
                <Anchor component={Link} href="/auth/login">
                  Sign in
                </Anchor>
              </Text>
            </>
          )}
        </Stack>
      </Card>
    </Container>
  );
}
