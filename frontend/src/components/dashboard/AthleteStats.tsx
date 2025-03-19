'use client';

import { Card, Grid, Group, RingProgress, Stack, Text, Title } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';

interface StatCardProps {
  title: string;
  value: string | number;
  diff: number;
  unit?: string;
}

function StatCard({ title, value, diff, unit }: StatCardProps) {
  return (
    <Card withBorder p="md" radius="md">
      <Group justify="space-between">
        <Text size="xs" c="dimmed" fw={700}>
          {title}
        </Text>
        <Group gap={5}>
          <Text size="xs" c={diff > 0 ? 'teal' : 'red'} fw={700}>
            {diff > 0 ? '+' : ''}{diff}%
          </Text>
          {diff > 0 ? (
            <IconArrowUpRight size={16} color="teal" />
          ) : (
            <IconArrowDownRight size={16} color="red" />
          )}
        </Group>
      </Group>

      <Group align="flex-end" gap="xs" mt={25}>
        <Text fw={700} fz="xl">
          {value}
        </Text>
        {unit && (
          <Text c="dimmed" size="sm">
            {unit}
          </Text>
        )}
      </Group>
    </Card>
  );
}

interface AthleteStatsProps {
  athleteId?: number;
}

export function AthleteStats({ athleteId = 1 }: AthleteStatsProps) {
  // In a real app, we would fetch this data from the backend based on athleteId
  // This is placeholder data for demonstration
  const data = {
    trainingLoad: {
      value: 85.7,
      diff: 10.2,
      unit: 'CTL',
    },
    formScore: {
      value: -9.5,
      diff: -15.3,
      unit: 'TSB',
    },
    strength: {
      value: 150,
      diff: 5.0,
      unit: 'kg',
    },
    speed: {
      value: 4.1,
      diff: 2.5,
      unit: 'sec',
    },
    readinessScore: 78,
  };

  return (
    <Stack>
      <Title order={3}>Performance Overview</Title>
      
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Training Load"
            value={data.trainingLoad.value}
            diff={data.trainingLoad.diff}
            unit={data.trainingLoad.unit}
          />
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Form Score"
            value={data.formScore.value}
            diff={data.formScore.diff}
            unit={data.formScore.unit}
          />
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Squat 1RM"
            value={data.strength.value}
            diff={data.strength.diff}
            unit={data.strength.unit}
          />
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="30m Sprint"
            value={data.speed.value}
            diff={data.speed.diff}
            unit={data.speed.unit}
          />
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder p="md" radius="md">
            <Text size="xs" c="dimmed" fw={700}>
              Athlete Readiness
            </Text>
            
            <Group justify="space-between" mt="md">
              <RingProgress 
                size={120}
                thickness={12}
                roundCaps
                sections={[{ value: data.readinessScore, color: data.readinessScore > 70 ? 'teal' : data.readinessScore > 40 ? 'yellow' : 'red' }]}
                label={
                  <Text fw={700} ta="center" size="lg">
                    {data.readinessScore}%
                  </Text>
                }
              />
              
              <Stack gap="xs">
                <Group>
                  <div style={{ width: 12, height: 12, backgroundColor: 'teal', borderRadius: '50%' }} />
                  <Text size="sm">Ready for high intensity (80-100%)</Text>
                </Group>
                <Group>
                  <div style={{ width: 12, height: 12, backgroundColor: 'yellow', borderRadius: '50%' }} />
                  <Text size="sm">Moderate training advised (40-79%)</Text>
                </Group>
                <Group>
                  <div style={{ width: 12, height: 12, backgroundColor: 'red', borderRadius: '50%' }} />
                  <Text size="sm">Recovery recommended (0-39%)</Text>
                </Group>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder p="md" radius="md">
            <Text size="xs" c="dimmed" fw={700}>
              Training Status
            </Text>
            
            <Group mt="md">
              <Stack gap="md" w="100%">
                <Group justify="space-between">
                  <Text size="sm">Fatigue</Text>
                  <Text size="sm" fw={700}>High</Text>
                </Group>
                
                <div style={{ position: 'relative', height: 8, width: '100%', backgroundColor: '#f1f3f5', borderRadius: 4 }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, height: 8, width: '85%', backgroundColor: 'red', borderRadius: 4 }} />
                </div>
                
                <Group justify="space-between">
                  <Text size="sm">Fitness</Text>
                  <Text size="sm" fw={700}>Good</Text>
                </Group>
                
                <div style={{ position: 'relative', height: 8, width: '100%', backgroundColor: '#f1f3f5', borderRadius: 4 }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, height: 8, width: '70%', backgroundColor: 'teal', borderRadius: 4 }} />
                </div>
                
                <Group justify="space-between">
                  <Text size="sm">Recommendation</Text>
                  <Text size="sm" c="red" fw={700}>Reduce load by 15%</Text>
                </Group>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}