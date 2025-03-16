'use client';

import { useState } from 'react';
import {
  Button,
  Container,
  Card,
  Stack,
  TextInput,
  PasswordInput,
  Group,
  Title,
  Text,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBrandGoogle } from '@tabler/icons-react';
import { signInWithGoogle } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError('');
    try {
      // In a real app, you would submit to your API or Supabase directly
      console.log('Login with:', values);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // No need to redirect, Supabase will handle it automatically
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google login');
      setLoading(false);
    }
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
              {error && <Text color="red" size="sm">{error}</Text>}
              
              <TextInput
                label="Email"
                placeholder="your@email.com"
                required
                {...form.getInputProps('email')}
              />
              
              <PasswordInput
                label="Password"
                placeholder="Your password"
                required
                {...form.getInputProps('password')}
              />

              <Button type="submit" mt="xl" loading={loading}>
                Sign in
              </Button>
            </Stack>
          </form>

          <Divider label="Or continue with" labelPosition="center" my="lg" />

          <Group grow>
            <Button
              leftIcon={<IconBrandGoogle size="1rem" />}
              variant="outline"
              onClick={handleGoogleLogin}
              loading={loading}
            >
              Google
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}
