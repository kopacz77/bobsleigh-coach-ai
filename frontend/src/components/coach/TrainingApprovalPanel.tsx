'use client';

import { useState } from 'react';
import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  Switch,
  Tabs,
  Textarea,
  ActionIcon,
  Modal,
  List,
  ThemeIcon,
  Accordion,
  Divider
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconEdit,
  IconInfoCircle,
  IconBarbell,
  IconCalendar,
  IconGitCompare,
  IconUserExclamation,
  IconAlertTriangle
} from '@tabler/icons-react';

import { WorkoutDayCard } from '../training/WorkoutDayCard';

interface TrainingPlanDayData {
  id: string;
  title: string;
  date: string;
  day: string;
  intensity: 'Low' | 'Medium' | 'High';
  exerciseGroups: {
    id: string;
    name: string;
    exercises: {
      id: string;
      name: string;
      sets: number;
      reps?: number;
      weight?: number;
      distance?: number;
      duration?: number;
      rest?: number;
      notes?: string;
    }[];
    mhg?: number;
  }[];
  notes?: string;
  isRestDay?: boolean;
}

interface TrainingPlanData {
  id: string;
  athleteId: string;
  athleteName: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: TrainingPlanDayData[];
  metadata: {
    generatedOn: string;
    trainingPhase: string;
    competitionProximity?: number;
    pmcMetrics: {
      ctl: number;
      atl: number;
      tsb: number;
    };
    injuryAccommodation?: string;
    recoveryFocus?: boolean;
  };
}

interface TrainingApprovalPanelProps {
  pendingPlans: TrainingPlanData[];
  onApprove: (planId: string, modifications?: any) => void;
  onReject: (planId: string, reason: string) => void;
  onModify: (planId: string, modifications: any) => void;
}

export function TrainingApprovalPanel({
  pendingPlans,
  onApprove,
  onReject,
  onModify
}: TrainingApprovalPanelProps) {
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlanData | null>(
    pendingPlans.length > 0 ? pendingPlans[0] : null
  );
  const [modifiedPlan, setModifiedPlan] = useState<TrainingPlanData | null>(null);
  const [isModifying, setIsModifying] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showComparison, setShowComparison] = useState(false);

  const handleSelectPlan = (plan: TrainingPlanData) => {
    setSelectedPlan(plan);
    setModifiedPlan(null);
    setIsModifying(false);
    setShowComparison(false);
  };

  const handleModifyStart = () => {
    setModifiedPlan(JSON.parse(JSON.stringify(selectedPlan)));
    setIsModifying(true);
  };

  const handleModifyCancel = () => {
    setModifiedPlan(null);
    setIsModifying(false);
  };

  const handleModifySave = () => {
    if (modifiedPlan && selectedPlan) {
      onModify(selectedPlan.id, modifiedPlan);
      setIsModifying(false);
    }
  };

  const handleRejectSubmit = () => {
    if (selectedPlan) {
      onReject(selectedPlan.id, rejectionReason);
      setRejectModalOpen(false);
      setRejectionReason('');

      // Select the next plan if available
      const currentIndex = pendingPlans.findIndex(plan => plan.id === selectedPlan.id);
      if (currentIndex >= 0 && currentIndex < pendingPlans.length - 1) {
        setSelectedPlan(pendingPlans[currentIndex + 1]);
      } else if (pendingPlans.length > 1) {
        setSelectedPlan(pendingPlans[0]);
      } else {
        setSelectedPlan(null);
      }
    }
  };

  const getTrainingPhaseLabel = (phase: string) => {
    const phaseLabels: Record<string, string> = {
      general_preparation: 'General Preparation',
      specific_preparation: 'Specific Preparation',
      pre_competition: 'Pre-Competition',
      competition: 'Competition',
      transition: 'Transition'
    };

    return phaseLabels[phase] || phase;
  };

  const renderPlanMetadata = (plan: TrainingPlanData) => {
    const { metadata } = plan;

    return (
      <Card withBorder shadow="sm" p="md" radius="md">
        <Stack>
          <Group justify="space-between">
            <Title order={4}>Training Context</Title>

            {metadata.injuryAccommodation && (
              <Badge color="red">Injury Accommodations</Badge>
            )}

            {metadata.recoveryFocus && (
              <Badge color="orange">Recovery Focus</Badge>
            )}
          </Group>

          <Group grow>
            <Stack gap="xs">
              <Text size="sm" fw={500}>Training Phase</Text>
              <Badge size="lg" fullWidth>
                {getTrainingPhaseLabel(metadata.trainingPhase)}
              </Badge>
            </Stack>

            {metadata.competitionProximity !== undefined && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>Competition</Text>
                <Badge size="lg" color="green" fullWidth>
                  In {metadata.competitionProximity} days
                </Badge>
              </Stack>
            )}
          </Group>

          <Divider label="PMC Metrics" labelPosition="center" />

          <Group grow>
            <Stack gap={0} align="center">
              <Text size="sm" fw={500}>CTL (Fitness)</Text>
              <Text size="xl">{metadata.pmcMetrics.ctl.toFixed(1)}</Text>
            </Stack>

            <Stack gap={0} align="center">
              <Text size="sm" fw={500}>ATL (Fatigue)</Text>
              <Text size="xl">{metadata.pmcMetrics.atl.toFixed(1)}</Text>
            </Stack>

            <Stack gap={0} align="center">
              <Text size="sm" fw={500}>TSB (Form)</Text>
              <Text size="xl" c={metadata.pmcMetrics.tsb >= 0 ? 'green' : 'red'}>
                {metadata.pmcMetrics.tsb.toFixed(1)}
              </Text>
            </Stack>
          </Group>

          {metadata.injuryAccommodation && (
            <>
              <Divider label="Injury Accommodations" labelPosition="center" color="red" />
              <Text c="red">{metadata.injuryAccommodation}</Text>
            </>
          )}
        </Stack>
      </Card>
    );
  };

  if (pendingPlans.length === 0) {
    return (
      <Card withBorder p="xl" radius="md">
        <Stack align="center" gap="md">
          <ThemeIcon size={64} radius={100} color="blue">
            <IconCheck size={32} />
          </ThemeIcon>
          <Title order={3} ta="center">No Training Plans Need Approval</Title>
          <Text ta="center" c="dimmed">
            All athlete training plans have been reviewed. Check back later for new generated plans.
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack>
      <Title order={3}>Training Plan Approval</Title>
      <Text c="dimmed">
        Review AI-generated training plans for your athletes before they become visible
      </Text>

      <Tabs defaultValue="list">
        <Tabs.List>
          <Tabs.Tab value="list" leftSection={<IconCalendar size={14} />}>
            Pending Plans ({pendingPlans.length})
          </Tabs.Tab>
          {selectedPlan && (
            <Tabs.Tab value="review" leftSection={<IconBarbell size={14} />}>
              Review Plan
            </Tabs.Tab>
          )}
          {showComparison && (
            <Tabs.Tab value="compare" leftSection={<IconGitCompare size={14} />}>
              Compare Changes
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="list" pt="md">
          <Stack>
            {pendingPlans.map(plan => (
              <Card
                key={plan.id}
                withBorder
                p="md"
                radius="md"
                onClick={() => handleSelectPlan(plan)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedPlan?.id === plan.id ? '#f8f9fa' : undefined
                }}
              >
                <Group justify="space-between">
                  <div>
                    <Text fw={500}>{plan.athleteName}</Text>
                    <Text size="sm" c="dimmed">
                      Week {plan.weekNumber} • {new Date(plan.startDate).toLocaleDateString()} to {new Date(plan.endDate).toLocaleDateString()}
                    </Text>
                  </div>

                  <Group>
                    {plan.metadata.injuryAccommodation && (
                      <ThemeIcon color="red" variant="light">
                        <IconUserExclamation size={16} />
                      </ThemeIcon>
                    )}

                    {plan.metadata.recoveryFocus && (
                      <ThemeIcon color="orange" variant="light">
                        <IconAlertTriangle size={16} />
                      </ThemeIcon>
                    )}

                    <Badge>
                      {getTrainingPhaseLabel(plan.metadata.trainingPhase)}
                    </Badge>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="review" pt="md">
          {selectedPlan && (
            <Stack>
              <Group justify="space-between">
                <div>
                  <Text size="xl" fw={700}>{selectedPlan.athleteName} • Week {selectedPlan.weekNumber}</Text>
                  <Text size="sm" c="dimmed">
                    Generated on {new Date(selectedPlan.metadata.generatedOn).toLocaleString()}
                  </Text>
                </div>

                <Group>
                  <Button
                    variant="outline"
                    color="green"
                    leftSection={<IconCheck size={16} />}
                    onClick={() => onApprove(selectedPlan.id)}
                  >
                    Approve
                  </Button>

                  <Button
                    variant="outline"
                    color="red"
                    leftSection={<IconX size={16} />}
                    onClick={() => setRejectModalOpen(true)}
                  >
                    Reject
                  </Button>

                  <Button
                    variant="outline"
                    leftSection={<IconEdit size={16} />}
                    onClick={handleModifyStart}
                    disabled={isModifying}
                  >
                    Modify
                  </Button>
                </Group>
              </Group>

              {/* Plan Metadata */}
              {renderPlanMetadata(selectedPlan)}

              {/* Week Overview */}
              <Card withBorder p="md" radius="md">
                <Accordion>
                  {selectedPlan.days.map((day, index) => (
                    <Accordion.Item key={day.id} value={day.id}>
                      <Accordion.Control>
                        <Group>
                          <Text fw={500}>{day.day} • {day.title}</Text>
                          {day.isRestDay ? (
                            <Badge color="gray">Rest Day</Badge>
                          ) : (
                            <Badge color={
                              day.intensity === 'High' ? 'red' :
                              day.intensity === 'Medium' ? 'yellow' : 'green'
                            }>
                              {day.intensity} Intensity
                            </Badge>
                          )}
                        </Group>
                      </Accordion.Control>
                      <Accordion.Panel>
                        {day.isRestDay ? (
                          <Text>{day.notes || 'Rest and recovery day.'}</Text>
                        ) : (
                          <Stack>
                            {day.notes && (
                              <Text size="sm" fs="italic">{day.notes}</Text>
                            )}
                            {day.exerciseGroups.map(group => (
                              <Card key={group.id} withBorder shadow="xs" p="md">
                                <Group justify="space-between" mb="xs">
                                  <Text fw={500}>{group.name}</Text>
                                  {group.mhg && (
                                    <Badge>MHG: {group.mhg}kg</Badge>
                                  )}
                                </Group>
                                <List>
                                  {group.exercises.map(exercise => (
                                    <List.Item key={exercise.id}>
                                      <Text>
                                        {exercise.name}: {exercise.sets} sets
                                        {exercise.reps && ` × ${exercise.reps} reps`}
                                        {exercise.weight && ` @ ${exercise.weight}kg`}
                                        {exercise.distance && ` × ${exercise.distance}m`}
                                        {exercise.duration && ` × ${exercise.duration}s`}
                                        {exercise.rest && ` (${exercise.rest}s rest)`}
                                      </Text>
                                      {exercise.notes && (
                                        <Text size="xs" c="dimmed">{exercise.notes}</Text>
                                      )}
                                    </List.Item>
                                  ))}
                                </List>
                              </Card>
                            ))}
                          </Stack>
                        )}
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Card>
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="compare" pt="md">
          {selectedPlan && modifiedPlan && (
            <Stack>
              <Text>Comparison view would be implemented here</Text>
              {/* Real implementation would show side-by-side comparison */}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>

      {isModifying && modifiedPlan && (
        <Card withBorder p="md" radius="md">
          <Stack>
            <Group justify="space-between">
              <Title order={4}>Modify Training Plan</Title>
              <Group>
                <Button variant="outline" color="red" onClick={handleModifyCancel}>
                  Cancel
                </Button>
                <Button variant="filled" color="green" onClick={handleModifySave}>
                  Save Modifications
                </Button>
              </Group>
            </Group>

            {/* Modification interface would go here */}
            <Text>
              Training plan modification interface would be implemented here.
              Coaches would be able to:
            </Text>
            <List>
              <List.Item>Change exercise selections</List.Item>
              <List.Item>Adjust sets, reps, and weights</List.Item>
              <List.Item>Modify workout intensities</List.Item>
              <List.Item>Add or remove exercise groups</List.Item>
              <List.Item>Add specific coaching notes</List.Item>
            </List>
          </Stack>
        </Card>
      )}

      <Modal
        opened={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Training Plan"
      >
        <Stack>
          <Text size="sm">
            Please provide a reason for rejecting this training plan.
            This feedback will help improve future recommendations.
          </Text>

          <Textarea
            placeholder="Explain why this plan is not suitable..."
            minRows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleRejectSubmit}
              disabled={rejectionReason.trim().length === 0}
            >
              Reject Plan
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}