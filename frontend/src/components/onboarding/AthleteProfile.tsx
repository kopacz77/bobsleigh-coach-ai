import {
  Avatar,
  Box,
  Button,
  FileInput,
  Group,
  MultiSelect,
  NumberInput,
  Paper,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Stepper,
  Text,
  TextInput,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { showNotification } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconDeviceFloppy,
  IconRuler2,
  IconUpload,
  IconUser,
  IconWeight,
} from "@tabler/icons-react";
import React, { useState } from "react";

/**
 * AthleteProfile component for onboarding new athletes with bobsleigh-specific profile fields
 */
const AthleteProfile = ({ userId, onComplete }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Profile form state
  const [profile, setProfile] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    birthDate: null,
    gender: "",
    email: "",
    phone: "",
    nationality: "",

    // Physical Attributes
    height: "",
    weight: "",
    wingspan: "",
    bodyFat: "",

    // Athletic Background
    experienceLevel: "intermediate",
    bobsleighPosition: "",
    yearsExperience: "",
    previousSports: [],
    competitionLevel: "national",
    specialization: [],

    // Goals & Training
    primaryGoal: "",
    secondaryGoal: "",
    preferredTrainingDays: 5,
    preferredTrainingTime: "morning",
  });

  // Bobsleigh positions
  const positionOptions = [
    { value: "pilot", label: "Pilot/Driver" },
    { value: "brakeman", label: "Brakeman" },
    { value: "push_athlete", label: "Push Athlete" },
    { value: "side_push", label: "Side Push Athlete" },
    { value: "multi_position", label: "Multiple Positions" },
  ];

  // Bobsleigh specializations
  const specializationOptions = [
    { value: "start_technique", label: "Start Technique" },
    { value: "driving", label: "Driving/Steering" },
    { value: "loading", label: "Loading Technique" },
    { value: "push_strength", label: "Push Strength" },
    { value: "sprint_speed", label: "Sprint Speed" },
    { value: "technical_analysis", label: "Technical Analysis" },
    { value: "equipment", label: "Equipment Optimization" },
    { value: "team_coordination", label: "Team Coordination" },
  ];

  // Previous sports options
  const sportsOptions = [
    { value: "track_field", label: "Track & Field" },
    { value: "weightlifting", label: "Weightlifting" },
    { value: "football", label: "Football" },
    { value: "rugby", label: "Rugby" },
    { value: "crossfit", label: "CrossFit" },
    { value: "gymnastics", label: "Gymnastics" },
    { value: "volleyball", label: "Volleyball" },
    { value: "hockey", label: "Hockey" },
    { value: "basketball", label: "Basketball" },
    { value: "other", label: "Other" },
  ];

  // Competition levels
  const competitionLevels = [
    { value: "development", label: "Development/Learning" },
    { value: "regional", label: "Regional" },
    { value: "national", label: "National" },
    { value: "international", label: "International" },
    { value: "olympic", label: "Olympic" },
  ];

  // Handle text input changes
  const handleTextChange = (field) => (event) => {
    setProfile((prev) => ({ ...prev, [field]: event.target.value }));
  };

  // Handle select changes
  const handleSelectChange = (field) => (value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  // Handle number input changes
  const handleNumberChange = (field) => (value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  // Handle avatar file upload
  const handleAvatarChange = (file) => {
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }

    setAvatarFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle next step
  const handleNextStep = () => {
    setActiveStep((current) => current + 1);
  };

  // Handle previous step
  const handlePreviousStep = () => {
    setActiveStep((current) => current - 1);
  };

  // Upload avatar to storage
  const uploadAvatar = async () => {
    if (!avatarFile) return null;

    const fileExt = avatarFile.name.split(".").pop();
    const filePath = `avatars/${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("athlete-avatars")
      .upload(filePath, avatarFile);

    if (uploadError) {
      throw uploadError;
    }

    return filePath;
  };

  // Save profile data
  const handleSaveProfile = async () => {
    setLoading(true);

    try {
      // Upload avatar if present
      let avatarPath = null;
      if (avatarFile) {
        avatarPath = await uploadAvatar();
      }

      // Prepare profile data
      const profileData = {
        user_id: userId,
        first_name: profile.firstName,
        last_name: profile.lastName,
        birth_date: profile.birthDate ? profile.birthDate.toISOString().split("T")[0] : null,
        gender: profile.gender,
        email: profile.email,
        phone: profile.phone,
        nationality: profile.nationality,
        height_cm: Number.parseFloat(profile.height) || null,
        weight_kg: Number.parseFloat(profile.weight) || null,
        wingspan_cm: Number.parseFloat(profile.wingspan) || null,
        body_fat_percentage: Number.parseFloat(profile.bodyFat) || null,
        experience_level: profile.experienceLevel,
        bobsleigh_position: profile.bobsleighPosition,
        years_experience: Number.parseInt(profile.yearsExperience) || 0,
        previous_sports: profile.previousSports,
        competition_level: profile.competitionLevel,
        specializations: profile.specialization,
        primary_goal: profile.primaryGoal,
        secondary_goal: profile.secondaryGoal,
        preferred_training_days: Number.parseInt(profile.preferredTrainingDays) || 5,
        preferred_training_time: profile.preferredTrainingTime,
        avatar_url: avatarPath ? `storage/athlete-avatars/${avatarPath}` : null,
      };

      // Save to profile table
      const { error } = await supabase
        .from("athlete_profiles")
        .upsert(profileData, { onConflict: "user_id" });

      if (error) {
        throw error;
      }

      // Update user table with name
      await supabase
        .from("users")
        .update({
          first_name: profile.firstName,
          last_name: profile.lastName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      showNotification({
        title: "Success",
        message: "Profile saved successfully",
        color: "green",
      });

      if (onComplete) {
        onComplete(profileData);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      showNotification({
        title: "Error",
        message: "Failed to save profile",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stepper active={activeStep} onStepClick={setActiveStep} breakpoint="sm" mb="xl">
        <Stepper.Step
          label="Personal Information"
          description="Basic details"
          icon={<IconUser size={18} />}
        >
          <Title order={3} mb="md">
            Personal Information
          </Title>

          <Paper p="lg" radius="md" withBorder>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="md">
              <TextInput
                label="First Name"
                placeholder="Enter your first name"
                value={profile.firstName}
                onChange={handleTextChange("firstName")}
                required
              />

              <TextInput
                label="Last Name"
                placeholder="Enter your last name"
                value={profile.lastName}
                onChange={handleTextChange("lastName")}
                required
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="md">
              <DatePickerInput
                label="Date of Birth"
                placeholder="Select your date of birth"
                value={profile.birthDate}
                onChange={handleSelectChange("birthDate")}
                maxDate={new Date()}
              />

              <Radio.Group
                label="Gender"
                value={profile.gender}
                onChange={handleSelectChange("gender")}
              >
                <Group mt="xs">
                  <Radio value="male" label="Male" />
                  <Radio value="female" label="Female" />
                  <Radio value="other" label="Other" />
                </Group>
              </Radio.Group>
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="md">
              <TextInput
                label="Email"
                placeholder="Enter your email"
                value={profile.email}
                onChange={handleTextChange("email")}
                type="email"
              />

              <TextInput
                label="Phone Number"
                placeholder="Enter your phone number"
                value={profile.phone}
                onChange={handleTextChange("phone")}
              />
            </SimpleGrid>

            <TextInput
              label="Nationality"
              placeholder="Enter your nationality"
              value={profile.nationality}
              onChange={handleTextChange("nationality")}
              mb="md"
            />

            <Group position="center" mb="md">
              <Box sx={{ textAlign: "center" }}>
                <Text weight={500} mb="xs">
                  Profile Picture
                </Text>
                <Avatar src={avatarPreview} size={120} radius={60} mx="auto" mb="sm" />
                <FileInput
                  placeholder="Upload image"
                  accept="image/*"
                  icon={<IconUpload size={14} />}
                  onChange={handleAvatarChange}
                  styles={{ input: { width: 220 } }}
                />
              </Box>
            </Group>
          </Paper>

          <Group position="right" mt="xl">
            <Button onClick={handleNextStep} rightIcon={<IconChevronRight size={16} />} size="md">
              Next Step
            </Button>
          </Group>
        </Stepper.Step>

        <Stepper.Step
          label="Physical Attributes"
          description="Body metrics"
          icon={<IconRuler2 size={18} />}
        >
          <Title order={3} mb="md">
            Physical Attributes
          </Title>

          <Paper p="lg" radius="md" withBorder>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="md">
              <NumberInput
                label="Height (cm)"
                placeholder="Enter your height in centimeters"
                value={profile.height}
                onChange={handleNumberChange("height")}
                min={0}
                precision={1}
              />

              <NumberInput
                label="Weight (kg)"
                placeholder="Enter your weight in kilograms"
                value={profile.weight}
                onChange={handleNumberChange("weight")}
                min={0}
                precision={1}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="md">
              <NumberInput
                label="Wingspan (cm)"
                placeholder="Enter your wingspan in centimeters"
                value={profile.wingspan}
                onChange={handleNumberChange("wingspan")}
                min={0}
                precision={1}
              />

              <NumberInput
                label="Body Fat Percentage (%)"
                placeholder="Enter your body fat percentage"
                value={profile.bodyFat}
                onChange={handleNumberChange("bodyFat")}
                min={0}
                max={100}
                precision={1}
              />
            </SimpleGrid>
          </Paper>

          <Group position="apart" mt="xl">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              leftIcon={<IconChevronLeft size={16} />}
              size="md"
            >
              Back
            </Button>

            <Button onClick={handleNextStep} rightIcon={<IconChevronRight size={16} />} size="md">
              Next Step
            </Button>
          </Group>
        </Stepper.Step>

        <Stepper.Step
          label="Athletic Background"
          description="Experience & specialization"
          icon={<IconWeight size={18} />}
        >
          <Title order={3} mb="md">
            Athletic Background
          </Title>

          <Paper p="lg" radius="md" withBorder>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="md">
              <Select
                label="Bobsleigh Position"
                placeholder="Select your primary position"
                data={positionOptions}
                value={profile.bobsleighPosition}
                onChange={handleSelectChange("bobsleighPosition")}
                required
              />

              <NumberInput
                label="Years of Bobsleigh Experience"
                placeholder="Enter number of years"
                value={profile.yearsExperience}
                onChange={handleNumberChange("yearsExperience")}
                min={0}
                max={30}
                precision={0}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="md">
              <MultiSelect
                label="Previous Sports Background"
                placeholder="Select previous sports"
                data={sportsOptions}
                value={profile.previousSports}
                onChange={handleSelectChange("previousSports")}
                searchable
              />

              <Select
                label="Competition Level"
                placeholder="Select your competition level"
                data={competitionLevels}
                value={profile.competitionLevel}
                onChange={handleSelectChange("competitionLevel")}
              />
            </SimpleGrid>

            <MultiSelect
              label="Areas of Specialization"
              placeholder="Select your specialized areas"
              data={specializationOptions}
              value={profile.specialization}
              onChange={handleSelectChange("specialization")}
              mb="md"
            />

            <Select
              label="Experience Level"
              placeholder="Select your experience level"
              data={[
                { value: "beginner", label: "Beginner (0-1 years)" },
                { value: "intermediate", label: "Intermediate (2-4 years)" },
                { value: "advanced", label: "Advanced (5-9 years)" },
                { value: "elite", label: "Elite (10+ years)" },
              ]}
              value={profile.experienceLevel}
              onChange={handleSelectChange("experienceLevel")}
            />
          </Paper>

          <Group position="apart" mt="xl">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              leftIcon={<IconChevronLeft size={16} />}
              size="md"
            >
              Back
            </Button>

            <Button onClick={handleNextStep} rightIcon={<IconChevronRight size={16} />} size="md">
              Next Step
            </Button>
          </Group>
        </Stepper.Step>

        <Stepper.Step
          label="Goals & Training"
          description="Training preferences"
          icon={<IconCheck size={18} />}
        >
          <Title order={3} mb="md">
            Goals & Training Preferences
          </Title>

          <Paper p="lg" radius="md" withBorder>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="md">
              <TextInput
                label="Primary Goal"
                placeholder="Enter your main goal for this season"
                value={profile.primaryGoal}
                onChange={handleTextChange("primaryGoal")}
              />

              <TextInput
                label="Secondary Goal"
                placeholder="Enter a secondary goal"
                value={profile.secondaryGoal}
                onChange={handleTextChange("secondaryGoal")}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="md">
              <Select
                label="Preferred Training Days Per Week"
                placeholder="Select number of days"
                data={[
                  { value: "3", label: "3 days/week" },
                  { value: "4", label: "4 days/week" },
                  { value: "5", label: "5 days/week" },
                  { value: "6", label: "6 days/week" },
                  { value: "7", label: "7 days/week" },
                ]}
                value={profile.preferredTrainingDays.toString()}
                onChange={(value) => handleSelectChange("preferredTrainingDays")(value)}
              />

              <Select
                label="Preferred Training Time"
                placeholder="Select preferred time"
                data={[
                  { value: "morning", label: "Morning (5AM-11AM)" },
                  { value: "afternoon", label: "Afternoon (11AM-5PM)" },
                  { value: "evening", label: "Evening (5PM-10PM)" },
                  { value: "flexible", label: "Flexible" },
                ]}
                value={profile.preferredTrainingTime}
                onChange={handleSelectChange("preferredTrainingTime")}
              />
            </SimpleGrid>
          </Paper>

          <Group position="apart" mt="xl">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              leftIcon={<IconChevronLeft size={16} />}
              size="md"
            >
              Back
            </Button>

            <Button
              onClick={handleSaveProfile}
              leftIcon={<IconDeviceFloppy size={16} />}
              loading={loading}
              size="md"
              color="green"
            >
              Save Profile
            </Button>
          </Group>
        </Stepper.Step>
      </Stepper>
    </Box>
  );
};

export default AthleteProfile;
