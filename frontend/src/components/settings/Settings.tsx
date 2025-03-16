'use client';

import { useState } from 'react';
import { Button, Card, Group, SegmentedControl, Stack, Switch, Text, Title } from '@mantine/core';

export function Settings() {
  const [units, setUnits] = useState('metric');
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [dataSharing, setDataSharing] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, you would submit to your API
      console.log('Saving settings:', {
        units,
        notifications,
        emailUpdates,
        dataSharing,
        autoSync,
      });
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Show success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Stack spacing="lg">
      <Card withBorder p="md" radius="md">
        <Stack>
          <Title order={3}>Application Settings</Title>
          
          <Group position="apart">
            <Text>Units</Text>
            <SegmentedControl
              value={units}
              onChange={setUnits}
              data={[
                { label: 'Metric', value: 'metric' },
                { label: 'Imperial', value: 'imperial' },
              ]}
            />
          </Group>
          
          <Group position="apart">
            <Text>Push Notifications</Text>
            <Switch 
              checked={notifications} 
              onChange={(event) => setNotifications(event.currentTarget.checked)} 
            />
          </Group>
          
          <Group position="apart">
            <Text>Email Updates</Text>
            <Switch 
              checked={emailUpdates} 
              onChange={(event) => setEmailUpdates(event.currentTarget.checked)} 
            />
          </Group>
        </Stack>
      </Card>
      
      <Card withBorder p="md" radius="md">
        <Stack>
          <Title order={3}>Data Settings</Title>
          
          <Group position="apart">
            <div>
              <Text>Anonymous Data Sharing</Text>
              <Text size="xs" color="dimmed">Share anonymous training data to improve AI recommendations</Text>
            </div>
            <Switch 
              checked={dataSharing} 
              onChange={(event) => setDataSharing(event.currentTarget.checked)} 
            />
          </Group>
          
          <Group position="apart">
            <div>
              <Text>Auto-Sync Data</Text>
              <Text size="xs" color="dimmed">Automatically sync data with connected devices</Text>
            </div>
            <Switch 
              checked={autoSync} 
              onChange={(event) => setAutoSync(event.currentTarget.checked)} 
            />
          </Group>
        </Stack>
      </Card>
      
      <Group position="right">
        <Button onClick={handleSubmit} loading={isSubmitting}>Save Settings</Button>
      </Group>
    </Stack>
  );
}
