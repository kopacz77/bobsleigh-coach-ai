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
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/lib/supabase';
import dayjs from 'dayjs';

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

interface RechartsDataPoint {
  date: string;
  [key: string]: string | number | null;
}

export function WellbeingTrends() {
  const [assessments, setAssessments] = useState<WellbeingData[]>([]);
  const [metrics, setMetrics] = useState<MetricsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [chartData, setChartData] = useState<RechartsDataPoint[] | null>(null);
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
    const cutoffDate = dayjs().subtract(Number.parseInt(timeRange), 'days').format('YYYY-MM-DD');

    if (chartType === 'subjective') {
      const filteredData = assessments.filter(a => a.date >= cutoffDate);

      if (filteredData.length === 0) {
        setChartData(null);
        return;
      }

      const data: RechartsDataPoint[] = filteredData.map(d => ({
        date: dayjs(d.date).format('MMM D'),
        sleepQuality: d.sleep_quality,
        stressLevel: d.stress_level,
        nutritionQuality: d.nutrition_quality,
        physicalReadiness: d.physical_readiness,
        mentalClarity: d.mental_clarity,
      }));

      setChartData(data);
    } else {
      const filteredData = metrics.filter(m => m.date >= cutoffDate);

      if (filteredData.length === 0) {
        setChartData(null);
        return;
      }

      const data: RechartsDataPoint[] = filteredData.map(d => ({
        date: dayjs(d.date).format('MMM D'),
        bodyWeight: d.metrics.body_weight ?? null,
        restingHR: d.metrics.resting_heart_rate ?? null,
        sleepHours: d.metrics.sleep_hours ?? null,
      }));

      // Check if any objective metrics have data
      const hasAnyData = data.some(d =>
        d.bodyWeight !== null || d.restingHR !== null || d.sleepHours !== null
      );

      if (!hasAnyData) {
        setChartData(null);
        return;
      }

      setChartData(data);
    }
  };

  const renderSubjectiveChart = () => {
    if (!chartData) return null;
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 10]} label={{ value: 'Score (0-10)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="sleepQuality" stroke={theme.colors.blue[6]} name="Sleep Quality" dot={false} />
          <Line type="monotone" dataKey="stressLevel" stroke={theme.colors.red[6]} name="Stress Level" dot={false} />
          <Line type="monotone" dataKey="nutritionQuality" stroke={theme.colors.green[6]} name="Nutrition Quality" dot={false} />
          <Line type="monotone" dataKey="physicalReadiness" stroke={theme.colors.orange[6]} name="Physical Readiness" dot={false} />
          <Line type="monotone" dataKey="mentalClarity" stroke={theme.colors.violet[6]} name="Mental Clarity" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderObjectiveChart = () => {
    if (!chartData) return null;
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'HR (bpm) / Sleep (hrs)', angle: 90, position: 'insideRight' }} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="bodyWeight" stroke={theme.colors.blue[6]} name="Body Weight (kg)" dot={false} connectNulls />
          <Line yAxisId="right" type="monotone" dataKey="restingHR" stroke={theme.colors.red[6]} name="Resting HR (bpm)" dot={false} connectNulls />
          <Line yAxisId="right" type="monotone" dataKey="sleepHours" stroke={theme.colors.green[6]} name="Sleep Hours" dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    );
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
            {chartType === 'subjective' ? renderSubjectiveChart() : renderObjectiveChart()}
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
