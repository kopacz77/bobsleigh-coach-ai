'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  Text, 
  Group, 
  Stack, 
  Title,
  SegmentedControl,
  Center,
  Loader,
  useMantineTheme,
  Select
} from '@mantine/core';
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
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/lib/supabase';
import dayjs from 'dayjs';

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

type WellbeingData = {
  id: string;
  date: string;
  sleep_quality: number;
  stress_level: number;
  nutrition_quality: number;
  physical_readiness: number;
  mental_clarity: number;
};

type MetricsData = {
  id: string;
  date: string;
  metrics: {
    body_weight?: number;
    resting_heart_rate?: number;
    sleep_hours?: number;
  };
};

// Define proper types for chart data
interface Dataset {
  label: string;
  data: (number | null)[];
  borderColor: string;
  backgroundColor: string;
  tension: number;
  yAxisID?: string;
}

interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export function WellbeingTrends() {
  const [assessments, setAssessments] = useState<WellbeingData[]>([]);
  const [metrics, setMetrics] = useState<MetricsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartType, setChartType] = useState('subjective');
  const theme = useMantineTheme();

  useEffect(() => {
    fetchData();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: timeRange and chartType are used in prepareChartData
  useEffect(() => {
    if (assessments.length > 0 || metrics.length > 0) {
      prepareChartData();
    }
  }, [assessments, metrics, timeRange, chartType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch wellbeing assessments
      const { data: wellbeingData, error: wellbeingError } = await supabase
        .from('wellbeing_assessments')
        .select('id, date, sleep_quality, stress_level, nutrition_quality, physical_readiness, mental_clarity')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (wellbeingError) throw wellbeingError;
      setAssessments(wellbeingData || []);

      // Fetch metrics data
      const { data: metricsData, error: metricsError } = await supabase
        .from('daily_metrics')
        .select('id, date, metrics')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (metricsError) throw metricsError;
      setMetrics(metricsData || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch wellbeing data';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    // Filter based on selected time range
    const cutoffDate = dayjs().subtract(Number.parseInt(timeRange), 'days').format('YYYY-MM-DD');
    
    let filteredData: WellbeingData[] | MetricsData[] = [];
    let dates: string[] = [];
    let datasets: Dataset[] = [];

    if (chartType === 'subjective') {
      filteredData = assessments.filter(a => a.date >= cutoffDate);
      
      if (filteredData.length === 0) {
        setChartData(null);
        return;
      }

      dates = filteredData.map(d => dayjs(d.date).format('MMM D'));
      
      datasets = [
        {
          label: 'Sleep Quality',
          data: (filteredData as WellbeingData[]).map(d => d.sleep_quality),
          borderColor: theme.colors.blue[6],
          backgroundColor: 'rgba(0,0,0,0)',
          tension: 0.3,
        },
        {
          label: 'Stress Level',
          data: (filteredData as WellbeingData[]).map(d => d.stress_level),
          borderColor: theme.colors.red[6],
          backgroundColor: 'rgba(0,0,0,0)',
          tension: 0.3,
        },
        {
          label: 'Nutrition Quality',
          data: (filteredData as WellbeingData[]).map(d => d.nutrition_quality),
          borderColor: theme.colors.green[6],
          backgroundColor: 'rgba(0,0,0,0)',
          tension: 0.3,
        },
        {
          label: 'Physical Readiness',
          data: (filteredData as WellbeingData[]).map(d => d.physical_readiness),
          borderColor: theme.colors.orange[6],
          backgroundColor: 'rgba(0,0,0,0)',
          tension: 0.3,
        },
        {
          label: 'Mental Clarity',
          data: (filteredData as WellbeingData[]).map(d => d.mental_clarity),
          borderColor: theme.colors.violet[6],
          backgroundColor: 'rgba(0,0,0,0)',
          tension: 0.3,
        },
      ];
    } else {
      filteredData = metrics.filter(m => m.date >= cutoffDate);
      
      if (filteredData.length === 0) {
        setChartData(null);
        return;
      }

      dates = filteredData.map(d => dayjs(d.date).format('MMM D'));
      
      const bodyWeights = (filteredData as MetricsData[]).map(d => d.metrics.body_weight || null);
      const hasBodyWeight = bodyWeights.some(w => w !== null);
      
      const heartRates = (filteredData as MetricsData[]).map(d => d.metrics.resting_heart_rate || null);
      const hasHeartRate = heartRates.some(hr => hr !== null);
      
      const sleepHours = (filteredData as MetricsData[]).map(d => d.metrics.sleep_hours || null);
      const hasSleepHours = sleepHours.some(s => s !== null);
      
      if (hasBodyWeight) {
        datasets.push({
          label: 'Body Weight (kg)',
          data: bodyWeights,
          borderColor: theme.colors.blue[6],
          backgroundColor: 'rgba(0,0,0,0)',
          tension: 0.3,
          yAxisID: 'y',
        });
      }
      
      if (hasHeartRate) {
        datasets.push({
          label: 'Resting HR (bpm)',
          data: heartRates,
          borderColor: theme.colors.red[6],
          backgroundColor: 'rgba(0,0,0,0)',
          tension: 0.3,
          yAxisID: 'y1',
        });
      }
      
      if (hasSleepHours) {
        datasets.push({
          label: 'Sleep Hours',
          data: sleepHours,
          borderColor: theme.colors.green[6],
          backgroundColor: 'rgba(0,0,0,0)',
          tension: 0.3,
          yAxisID: 'y2',
        });
      }
      
      if (datasets.length === 0) {
        setChartData(null);
        return;
      }
    }

    setChartData({
      labels: dates,
      datasets,
    });
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: chartType === 'subjective' ? 10 : undefined,
        title: {
          display: true,
          text: chartType === 'subjective' ? 'Score (0-10)' : 'Weight (kg)',
        },
      },
      ...(chartType === 'objective' ? {
        y1: {
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'HR (bpm)',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
        y2: {
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Sleep (hrs)',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      } : {}),
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
        <Group justify="apart">
          <Title order={3}>Wellbeing Trends</Title>
          
          <Group>
            <SegmentedControl
              value={chartType}
              onChange={setChartType}
              data={[
                { label: 'Subjective', value: 'subjective' },
                { label: 'Objective', value: 'objective' },
              ]}
            />
            
            <Select
              value={timeRange}
              onChange={(value) => setTimeRange(value || '30')}
              data={[
                { label: '7 Days', value: '7' },
                { label: '30 Days', value: '30' },
                { label: '90 Days', value: '90' },
                { label: '180 Days', value: '180' },
                { label: '365 Days', value: '365' },
              ]}
              style={{ width: 120 }}
            />
          </Group>
        </Group>
        
        <Text c="dimmed" size="sm">
          {chartType === 'subjective' 
            ? 'Track your subjective wellbeing metrics over time to identify trends and patterns.' 
            : 'Monitor your objective health metrics to understand your physical wellbeing trends.'}
        </Text>
        
        {loading ? (
          <Center h={400}>
            <Loader />
          </Center>
        ) : chartData ? (
          <div style={{ height: 400 }}>
            <Line data={chartData} options={options} />
          </div>
        ) : (
          <Center h={400}>
            <Text c="dimmed">No data available for the selected time period</Text>
          </Center>
        )}
      </Stack>
    </Card>
  );
}