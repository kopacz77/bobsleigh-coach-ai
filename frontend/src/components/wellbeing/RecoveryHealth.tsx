"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  List,
  Modal,
  MultiSelect,
  NumberInput,
  Paper,
  Progress,
  Select,
  SimpleGrid,
  Slider,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  IconActivity,
  IconAlertCircle,
  IconBandage,
  IconEdit,
  IconHeartbeat,
  IconIceCream,
  IconInfoCircle,
  IconMassage,
  IconMedicalCross,
  IconPlus,
  IconStretching,
  IconTemperature,
  IconTrash,
  IconZzz,
} from "@tabler/icons-react";
import type React from "react";
import { useEffect, useState } from "react";

/**
 * Option type for select inputs
 */
interface SelectOption {
  value: string;
  label: string;
  // biome-ignore lint/suspicious/noExplicitAny: Required for Tabler icon components (documented issue #1077 in tabler-icons repo)
  icon?: React.FC<any>;
  color?: string;
}

/**
 * Recovery session data from database
 */
interface RecoverySession {
  id: number;
  user_id: string;
  date: string;
  recovery_methods: string[];
  sleep_hours: number;
  hydration_liters: number;
  overall_recovery_score: number;
  soreness_areas: string[] | null;
  pain_level: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Injury data from database
 */
interface Injury {
  id: number;
  user_id: string;
  date: string;
  body_area: string;
  injury_type: string;
  severity: string;
  pain_level: number;
  symptoms: string[] | null;
  impact_on_training: string;
  treatment_plan: string | null;
  expected_recovery_time: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Form state for recovery
 */
interface RecoveryForm {
  id?: number;
  date: Date;
  recovery_methods: string[];
  sleep_hours: number;
  hydration_liters: number;
  overall_recovery_score: number;
  soreness_areas: string[];
  pain_level: number;
  notes: string;
}

/**
 * Form state for injury
 */
interface InjuryForm {
  id?: number;
  date: Date;
  body_area: string;
  injury_type: string;
  severity: string;
  pain_level: number;
  symptoms: string[];
  impact_on_training: string;
  treatment_plan: string;
  expected_recovery_time: string;
  status: string;
}

/**
 * Component props
 */
interface RecoveryHealthProps {
  userId: string;
}

/**
 * RecoveryHealth component tracks athlete recovery methods,
 * injury prevention, and overall recovery status.
 */
const RecoveryHealth: React.FC<RecoveryHealthProps> = ({ userId }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [recoveryData, setRecoveryData] = useState<RecoverySession[]>([]);
  const [injuryData, setInjuryData] = useState<Injury[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [injuryModalOpened, { open: openInjuryModal, close: closeInjuryModal }] =
    useDisclosure(false);
  const [selectedRecovery, setSelectedRecovery] = useState<RecoverySession | null>(null);
  const [selectedInjury, setSelectedInjury] = useState<Injury | null>(null);

  // Form state for recovery
  const [recovery, setRecovery] = useState<RecoveryForm>({
    date: new Date(),
    recovery_methods: [],
    sleep_hours: 7,
    hydration_liters: 2.5,
    overall_recovery_score: 5,
    soreness_areas: [],
    pain_level: 0,
    notes: "",
  });

  // Form state for injury/pain
  const [injury, setInjury] = useState<InjuryForm>({
    date: new Date(),
    body_area: "",
    injury_type: "",
    severity: "mild",
    pain_level: 3,
    symptoms: [],
    impact_on_training: "minor",
    treatment_plan: "",
    expected_recovery_time: "",
    status: "active",
  });

  // Options for selects
  const recoveryMethods: SelectOption[] = [
    { value: "sleep", label: "Sleep Optimization", icon: IconZzz },
    { value: "massage", label: "Massage", icon: IconMassage },
    { value: "stretching", label: "Stretching", icon: IconStretching },
    { value: "ice_bath", label: "Ice Bath", icon: IconIceCream },
    { value: "compression", label: "Compression Garments", icon: IconBandage },
    { value: "contrast_bath", label: "Contrast Bath", icon: IconTemperature },
    { value: "nutrition", label: "Recovery Nutrition", icon: IconActivity },
    { value: "active_recovery", label: "Active Recovery", icon: IconHeartbeat },
    { value: "foam_rolling", label: "Foam Rolling", icon: IconMassage },
    { value: "meditation", label: "Meditation/Relaxation", icon: IconZzz },
    { value: "physiotherapy", label: "Physiotherapy", icon: IconMedicalCross },
    { value: "heat_therapy", label: "Heat Therapy", icon: IconTemperature },
  ];

  const bodyAreas: SelectOption[] = [
    { value: "shoulder", label: "Shoulder" },
    { value: "upper_back", label: "Upper Back" },
    { value: "lower_back", label: "Lower Back" },
    { value: "neck", label: "Neck" },
    { value: "elbow", label: "Elbow" },
    { value: "wrist", label: "Wrist" },
    { value: "hand", label: "Hand/Fingers" },
    { value: "hip", label: "Hip" },
    { value: "knee", label: "Knee" },
    { value: "ankle", label: "Ankle" },
    { value: "foot", label: "Foot" },
    { value: "quads", label: "Quadriceps" },
    { value: "hamstrings", label: "Hamstrings" },
    { value: "calves", label: "Calves" },
    { value: "glutes", label: "Glutes" },
    { value: "chest", label: "Chest" },
    { value: "abdominals", label: "Abdominals" },
  ];

  const injuryTypes: SelectOption[] = [
    { value: "strain", label: "Muscle Strain" },
    { value: "sprain", label: "Sprain" },
    { value: "contusion", label: "Contusion/Bruise" },
    { value: "tendonitis", label: "Tendonitis" },
    { value: "bursitis", label: "Bursitis" },
    { value: "stress_fracture", label: "Stress Fracture" },
    { value: "tear", label: "Tear (Ligament/Tendon)" },
    { value: "nerve_injury", label: "Nerve Injury" },
    { value: "inflammation", label: "Inflammation" },
    { value: "dislocation", label: "Dislocation" },
    { value: "fracture", label: "Fracture" },
  ];

  const symptomOptions: SelectOption[] = [
    { value: "pain", label: "Pain" },
    { value: "swelling", label: "Swelling" },
    { value: "stiffness", label: "Stiffness" },
    { value: "weakness", label: "Weakness" },
    { value: "limited_mobility", label: "Limited Mobility" },
    { value: "redness", label: "Redness" },
    { value: "warmth", label: "Warmth in Area" },
    { value: "numbness", label: "Numbness" },
    { value: "tingling", label: "Tingling" },
    { value: "instability", label: "Joint Instability" },
    { value: "popping", label: "Popping/Clicking" },
    { value: "locking", label: "Joint Locking" },
  ];

  // Fetch recovery data
  useEffect(() => {
    const fetchRecoveryData = async () => {
      if (!userId) return;

      try {
        const startDate = new Date(selectedDate);
        startDate.setDate(startDate.getDate() - 14); // Get last 2 weeks

        const { data, error } = await supabase
          .from("recovery_sessions")
          .select("*")
          .eq("user_id", userId)
          .gte("date", startDate.toISOString().split("T")[0])
          .order("date", { ascending: false });

        if (error) {
          console.error("Error fetching recovery data:", error);
          return;
        }

        setRecoveryData(data || []);
      } catch (error) {
        console.error("Error in recovery data fetch:", error);
      }
    };

    fetchRecoveryData();
  }, [userId, selectedDate, supabase]);

  // Fetch injury data
  useEffect(() => {
    const fetchInjuryData = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from("injuries")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false });

        if (error) {
          console.error("Error fetching injury data:", error);
          return;
        }

        setInjuryData(data || []);
      } catch (error) {
        console.error("Error in injury data fetch:", error);
      }
    };

    fetchInjuryData();
  }, [userId, supabase]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Handle recovery form field changes
  const handleRecoveryDateChange = (value: Date | null) => {
    if (value) {
      setRecovery((prev) => ({ ...prev, date: value }));
    }
  };

  const handleRecoveryMethodsChange = (value: string[]) =>
    setRecovery((prev) => ({ ...prev, recovery_methods: value }));
  const handleSleepHoursChange = (value: string | number) =>
    setRecovery((prev) => ({
      ...prev,
      sleep_hours: typeof value === "string" ? Number.parseFloat(value) : value,
    }));
  const handleHydrationChange = (value: string | number) =>
    setRecovery((prev) => ({
      ...prev,
      hydration_liters: typeof value === "string" ? Number.parseFloat(value) : value,
    }));
  const handleRecoveryScoreChange = (value: number) =>
    setRecovery((prev) => ({ ...prev, overall_recovery_score: value }));
  const handleSorenessAreasChange = (value: string[]) =>
    setRecovery((prev) => ({ ...prev, soreness_areas: value }));
  const handlePainLevelChange = (value: number) =>
    setRecovery((prev) => ({ ...prev, pain_level: value }));

  const handleRecoveryNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRecovery((prev) => ({ ...prev, notes: event.target.value }));
  };

  // Handle injury form field changes
  const handleInjuryDateChange = (value: Date | null) => {
    if (value) {
      setInjury((prev) => ({ ...prev, date: value }));
    }
  };

  const handleBodyAreaChange = (value: string | null) =>
    setInjury((prev) => ({ ...prev, body_area: value || "" }));
  const handleInjuryTypeChange = (value: string | null) =>
    setInjury((prev) => ({ ...prev, injury_type: value || "" }));
  const handleSeverityChange = (value: string | null) =>
    setInjury((prev) => ({ ...prev, severity: value || "mild" }));
  const handleInjuryPainLevelChange = (value: number) =>
    setInjury((prev) => ({ ...prev, pain_level: value }));
  const handleSymptomsChange = (value: string[]) =>
    setInjury((prev) => ({ ...prev, symptoms: value }));
  const handleImpactOnTrainingChange = (value: string | null) =>
    setInjury((prev) => ({ ...prev, impact_on_training: value || "minor" }));

  const handleTreatmentPlanChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInjury((prev) => ({ ...prev, treatment_plan: event.target.value }));
  };

  const handleExpectedRecoveryTimeChange = (value: string | null) =>
    setInjury((prev) => ({ ...prev, expected_recovery_time: value || "" }));
  const handleStatusChange = (value: string | null) =>
    setInjury((prev) => ({ ...prev, status: value || "active" }));

  // Open recovery form modal
  const handleAddRecovery = () => {
    setRecovery({
      date: new Date(),
      recovery_methods: [],
      sleep_hours: 7,
      hydration_liters: 2.5,
      overall_recovery_score: 5,
      soreness_areas: [],
      pain_level: 0,
      notes: "",
    });
    setSelectedRecovery(null);
    openModal();
  };

  // Open recovery form modal with existing data
  const handleEditRecovery = (recovery: RecoverySession) => {
    setRecovery({
      id: recovery.id,
      date: new Date(recovery.date),
      recovery_methods: recovery.recovery_methods || [],
      sleep_hours: recovery.sleep_hours,
      hydration_liters: recovery.hydration_liters,
      overall_recovery_score: recovery.overall_recovery_score,
      soreness_areas: recovery.soreness_areas || [],
      pain_level: recovery.pain_level || 0,
      notes: recovery.notes || "",
    });
    setSelectedRecovery(recovery);
    openModal();
  };

  // Delete recovery session
  const handleDeleteRecovery = async (recoveryId: number) => {
    setDeleteLoading(true);

    try {
      const { error } = await supabase.from("recovery_sessions").delete().eq("id", recoveryId);

      if (error) {
        throw error;
      }

      notifications.show({
        title: "Success",
        message: "Recovery session deleted successfully",
        color: "green",
      });

      // Refresh recovery data
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 14);

      const { data } = await supabase
        .from("recovery_sessions")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startDate.toISOString().split("T")[0])
        .order("date", { ascending: false });

      setRecoveryData(data || []);
      closeModal();
    } catch (error) {
      console.error("Error deleting recovery session:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete recovery session",
        color: "red",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Submit recovery form
  const handleSubmitRecovery = async () => {
    if (recovery.recovery_methods.length === 0) {
      notifications.show({
        title: "Missing Information",
        message: "Please select at least one recovery method",
        color: "orange",
      });
      return;
    }

    setLoading(true);

    try {
      const recoveryData = {
        user_id: userId,
        date: recovery.date.toISOString().split("T")[0],
        recovery_methods: recovery.recovery_methods,
        sleep_hours: recovery.sleep_hours,
        hydration_liters: recovery.hydration_liters,
        overall_recovery_score: recovery.overall_recovery_score,
        soreness_areas: recovery.soreness_areas.length > 0 ? recovery.soreness_areas : null,
        pain_level: recovery.pain_level,
        notes: recovery.notes || null,
      };

      if (selectedRecovery) {
        // Update existing recovery
        const { error } = await supabase
          .from('recovery_sessions')
          .update(recoveryData)
          .eq('id', selectedRecovery.id);
        
        if (error) {
          throw error;
        }
      } else {
        // Insert new recovery
        const { error } = await supabase
          .from('recovery_sessions')
          .insert(recoveryData);
        
        if (error) {
          throw error;
        }
      }

      notifications.show({
        title: 'Success',
        message: 'Recovery data saved successfully',
        color: 'green',
      let query;

      if (selectedRecovery) {
        // Update existing recovery
        query = supabase
          .from("recovery_sessions")
          .update(recoveryData)
          .eq("id", selectedRecovery.id);
      } else {
        // Insert new recovery
        query = supabase.from("recovery_sessions").insert(recoveryData);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      notifications.show({
        title: "Success",
        message: "Recovery data saved successfully",
        color: "green",
      });

      // Refresh recovery data
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 14);

      const { data } = await supabase
        .from("recovery_sessions")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startDate.toISOString().split("T")[0])
        .order("date", { ascending: false });

      setRecoveryData(data || []);
      closeModal();
    } catch (error) {
      console.error('Error saving recovery data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save recovery data',
        color: 'red',
      console.error("Error saving recovery data:", error);
      notifications.show({
        title: "Error",
        message: "Failed to save recovery data",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Open injury form modal
  const handleAddInjury = () => {
    setInjury({
      date: new Date(),
      body_area: "",
      injury_type: "",
      severity: "mild",
      pain_level: 3,
      symptoms: [],
      impact_on_training: "minor",
      treatment_plan: "",
      expected_recovery_time: "",
      status: "active",
    });
    setSelectedInjury(null);
    openInjuryModal();
  };

  // Open injury form modal with existing data
  const handleEditInjury = (injury: Injury) => {
    setInjury({
      id: injury.id,
      date: new Date(injury.date),
      body_area: injury.body_area,
      injury_type: injury.injury_type,
      severity: injury.severity,
      pain_level: injury.pain_level,
      symptoms: injury.symptoms || [],
      impact_on_training: injury.impact_on_training,
      treatment_plan: injury.treatment_plan || "",
      expected_recovery_time: injury.expected_recovery_time || "",
      status: injury.status,
    });
    setSelectedInjury(injury);
    openInjuryModal();
  };

  // Delete injury
  const handleDeleteInjury = async (injuryId: number) => {
    setDeleteLoading(true);

    try {
      const { error } = await supabase.from("injuries").delete().eq("id", injuryId);

      if (error) {
        throw error;
      }

      notifications.show({
        title: 'Success',
        message: 'Injury record deleted successfully',
        color: 'green',
      notifications.show({
        title: "Success",
        message: "Injury record deleted successfully",
        color: "green",
      });

      // Refresh injury data
      const { data } = await supabase
        .from("injuries")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      setInjuryData(data || []);
      closeInjuryModal();
    } catch (error) {
      console.error('Error deleting injury record:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete injury record',
        color: 'red',
      console.error("Error deleting injury record:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete injury record",
        color: "red",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Submit injury form
  const handleSubmitInjury = async () => {
    if (!injury.body_area || !injury.injury_type) {
      notifications.show({
        title: 'Missing Information',
        message: 'Please fill in all required fields',
        color: 'orange',
      notifications.show({
        title: "Missing Information",
        message: "Please fill in all required fields",
        color: "orange",
      });
      return;
    }

    setLoading(true);

    try {
      const injuryData = {
        user_id: userId,
        date: injury.date.toISOString().split("T")[0],
        body_area: injury.body_area,
        injury_type: injury.injury_type,
        severity: injury.severity,
        pain_level: injury.pain_level,
        symptoms: injury.symptoms,
        impact_on_training: injury.impact_on_training,
        treatment_plan: injury.treatment_plan || null,
        expected_recovery_time: injury.expected_recovery_time || null,
        status: injury.status,
      };

      if (selectedInjury) {
        // Update existing injury
        const { error } = await supabase
          .from('injuries')
          .update(injuryData)
          .eq('id', selectedInjury.id);
        
        if (error) {
          throw error;
        }
      } else {
        // Insert new injury
        const { error } = await supabase
          .from('injuries')
          .insert(injuryData);
        
        if (error) {
          throw error;
        }
      }

      notifications.show({
        title: 'Success',
        message: 'Injury data saved successfully',
        color: 'green',
      let query;

      if (selectedInjury) {
        // Update existing injury
        query = supabase.from("injuries").update(injuryData).eq("id", selectedInjury.id);
      } else {
        // Insert new injury
        query = supabase.from("injuries").insert(injuryData);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      notifications.show({
        title: "Success",
        message: "Injury data saved successfully",
        color: "green",
      });

      // Refresh injury data
      const { data } = await supabase
        .from("injuries")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      setInjuryData(data || []);
      closeInjuryModal();
    } catch (error) {
      console.error('Error saving injury data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save injury data',
        color: 'red',
      console.error("Error saving injury data:", error);
      notifications.show({
        title: "Error",
        message: "Failed to save injury data",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate average recovery score
  const calculateAverageRecoveryScore = (): string | null => {
    if (!recoveryData.length) return null;

    const sum = recoveryData.reduce((acc, item) => acc + item.overall_recovery_score, 0);
    return (sum / recoveryData.length).toFixed(1);
  };

  // Get severity badge color
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case "mild":
        return "green";
      case "moderate":
        return "yellow";
      case "severe":
        return "orange";
      case "critical":
        return "red";
      default:
        return "gray";
    }
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
        return "red";
      case "recovering":
        return "yellow";
      case "monitoring":
        return "blue";
      case "resolved":
        return "green";
      default:
        return "gray";
    }
  };

  return (
    <Box>
      <Title order={2} mb="md">
        Recovery & Health Management
      </Title>
      <Text c="dimmed" mb="xl">
        Track your recovery methods, monitor injuries, and optimize your health for peak
        performance.
      </Text>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        <Box>
          <Paper p="md" radius="md" withBorder mb="xl">
            <Group justify="apart" mb="lg">
              <Text fw={600} size="lg">
                Recovery Tracking
              </Text>
              <Button leftSection={<IconPlus size={16} />} size="sm" onClick={handleAddRecovery}>
                Add Recovery Session
              </Button>
            </Group>

            {recoveryData.length > 0 ? (
              <>
                <SimpleGrid cols={2} mb="xl">
                  <Paper p="md" withBorder radius="md">
                    <Text ta="center" size="sm" c="dimmed">
                      Average Recovery Score
                    </Text>
                    <Group justify="center">
                      <Box
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: "50%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: theme.colors.blue[6],
                          color: "#fff",
                          marginTop: 10,
                        }}
                      >
                        <Text fw={700} size="xl">
                          {calculateAverageRecoveryScore()}
                        </Text>
                      </Box>
                      <Text size="xs" c="dimmed" style={{ maxWidth: 100 }}>
                        Based on your last {recoveryData.length} recovery sessions
                      </Text>
                    </Group>
                  </Paper>
                  <Paper p="md" withBorder radius="md">
                    <Text ta="center" size="sm" c="dimmed">
                      Most Used Recovery Methods
                    </Text>
                    <Box mt="md">
                      {(() => {
                        // Count method frequencies
                        const methodCounts: Record<string, number> = {};
                        recoveryData.forEach((item) => {
                          (item.recovery_methods || []).forEach((method) => {
                            methodCounts[method] = (methodCounts[method] || 0) + 1;
                          });
                        });

                        // Sort by frequency
                        const sortedMethods = Object.entries(methodCounts)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3);

                        return sortedMethods.map(([method, count]) => {
                          const methodInfo = recoveryMethods.find((m) => m.value === method);
                          const MethodIcon = methodInfo?.icon;
                          return (
                            <Group key={method} mb="xs" wrap="nowrap">
                              {MethodIcon && (
                                <ThemeIcon size={24} radius="xl" color="blue">
                                  <MethodIcon size={14} />
                                </ThemeIcon>
                              )}
                              <Text size="sm">{methodInfo?.label || method}</Text>
                            </Group>
                          );
                        });
                      })()}
                    </Box>
                  </Paper>
                </SimpleGrid>

                <Text fw={500} mb="xs">
                  Recent Recovery Sessions
                </Text>
                {recoveryData.slice(0, 3).map((item) => (
                  <Paper key={item.id} p="sm" withBorder radius="md" mb="md">
                    <Group justify="apart" mb="xs">
                      <Text fw={500}>{formatDate(item.date)}</Text>
                      <Group>
                        <Tooltip label="Edit">
                          <ActionIcon size="sm" onClick={() => handleEditRecovery(item)}>
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete">
                          <ActionIcon
                            size="sm"
                            color="red"
                            onClick={() => handleDeleteRecovery(item.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>

                    <Group>
                      {(item.recovery_methods || []).map((method) => {
                        const methodInfo = recoveryMethods.find((m) => m.value === method);
                        return (
                          <Badge key={method} size="sm">
                            {methodInfo?.label || method}
                          </Badge>
                        );
                      })}
                    </Group>

                    <Text size="sm">Recovery score: {item.overall_recovery_score}/10</Text>
                    <Text size="sm">Sleep: {item.sleep_hours} hours</Text>

                    {item.soreness_areas && item.soreness_areas.length > 0 && (
                      <Text size="sm">
                        Soreness:{" "}
                        {item.soreness_areas
                          .map((area) => {
                            const areaInfo = bodyAreas.find((a) => a.value === area);
                            return areaInfo?.label || area;
                          })
                          .join(", ")}
                      </Text>
                    )}
                  </Paper>
                ))}
              </>
            ) : (
              <Box py="xl" style={{ textAlign: "center" }}>
                <IconInfoCircle
                  size={40}
                  color={theme.colors.gray[5]}
                  style={{ marginBottom: 10 }}
                />
                <Text size="lg" fw={500} mb="xs">
                  No recovery data yet
                </Text>
                <Text c="dimmed" mb="md">
                  Start tracking your recovery methods to optimize your performance and prevent
                  injuries.
                </Text>
                <Button onClick={handleAddRecovery}>Add First Recovery Session</Button>
              </Box>
            )}
          </Paper>
        </Box>

        <Box>
          <Paper p="md" radius="md" withBorder mb="xl">
            <Group justify="apart" mb="lg">
              <Text fw={600} size="lg">
                Injury Tracking
              </Text>
              <Button leftSection={<IconPlus size={16} />} size="sm" onClick={handleAddInjury}>
                Record Injury/Pain
              </Button>
            </Group>

            {injuryData.length > 0 ? (
              <>
                <Box mb="xl">
                  <Text fw={500} mb="xs">
                    Active Injuries/Issues
                  </Text>
                  {injuryData
                    .filter((item) => item.status !== "resolved")
                    .slice(0, 3)
                    .map((item) => (
                      <Paper key={item.id} p="sm" withBorder radius="md" mb="md">
                        <Group justify="apart" mb="xs">
                          <Group>
                            <Badge color={getSeverityColor(item.severity)}>{item.severity}</Badge>
                            <Badge color={getStatusColor(item.status)}>{item.status}</Badge>
                          </Group>
                          <Group>
                            <Tooltip label="Edit">
                              <ActionIcon size="sm" onClick={() => handleEditInjury(item)}>
                                <IconEdit size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Delete">
                              <ActionIcon
                                size="sm"
                                color="red"
                                onClick={() => handleDeleteInjury(item.id)}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Group>

                        <Text fw={500} mb="xs">
                          {(() => {
                            const area = bodyAreas.find((a) => a.value === item.body_area);
                            const type = injuryTypes.find((t) => t.value === item.injury_type);
                            return `${area?.label || item.body_area} ${type?.label || item.injury_type}`;
                          })()}
                        </Text>

                        <Text size="sm" c="dimmed" mb="xs">
                          Recorded on {formatDate(item.date)}
                        </Text>

                        <Group mb="xs">
                          <Text size="sm">Pain Level:</Text>
                          <Progress
                            value={item.pain_level * 10}
                            color={
                              item.pain_level <= 3
                                ? "green"
                                : item.pain_level <= 6
                                  ? "yellow"
                                  : "red"
                            }
                            size="sm"
                            style={{ flex: 1 }}
                          />
                        </Group>

                        {item.symptoms && item.symptoms.length > 0 && (
                          <Text size="sm" mb="xs">
                            Symptoms:{" "}
                            {item.symptoms
                              .map((symptom) => {
                                const symptomInfo = symptomOptions.find((s) => s.value === symptom);
                                return symptomInfo?.label || symptom;
                              })
                              .join(", ")}
                          </Text>
                        )}

                        <Text size="sm" mb="xs">
                          Impact on Training:{" "}
                          {item.impact_on_training.charAt(0).toUpperCase() +
                            item.impact_on_training.slice(1)}
                        </Text>

                        {item.treatment_plan && (
                          <Text size="sm" lineClamp={2}>
                            Treatment: {item.treatment_plan}
                          </Text>
                        )}
                      </Paper>
                    ))}
                </Box>

                <Divider mb="md" />

                <Box>
                  <Text fw={500} mb="xs">
                    Injury History
                  </Text>
                  <List spacing="sm">
                    {injuryData
                      .filter((item) => item.status === "resolved")
                      .slice(0, 5)
                      .map((item) => (
                        <List.Item
                          key={item.id}
                          icon={
                            <ThemeIcon color="green" size={24} radius="xl">
                              <IconMedicalCross size={16} />
                            </ThemeIcon>
                          }
                        >
                          <Group justify="apart">
                            <Box>
                              <Text size="sm">
                                {(() => {
                                  const area = bodyAreas.find((a) => a.value === item.body_area);
                                  const type = injuryTypes.find(
                                    (t) => t.value === item.injury_type
                                  );
                                  return `${area?.label || item.body_area} ${type?.label || item.injury_type}`;
                                })()}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {formatDate(item.date)}
                              </Text>
                            </Box>
                            <Badge color="green">Resolved</Badge>
                          </Group>
                        </List.Item>
                      ))}
                  </List>
                </Box>
              </>
            ) : (
              <Box py="xl" style={{ textAlign: "center" }}>
                <IconAlertCircle
                  size={40}
                  color={theme.colors.gray[5]}
                  style={{ marginBottom: 10 }}
                />
                <Text size="lg" fw={500} mb="xs">
                  No injury data recorded
                </Text>
                <Text c="dimmed" mb="md">
                  Track injuries, pain points, and healing progress to maintain long-term health.
                </Text>
                <Button onClick={handleAddInjury}>Record First Injury/Pain</Button>
              </Box>
            )}
          </Paper>
        </Box>
      </SimpleGrid>

      {/* Recovery Modal */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={
          <Text fw={600}>
            {selectedRecovery ? "Edit Recovery Session" : "Add Recovery Session"}
          </Text>
        }
        size="lg"
      >
        <DatePickerInput
          label="Date"
          placeholder="Select date"
          value={recovery.date}
          onChange={handleRecoveryDateChange}
          maxDate={new Date()}
          clearable={false}
          mb="md"
          required
        />

        <MultiSelect
          label="Recovery Methods"
          placeholder="Select recovery methods used"
          data={recoveryMethods}
          value={recovery.recovery_methods}
          onChange={handleRecoveryMethodsChange}
          searchable
          mb="md"
          required
        />

        <Group grow mb="md">
          <NumberInput
            label="Sleep Duration (hours)"
            placeholder="Enter sleep hours"
            value={recovery.sleep_hours}
            onChange={handleSleepHoursChange}
            min={0}
            max={24}
            step={0.1}
          />

          <NumberInput
            label="Hydration (liters)"
            placeholder="Enter hydration amount"
            value={recovery.hydration_liters}
            onChange={handleHydrationChange}
            min={0}
            max={10}
            step={0.1}
          />
        </Group>

        <Box mb="md">
          <Text fw={500} size="sm" mb="xs">
            Overall Recovery Score
          </Text>
          <Slider
            value={recovery.overall_recovery_score}
            onChange={handleRecoveryScoreChange}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: "Poor" },
              { value: 5, label: "Average" },
              { value: 10, label: "Excellent" },
            ]}
            color={
              recovery.overall_recovery_score <= 3
                ? "red"
                : recovery.overall_recovery_score <= 6
                  ? "yellow"
                  : "green"
            }
          />
        </Box>

        <Box mb="md">
          <MultiSelect
            label="Areas of Soreness (if any)"
            placeholder="Select areas with soreness"
            data={bodyAreas}
            value={recovery.soreness_areas}
            onChange={handleSorenessAreasChange}
            searchable
            clearable
          />
        </Box>

        {recovery.soreness_areas.length > 0 && (
          <Box mb="md">
            <Text fw={500} size="sm" mb="xs">
              Pain Level (if sore)
            </Text>
            <Slider
              value={recovery.pain_level}
              onChange={handlePainLevelChange}
              min={0}
              max={10}
              step={1}
              marks={[
                { value: 0, label: "None" },
                { value: 5, label: "Moderate" },
                { value: 10, label: "Severe" },
              ]}
              color={
                recovery.pain_level <= 3 ? "green" : recovery.pain_level <= 6 ? "yellow" : "red"
              }
            />
          </Box>
        )}

        <Textarea
          label="Notes"
          placeholder="Add any additional notes about your recovery"
          value={recovery.notes}
          onChange={handleRecoveryNotesChange}
          minRows={3}
          mb="xl"
        />

        <Group justify="right">
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          {selectedRecovery && (
            <Button
              color="red"
              variant="outline"
              onClick={() => handleDeleteRecovery(selectedRecovery.id)}
              loading={deleteLoading}
            >
              Delete
            </Button>
          )}
          <Button
            onClick={handleSubmitRecovery}
            loading={loading}
            disabled={recovery.recovery_methods.length === 0}
          >
            {selectedRecovery ? "Update" : "Save"}
          </Button>
        </Group>
      </Modal>

      {/* Injury Modal */}
      <Modal
        opened={injuryModalOpened}
        onClose={closeInjuryModal}
        title={<Text fw={600}>{selectedInjury ? "Edit Injury Record" : "Record Injury/Pain"}</Text>}
        size="lg"
      >
        <DatePickerInput
          label="Date of Onset"
          placeholder="Select date"
          value={injury.date}
          onChange={handleInjuryDateChange}
          maxDate={new Date()}
          clearable={false}
          mb="md"
          required
        />

        <SimpleGrid cols={2} mb="md">
          <Select
            label="Body Area"
            placeholder="Select affected area"
            data={bodyAreas}
            value={injury.body_area}
            onChange={handleBodyAreaChange}
            searchable
            required
          />

          <Select
            label="Injury Type"
            placeholder="Select injury type"
            data={injuryTypes}
            value={injury.injury_type}
            onChange={handleInjuryTypeChange}
            searchable
            required
          />
        </SimpleGrid>

        <SimpleGrid cols={2} mb="md">
          <Select
            label="Severity"
            placeholder="Select severity"
            data={[
              { value: "mild", label: "Mild" },
              { value: "moderate", label: "Moderate" },
              { value: "severe", label: "Severe" },
              { value: "critical", label: "Critical" },
            ]}
            value={injury.severity}
            onChange={handleSeverityChange}
          />

          <Select
            label="Impact on Training"
            placeholder="Select impact level"
            data={[
              { value: "none", label: "No Impact" },
              { value: "minor", label: "Minor Modifications" },
              { value: "moderate", label: "Moderate Limitations" },
              { value: "major", label: "Major Limitations" },
              { value: "prevent", label: "Prevents Training" },
            ]}
            value={injury.impact_on_training}
            onChange={handleImpactOnTrainingChange}
          />
        </SimpleGrid>

        <Box mb="md">
          <Text fw={500} size="sm" mb="xs">
            Pain Level
          </Text>
          <Slider
            value={injury.pain_level}
            onChange={handleInjuryPainLevelChange}
            min={0}
            max={10}
            step={1}
            marks={[
              { value: 0, label: "None" },
              { value: 5, label: "Moderate" },
              { value: 10, label: "Severe" },
            ]}
            color={injury.pain_level <= 3 ? "green" : injury.pain_level <= 6 ? "yellow" : "red"}
          />
        </Box>

        <MultiSelect
          label="Symptoms"
          placeholder="Select all symptoms"
          data={symptomOptions}
          value={injury.symptoms}
          onChange={handleSymptomsChange}
          searchable
          mb="md"
        />

        <Textarea
          label="Treatment Plan"
          placeholder="Enter current treatment plan"
          value={injury.treatment_plan}
          onChange={handleTreatmentPlanChange}
          minRows={2}
          mb="md"
        />

        <SimpleGrid cols={2} mb="md">
          <Select
            label="Expected Recovery Time"
            placeholder="Select expected timeline"
            data={[
              { value: "days", label: "Days" },
              { value: "1_week", label: "~1 Week" },
              { value: "2_weeks", label: "~2 Weeks" },
              { value: "1_month", label: "~1 Month" },
              { value: "3_months", label: "2-3 Months" },
              { value: "6_months", label: "4-6 Months" },
              { value: "long_term", label: "Long-term / Chronic" },
              { value: "unknown", label: "Unknown" },
            ]}
            value={injury.expected_recovery_time}
            onChange={handleExpectedRecoveryTimeChange}
          />

          <Select
            label="Current Status"
            placeholder="Select current status"
            data={[
              { value: "active", label: "Active Injury" },
              { value: "recovering", label: "Recovering" },
              { value: "monitoring", label: "Monitoring" },
              { value: "resolved", label: "Resolved" },
            ]}
            value={injury.status}
            onChange={handleStatusChange}
            required
          />
        </SimpleGrid>

        <Group justify="right" mt="xl">
          <Button variant="outline" onClick={closeInjuryModal}>
            Cancel
          </Button>
          {selectedInjury && (
            <Button
              color="red"
              variant="outline"
              onClick={() => handleDeleteInjury(selectedInjury.id)}
              loading={deleteLoading}
            >
              Delete
            </Button>
          )}
          <Button
            onClick={handleSubmitInjury}
            loading={loading}
            disabled={!injury.body_area || !injury.injury_type}
          >
            {selectedInjury ? "Update" : "Save"}
          </Button>
        </Group>
      </Modal>
    </Box>
  );
};

export default RecoveryHealth;
