'use client';

import { Card, Grid, Group, Progress, RingProgress, Stack, Text, Title } from '@mantine/core';

export function PerformanceMetrics() {
  // In a real app, this data would come from the API
  const strengthMetrics = {
    squat_1rm: 150,
    bench_1rm: 100,
    deadlift_1rm: 180,
    power_clean_1rm: 90,
    strength_score: 85,
  };

  const speedMetrics = {
    '30m_best': 4.1,
    '60m_best': 7.3,
    speed_score: 78,
  };

  const powerMetrics = {
    vertical_jump: 65,
    broad_jump: 280,
    med_ball_throw: 850,
    power_score: 82,
  };

  const overallScore = Math.round((strengthMetrics.strength_score + speedMetrics.speed_score + powerMetrics.power_score) / 3);

  return (
    <Card withBorder p="md" radius="md">
      <Stack>
        <Title order={3}>Performance Metrics</Title>
        
        <Grid>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Stack align="center" spacing="xs">
              <RingProgress
                size={120}
                thickness={12}
                roundCaps
                sections={[{ value: overallScore, color: 'blue' }]}
                label={
                  <Text fw={700} ta="center" size="xl">
                    {overallScore}
                  </Text>
                }
              />
              <Text fw={500} size="lg">Overall Performance</Text>
              <Text size="sm" c="dimmed" ta="center">Based on strength, speed, and power scores</Text>
            </Stack>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card withBorder h="100%">
              <Stack>
                <Group position="apart">
                  <Text fw={500}>Strength</Text>
                  <Text fw={700}>{strengthMetrics.strength_score}/100</Text>
                </Group>
                <Progress value={strengthMetrics.strength_score} color="blue" size="md" />
                
                <Stack spacing={5} mt="xs">
                  <Group position="apart">
                    <Text size="sm">Squat 1RM</Text>
                    <Text size="sm">{strengthMetrics.squat_1rm} kg</Text>
                  </Group>
                  <Group position="apart">
                    <Text size="sm">Bench 1RM</Text>
                    <Text size="sm">{strengthMetrics.bench_1rm} kg</Text>
                  </Group>
                  <Group position="apart">
                    <Text size="sm">Deadlift 1RM</Text>
                    <Text size="sm">{strengthMetrics.deadlift_1rm} kg</Text>
                  </Group>
                  <Group position="apart">
                    <Text size="sm">Power Clean 1RM</Text>
                    <Text size="sm">{strengthMetrics.power_clean_1rm} kg</Text>
                  </Group>
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card withBorder h="100%">
              <Stack>
                <Group position="apart">
                  <Text fw={500}>Speed</Text>
                  <Text fw={700}>{speedMetrics.speed_score}/100</Text>
                </Group>
                <Progress value={speedMetrics.speed_score} color="green" size="md" />
                
                <Stack spacing={5} mt="xs">
                  <Group position="apart">
                    <Text size="sm">30m Sprint</Text>
                    <Text size="sm">{speedMetrics['30m_best']} s</Text>
                  </Group>
                  <Group position="apart">
                    <Text size="sm">60m Sprint</Text>
                    <Text size="sm">{speedMetrics['60m_best']} s</Text>
                  </Group>
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card withBorder h="100%">
              <Stack>
                <Group position="apart">
                  <Text fw={500}>Power</Text>
                  <Text fw={700}>{powerMetrics.power_score}/100</Text>
                </Group>
                <Progress value={powerMetrics.power_score} color="orange" size="md" />
                
                <Stack spacing={5} mt="xs">
                  <Group position="apart">
                    <Text size="sm">Vertical Jump</Text>
                    <Text size="sm">{powerMetrics.vertical_jump} cm</Text>
                  </Group>
                  <Group position="apart">
                    <Text size="sm">Broad Jump</Text>
                    <Text size="sm">{powerMetrics.broad_jump} cm</Text>
                  </Group>
                  <Group position="apart">
                    <Text size="sm">Med Ball Throw</Text>
                    <Text size="sm">{powerMetrics.med_ball_throw} cm</Text>
                  </Group>
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
}
