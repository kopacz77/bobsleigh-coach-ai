'use client';

import { useEffect, useState } from 'react';
import { Card, Group, Stack, Text, Title, useMantineTheme } from '@mantine/core';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title as ChartTitle, 
  Tooltip, 
  Legend,
  ChartOptions
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend
);

interface PerformanceChartProps {
  athleteId?: number;
  days?: number;
}

export function PerformanceChart({ athleteId = 1, days = 14 }: PerformanceChartProps) {
  const theme = useMantineTheme();
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    // In a real application, this data would come from an API call
    // api.get(`/api/performance/load/${athleteId}?days=${days}`)
    
    // Generate dates for the x-axis
    const dates = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Sample data for PMC metrics
    // In a real app, this would come from the backend API
    const ctlValues = [78.2, 79.5, 80.0, 80.5, 81.2, 82.0, 82.3, 82.5, 83.0, 83.7, 84.5, 85.0, 85.7, 86.1];
    const atlValues = [70.5, 72.8, 75.5, 76.8, 80.5, 83.2, 85.7, 83.4, 85.8, 88.2, 90.4, 93.4, 95.2, 96.8];
    const tsbValues = [7.7, 6.7, 4.5, 3.7, 0.7, -1.2, -3.4, -0.9, -2.8, -4.5, -5.9, -8.4, -9.5, -10.7];
    const dailyLoadValues = [60, 70, 85, 55, 95, 85, 110, 40, 90, 100, 95, 120, 105, 90];

    // Create chart data object
    const data = {
      labels: dates,
      datasets: [
        {
          label: 'CTL (Fitness)',
          data: ctlValues,
          borderColor: theme.colors.blue[6],
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderWidth: 2,
        },
        {
          label: 'ATL (Fatigue)',
          data: atlValues,
          borderColor: theme.colors.red[6],
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderWidth: 2,
        },
        {
          label: 'TSB (Form)',
          data: tsbValues,
          borderColor: theme.colors.green[6],
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderWidth: 2,
          yAxisID: 'y1',
        },
        {
          label: 'Daily Load',
          data: dailyLoadValues,
          borderColor: theme.colors.gray[6],
          backgroundColor: theme.colors.gray[3],
          borderWidth: 1,
          type: 'bar',
        },
      ],
    };

    setChartData(data);
  }, [athleteId, days, theme.colors]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        title: {
          display: true,
          text: 'Training Load',
        },
        min: 0,
      },
      y1: {
        position: 'right',
        title: {
          display: true,
          text: 'TSB (Form)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
  };

  return (
    <Card withBorder p="md" radius="md">
      <Stack>
        <Group justify="space-between">
          <Title order={3}>Performance Management Chart</Title>
        </Group>
        
        <Text size="sm" c="dimmed">
          This chart shows your training load balance over time. The CTL line shows your fitness, ATL shows fatigue, 
          and TSB shows your form (the balance between fitness and fatigue).
        </Text>
        
        <div style={{ height: 400 }}>
          {chartData ? (
            <Line data={chartData} options={options} />
          ) : (
            <Text>Loading chart data...</Text>
          )}
        </div>
      </Stack>
    </Card>
  );
}
