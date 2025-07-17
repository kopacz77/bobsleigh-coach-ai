"use client";

import {
  Avatar,
  Button,
  Card,
  Group,
  NumberInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useState } from "react";

interface ProfileFormValues {
  first_name: string;
  last_name: string;
  email: string;
  sport: string;
  height: number;
  weight: number;
  birth_date: Date | null;
}

export function ProfileCard() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock profile data - in a real app, this would come from the backend
  const profileData = {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    sport: "Bobsleigh",
    height: 185,
    weight: 85,
    birth_date: new Date("1995-05-15"),
  };

  const form = useForm<ProfileFormValues>({
    initialValues: {
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      email: profileData.email,
      sport: profileData.sport,
      height: profileData.height,
      weight: profileData.weight,
      birth_date: profileData.birth_date,
    },
    validate: {
      first_name: (value) => (value ? null : "First name is required"),
      last_name: (value) => (value ? null : "Last name is required"),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      sport: (value) => (value ? null : "Sport is required"),
    },
  });

  const handleSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      // In a real app, you would submit to your API
      console.log("Updating profile:", values);
      // api.put(`/api/athletes/${profileData.id}`, values);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update successful, exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card withBorder p="xl" radius="md">
      {isEditing ? (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Title order={3}>Edit Profile</Title>

            <Group grow>
              <TextInput
                label="First Name"
                placeholder="First Name"
                required
                {...form.getInputProps("first_name")}
              />

              <TextInput
                label="Last Name"
                placeholder="Last Name"
                required
                {...form.getInputProps("last_name")}
              />
            </Group>

            <TextInput
              label="Email"
              placeholder="Email"
              required
              {...form.getInputProps("email")}
            />

            <TextInput
              label="Sport"
              placeholder="Sport"
              required
              {...form.getInputProps("sport")}
            />

            <Group grow>
              <NumberInput
                label="Height (cm)"
                placeholder="Height"
                min={0}
                {...form.getInputProps("height")}
              />

              <NumberInput
                label="Weight (kg)"
                placeholder="Weight"
                min={0}
                precision={1}
                {...form.getInputProps("weight")}
              />
            </Group>

            <DatePickerInput
              label="Birth Date"
              placeholder="Birth Date"
              {...form.getInputProps("birth_date")}
            />

            <Group position="right" mt="md">
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                Cancel
              </Button>

              <Button type="submit" loading={isSubmitting}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      ) : (
        <Stack>
          <Group position="apart">
            <Group>
              <Avatar size="xl" radius="xl" color="blue">
                {profileData.first_name.charAt(0)}
                {profileData.last_name.charAt(0)}
              </Avatar>

              <div>
                <Title order={3}>
                  {profileData.first_name} {profileData.last_name}
                </Title>
                <Text size="sm" c="dimmed">
                  {profileData.email}
                </Text>
              </div>
            </Group>

            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          </Group>

          <Card withBorder mt="md">
            <Stack>
              <Title order={4}>Athlete Information</Title>

              <Group position="apart">
                <Text fw={500}>Sport</Text>
                <Text>{profileData.sport}</Text>
              </Group>

              <Group position="apart">
                <Text fw={500}>Height</Text>
                <Text>{profileData.height} cm</Text>
              </Group>

              <Group position="apart">
                <Text fw={500}>Weight</Text>
                <Text>{profileData.weight} kg</Text>
              </Group>

              <Group position="apart">
                <Text fw={500}>Birth Date</Text>
                <Text>{profileData.birth_date.toLocaleDateString()}</Text>
              </Group>

              <Group position="apart">
                <Text fw={500}>Age</Text>
                <Text>{new Date().getFullYear() - profileData.birth_date.getFullYear()}</Text>
              </Group>
            </Stack>
          </Card>
        </Stack>
      )}
    </Card>
  );
}
