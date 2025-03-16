import React, { useState, useEffect } from 'react';
import {
  Box,
  Title,
  Text,
  Group,
  Paper,
  SimpleGrid,
  Button,
  NumberInput,
  Select,
  Modal,
  ActionIcon,
  useMantineTheme,
  Divider,
  ThemeIcon,
  List
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { 
  IconHeart, 
  IconWeight, 
  IconRuler2, 
  IconZzz, 
  IconPencil, 
  IconPlus,
  IconEye,
  IconHeartRateMonitor,
  IconTrash
} from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, TooltipProps } from 'recharts';

/**
 * Metric type definition
 */
interface MetricType {
  value: string;
  label: string;
  icon: React.FC<any>;
  color: string;
  unit: string;
}

/**
 * Metric entry from database
 */
interface Metric {
  id: number;
  user_id: string;
  date: string;
  type: string;
  value: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Form state for new/edit metric
 */
interface NewMetric {
  id?: number;
  date: Date;
  type: string;
  value: string | number;
  notes: string;
}

/**
 * Chart data format
 */
interface ChartData {
  date: string;
  [key: string]: string | number;
}

/**
 * Unique metric type for chart
 */
interface UniqueMetricType {
  value: string;
  color: string;
  label: string;
  unit: string;
}

/**
 * PhysicalMetrics component props
 */
interface PhysicalMetricsProps {
  userId: string;
}

/**
 * PhysicalMetrics component for tracking athlete's physical measurements
 * like heart rate, weight, body fat, sleep duration, etc.
 */
const PhysicalMetrics: React.FC<PhysicalMetricsProps> = ({ userId }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);
  const [viewModalOpened, { open: openViewModal, close: closeViewModal }] = useDisclosure(false);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [selectedMetricType, setSelectedMetricType] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('week');

  // Form state
  const [newMetric, setNewMetric] = useState<NewMetric>({
    date: new Date(),
    type: '',
    value: '',
    notes: ''
  });

  // Available metric types
  const metricTypes: MetricType[] = [
    { value: 'resting_heart_rate', label: 'Resting Heart Rate (bpm)', icon: IconHeart, color: 'red', unit: 'bpm' },
    { value: 'weight', label: 'Weight', icon: IconWeight, color: 'blue', unit: 'kg' },
    { value: 'body_fat', label: 'Body Fat %', icon: IconRuler2, color: 'orange', unit: '%' },
    { value: 'sleep_duration', label: 'Sleep Duration', icon: IconZzz, color: 'violet', unit: 'hours' },
    { value: 'hrv', label: 'Heart Rate Variability', icon: IconHeartRateMonitor, color: 'pink', unit: 'ms' }
  ];

  // Fetch metrics data
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!userId) return;

      try {
        let query = supabase
          .from('physical_metrics')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        // Apply time range filter
        const today = new Date();
        let startDate: Date;
        
        switch (timeRange) {
          case 'week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            query = query.gte('date', startDate.toISOString().split('T')[0]);
            break;
          case 'month':
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 1);
            query = query.gte('date', startDate.toISOString().split('T')[0]);
            break;
          case 'quarter':
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 3);
            query = query.gte('date', startDate.toISOString().split('T')[0]);
            break;
          case 'year':
            startDate = new Date(today);
            startDate.setFullYear(today.getFullYear() - 1);
            query = query.gte('date', startDate.toISOString().split('T')[0]);
            break;
          // 'all' case doesn't need additional filter
        }

        // Apply metric type filter
        if (selectedMetricType !== 'all') {
          query = query.eq('type', selectedMetricType);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching physical metrics:', error);
          return;
        }

        setMetrics(data || []);
      } catch (error) {
        console.error('Error in physical metrics fetch:', error);
      }
    };

    fetchMetrics();
  }, [userId, supabase, timeRange, selectedMetricType]);

  // Handle form field changes
  const handleDateChange = (value: Date | null) => {
    if (value) {
      setNewMetric(prev => ({ ...prev, date: value }));
    }
  };
  
  const handleTypeChange = (value: string | null) => {
    setNewMetric(prev => ({ ...prev, type: value || '', value: '' }));
  };
  
  const handleValueChange = (value: number | string) => setNewMetric(prev => ({ ...prev, value }));
  
  const handleNotesChange = (value: string | null) => {
    setNewMetric(prev => ({ ...prev, notes: value || '' }));
  };

  // Get metric type details
  const getMetricTypeDetails = (type: string): Partial<MetricType> => {
    return metricTypes.find(metric => metric.value === type) || {};
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Open view metric modal
  const handleViewMetric = (metric: Metric) => {
    setSelectedMetric(metric);
    openViewModal();
  };

  // Open add/edit metric modal
  const handleAddEditMetric = (metric: Metric | null = null) => {
    if (metric) {
      setNewMetric({
        id: metric.id,
        date: new Date(metric.date),
        type: metric.type,
        value: metric.value,
        notes: metric.notes || ''
      });
    } else {
      setNewMetric({
        date: new Date(),
        type: '',
        value: '',
        notes: ''
      });
    }
    openAddModal();
  };

  // Delete metric
  const handleDeleteMetric = async () => {
    if (!selectedMetric) return;
    
    setDeleteLoading(true);
    
    try {
      const { error } = await supabase
        .from('physical_metrics')
        .delete()
        .eq('id', selectedMetric.id);
      
      if (error) {
        throw error;
      }

      showNotification({
        title: 'Success',
        message: 'Metric deleted successfully',
        color: 'green',
      });

      // Refresh metrics data
      const { data } = await supabase
        .from('physical_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      setMetrics(data || []);
      closeViewModal();
    } catch (error) {
      console.error('Error deleting metric:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to delete metric',
        color: 'red',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Submit metric data
  const handleSubmit = async () => {
    if (!newMetric.type || !newMetric.value) {
      showNotification({
        title: 'Missing Information',
        message: 'Please fill in all required fields',
        color: 'orange',
      });
      return;
    }

    setLoading(true);
    
    try {
      const metricData = {
        user_id: userId,
        date: newMetric.date.toISOString().split('T')[0],
        type: newMetric.type,
        value: parseFloat(newMetric.value.toString()),
        notes: newMetric.notes || null
      };

      let query;
      
      if (newMetric.id) {
        // Update existing metric
        query = supabase
          .from('physical_metrics')
          .update(metricData)
          .eq('id', newMetric.id);
      } else {
        // Insert new metric
        query = supabase
          .from('physical_metrics')
          .insert(metricData);
      }

      const { error } = await query;
      
      if (error) {
        throw error;
      }

      showNotification({
        title: 'Success',
        message: 'Metric saved successfully',
        color: 'green',
      });

      // Refresh metrics data
      const { data } = await supabase
        .from('physical_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      setMetrics(data || []);
      closeAddModal();
    } catch (error) {
      console.error('Error saving metric:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to save metric',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const prepareChartData = (): ChartData[] => {
    if (!metrics.length) return [];
    
    // Make a deep copy of metrics and sort by date
    const sortedMetrics = [...metrics]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group by date and type for the chart
    const chartData: ChartData[] = [];
    
    sortedMetrics.forEach(metric => {
      const existingDateEntry = chartData.find(entry => entry.date === metric.date);
      
      if (existingDateEntry) {
        existingDateEntry[metric.type] = metric.value;
      } else {
        const newEntry: ChartData = { date: metric.date, [metric.type]: metric.value };
        chartData.push(newEntry);
      }
    });

    return chartData;
  };

  // Get unique metric types in the current dataset
  const getUniqueMetricTypes = (): UniqueMetricType[] => {
    const types = [...new Set(metrics.map(metric => metric.type))];
    return types.map(type => {
      const details = getMetricTypeDetails(type);
      return {
        value: type,
        color: details.color || 'gray',
        label: details.label || type,
        unit: details.unit || ''
      };
    });
  };

  // Format chart tooltip
  type CustomTooltipProps = TooltipProps<number, string>;
  
  const renderTooltip = (props: CustomTooltipProps): JSX.Element | null => {
    const { active, payload, label } = props;
    
    if (active && payload && payload.length) {
      return (
        <Paper p="xs" withBorder shadow="sm">
          <Text weight={600}>{formatDate(label)}</Text>
          {payload.map((entry, index) => {
            const metricType = getMetricTypeDetails(entry.dataKey);
            return (
              <Text key={index} size="sm" style={{ color: entry.color }}>
                {metricType.label}: {entry.value} {metricType.unit}
              </Text>
            );
          })}
        </Paper>
      );
    }

    return null;
  };

  return (
    <Box>
      <Title order={2} mb="md">Physical Metrics Tracking</Title>
      <Text color="dimmed" mb="xl">
        Monitor your key physical measurements to track trends and inform your training.
      </Text>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mb="xl">
        <Paper p="md" radius="md" withBorder>
          <Group position="apart" mb="lg">
            <Text weight={600} size="lg">Recent Metrics</Text>
            <Button
              leftIcon={<IconPlus size={16} />}
              size="sm"
              onClick={() => handleAddEditMetric()}
            >
              Add New Metric
            </Button>
          </Group>

          <Group position="apart" mb="md">
            <Select
              label="Metric Type"
              value={selectedMetricType}
              onChange={(value) => setSelectedMetricType(value || 'all')}
              data={[
                { value: 'all', label: 'All Metrics' },
                ...metricTypes
              ]}
              size="sm"
              style={{ width: '48%' }}
            />
            <Select
              label="Time Range"
              value={timeRange}
              onChange={(value) => setTimeRange(value || 'week')}
              data={[
                { value: 'week', label: 'Last 7 Days' },
                { value: 'month', label: 'Last 30 Days' },
                { value: 'quarter', label: 'Last 3 Months' },
                { value: 'year', label: 'Last Year' },
                { value: 'all', label: 'All Time' }
              ]}
              size="sm"
              style={{ width: '48%' }}
            />
          </Group>

          {metrics.length > 0 ? (
            <List spacing="xs" size="sm" mb="xs" center>
              {metrics.slice(0, 5).map((metric) => {
                const metricType = getMetricTypeDetails(metric.type);
                const MetricIcon = metricType.icon;
                return (
                  <List.Item
                    key={metric.id}
                    icon={
                      <ThemeIcon color={metricType.color || 'blue'} size={24} radius="xl">
                        {MetricIcon && <MetricIcon size={16} />}
                      </ThemeIcon>
                    }
                  >
                    <Group position="apart" noWrap>
                      <Box>
                        <Group spacing="xs">
                          <Text weight={500}>{metricType.label}:</Text>
                          <Text>{metric.value} {metricType.unit}</Text>
                        </Group>
                        <Text size="xs" color="dimmed">{formatDate(metric.date)}</Text>
                      </Box>
                      <Group spacing={0}>
                        <ActionIcon onClick={() => handleViewMetric(metric)}>
                          <IconEye size={18} />
                        </ActionIcon>
                        <ActionIcon onClick={() => handleAddEditMetric(metric)}>
                          <IconPencil size={18} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </List.Item>
                );
              })}
            </List>
          ) : (
            <Text color="dimmed" align="center" py="xl">
              No metrics recorded in the selected time range.
            </Text>
          )}

          {metrics.length > 5 && (
            <Text size="sm" align="center" color="dimmed">
              Showing 5 of {metrics.length} entries.
            </Text>
          )}
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Text weight={600} size="lg" mb="lg">Metrics Trends</Text>
          
          {metrics.length > 0 ? (
            <Box style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={prepareChartData()}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={renderTooltip} />
                  <Legend />
                  {getUniqueMetricTypes().map((type) => (
                    <Line
                      key={type.value}
                      type="monotone"
                      dataKey={type.value}
                      stroke={theme.colors[type.color][6]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name={type.label}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Text color="dimmed" align="center" py="xl">
              No metrics data available to show trends.
            </Text>
          )}
        </Paper>
      </SimpleGrid>

      {/* Add/Edit Metric Modal */}
      <Modal
        opened={addModalOpened}
        onClose={closeAddModal}
        title={<Text weight={600}>{newMetric.id ? 'Edit Metric' : 'Add New Metric'}</Text>}
        size="md"
      >
        <DatePickerInput
          label="Date"
          placeholder="Select date"
          value={newMetric.date}
          onChange={handleDateChange}
          maxDate={new Date()}
          clearable={false}
          mb="md"
          required
        />

        <Select
          label="Metric Type"
          placeholder="Select metric type"
          data={metricTypes}
          value={newMetric.type}
          onChange={handleTypeChange}
          mb="md"
          required
        />

        {newMetric.type && (
          <NumberInput
            label={`Value (${getMetricTypeDetails(newMetric.type).unit || ''})`}
            placeholder="Enter value"
            value={typeof newMetric.value === 'string' ? parseFloat(newMetric.value) || undefined : newMetric.value}
            onChange={handleValueChange}
            precision={2}
            min={0}
            mb="md"
            required
          />
        )}

        <Select
          label="Notes (Optional)"
          placeholder="Add notes"
          data={[
            { value: 'Measured in the morning', label: 'Measured in the morning' },
            { value: 'Measured after workout', label: 'Measured after workout' },
            { value: 'Feeling better than usual', label: 'Feeling better than usual' },
            { value: 'Feeling worse than usual', label: 'Feeling worse than usual' },
          ]}
          value={newMetric.notes}
          onChange={handleNotesChange}
          searchable
          clearable
          creatable
          getCreateLabel={(query) => `Add "${query}"`}
          mb="xl"
        />

        <Group position="right">
          <Button variant="outline" onClick={closeAddModal}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!newMetric.type || !newMetric.value}
          >
            {newMetric.id ? 'Update Metric' : 'Save Metric'}
          </Button>
        </Group>
      </Modal>

      {/* View Metric Modal */}
      <Modal
        opened={viewModalOpened}
        onClose={closeViewModal}
        title={<Text weight={600}>Metric Details</Text>}
        size="md"
      >
        {selectedMetric && (
          <Box>
            <SimpleGrid cols={2} spacing="md">
              <Box>
                <Text size="sm" color="dimmed">Date</Text>
                <Text weight={500}>{formatDate(selectedMetric.date)}</Text>
              </Box>
              <Box>
                <Text size="sm" color="dimmed">Metric Type</Text>
                <Text weight={500}>{getMetricTypeDetails(selectedMetric.type).label}</Text>
              </Box>
              <Box>
                <Text size="sm" color="dimmed">Value</Text>
                <Text weight={500}>
                  {selectedMetric.value} {getMetricTypeDetails(selectedMetric.type).unit}
                </Text>
              </Box>
              {selectedMetric.notes && (
                <Box>
                  <Text size="sm" color="dimmed">Notes</Text>
                  <Text>{selectedMetric.notes}</Text>
                </Box>
              )}
            </SimpleGrid>

            <Divider my="lg" />

            <Group position="right">
              <Button 
                leftIcon={<IconPencil size={16} />}
                variant="outline" 
                onClick={() => {
                  closeViewModal();
                  handleAddEditMetric(selectedMetric);
                }}
              >
                Edit
              </Button>
              <Button
                leftIcon={<IconTrash size={16} />}
                color="red"
                variant="outline"
                onClick={handleDeleteMetric}
                loading={deleteLoading}
              >
                Delete
              </Button>
            </Group>
          </Box>
        )}
      </Modal>
    </Box>
  );
};

export default PhysicalMetrics;