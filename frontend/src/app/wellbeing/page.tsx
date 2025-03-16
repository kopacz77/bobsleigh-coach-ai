import React from 'react';
import { Container, Tabs, Box, Paper, Title, Text } from '@mantine/core';
import { 
  WellbeingAssessment, 
  MoodTracking, 
  PhysicalMetrics,
  Reflection, 
  RecoveryHealth 
} from '../../components/wellbeing';

/**
 * Wellbeing Dashboard Page
 * This page demonstrates how to use all wellbeing components together
 */
export default function WellbeingPage() {
  // In a real application, this would come from your auth context
  const currentUserId = '123e4567-e89b-12d3-a456-426614174000';
  
  return (
    <Container size="xl" py="xl">
      <Paper p="md" radius="md" withBorder mb="xl">
        <Title order={1} mb="sm">Athlete Wellbeing Dashboard</Title>
        <Text color="dimmed" mb="xl">
          Track and manage all aspects of your physical and mental wellbeing to optimize performance and recovery.
        </Text>
      </Paper>
      
      <Tabs defaultValue="assessment">
        <Tabs.List>
          <Tabs.Tab value="assessment">Daily Assessment</Tabs.Tab>
          <Tabs.Tab value="mood">Mood Tracking</Tabs.Tab>
          <Tabs.Tab value="metrics">Physical Metrics</Tabs.Tab>
          <Tabs.Tab value="reflection">Reflections</Tabs.Tab>
          <Tabs.Tab value="recovery">Recovery & Health</Tabs.Tab>
        </Tabs.List>

        <Box mt="xl">
          <Tabs.Panel value="assessment">
            <WellbeingAssessment userId={currentUserId} date={new Date()} />
          </Tabs.Panel>
          
          <Tabs.Panel value="mood">
            <MoodTracking userId={currentUserId} />
          </Tabs.Panel>
          
          <Tabs.Panel value="metrics">
            <PhysicalMetrics userId={currentUserId} />
          </Tabs.Panel>
          
          <Tabs.Panel value="reflection">
            <Reflection userId={currentUserId} />
          </Tabs.Panel>
          
          <Tabs.Panel value="recovery">
            <RecoveryHealth userId={currentUserId} />
          </Tabs.Panel>
        </Box>
      </Tabs>
    </Container>
  );
}
