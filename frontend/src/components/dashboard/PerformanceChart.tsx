'use client';

import { useEffect, useState } from 'react';
import { Card, Group, Title, SegmentedControl, Text, Stack, rem } from '@mantine/core';
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
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

export function PerformanceChart() {
  const [timeRange, setTimeRange] = useState('4w'); // Options: 1w, 4w, 3m, 1y
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    // This would normally be a data fetch from API
    // but for now we're using static data

    const labels = {
      '1w': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      '4w': ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      '3m': ['Jan', 'Feb', 'Mar'],
      '1y': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    }[timeRange];

    const ctlData = {
      '1w': [75, 78, 78, 80, 82, 85, 86],
      '4w': [70, 74, 80, 86],
      '3m': [60, 72, 86],
      '1y': [40, 45, 52, 58, 64, 70, 75, 78, 82, 85, 87, 86]
    }[timeRange];

    const atlData = {
      '1w': [80, 85, 82, 88, 90, 95, 92],
      '4w': [75, 82, 88, 92],
      '3m': [65, 78, 92],
      '1y': [42, 48, 55, 62, 68, 75, 80, 82, 85, 88, 92, 90]
    }[timeRange];

    const tsbData = {
      '1w': [-5, -7, -4, -8, -8, -10, -6],
      '4w': [-5, -8, -8, -6],
      '3m': [-5, -6, -6],
      '1y': [-2, -3, -3, -4, -4, -5, -5, -4, -3, -3, -5, -4]
    }[timeRange];

    setChartData({
      labels,
      datasets: [
        {
          label: 'CTL (Fitness)',
          data: ctlData,
          borderColor: '#228be6',
          backgroundColor: '#228be6',
          tension: 0.4,
          pointRadius: 3,
        },
        {
          label: 'ATL (Fatigue)',
          data: atlData,
          borderColor: '#fa5252',
          backgroundColor: '#fa5252',
          tension: 0.4,
          pointRadius: 3,
        },
        {
          label: 'TSB (Form)',
          data: tsbData,
          borderColor: '#40c057',
          backgroundColor: '#40c057',
          tension: 0.4,
          pointRadius: 3,
          yAxisID: 'y1',
        },
      ],
    });
  }, [timeRange]);

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Training Load',
        },
        min: timeRange === '1y' ? 35 : 50,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Training Stress Balance',
        },
        grid: {
          drawOnChartArea: false,
        },
        min: -15,
        max: 5,
      },
    },
  };

  return (
    <Card withBorder shadow="sm" p="md">
      <Stack spacing="md">
        <Group position="apart">
          <Title order={3}>Performance Management Chart</Title>
          <SegmentedControl
            value={timeRange}
            onChange={setTimeRange}
            data={[
              { label: '1W', value: '1w' },
              { label: '4W', value: '4w' },
              { label: '3M', value: '3m' },
              { label: '1Y', value: '1y' },
            ]}
            size="xs"
          />
        </Group>

        <Group position="apart">
          <Stack spacing={0}>
            <Text fw={500}>Current Metrics</Text>
            <Group spacing="lg">
              <Text size="sm">CTL: <Text span fw={700} c="blue">86</Text></Text>
              <Text size="sm">ATL: <Text span fw={700} c="red">92</Text></Text>
              <Text size="sm">TSB: <Text span fw={700} c={-6 > 0 ? 'green' : 'red'}>-6</Text></Text>
            </Group>
          </Stack>
        </Group>

        <div style={{ height: rem(320) }}>
          {chartData && <Line options={options} data={chartData} />}
        </div>
      </Stack>
    </Card>
  );
}
