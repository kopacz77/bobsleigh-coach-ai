import React, { useState, useEffect } from 'react';
import {
  Box,
  Title,
  Text,
  Group,
  Paper,
  SimpleGrid,
  Button,
  Textarea,
  Modal,
  Badge,
  ActionIcon,
  Tooltip,
  useMantineTheme,
  Divider,
  Select
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  IconPlus,
  IconEye,
  IconPencil,
  IconTrash,
  IconCheck,
  IconX,
  IconMoodHappy,
  IconMoodSad,
  IconStar,
  IconStarFilled,
  IconBulb
} from '@tabler/icons-react';

/**
 * Reflection component allows athletes to write daily or session-based reflections
 * to capture thoughts on training, mental state, and learning moments.
 */
const Reflection = ({ userId }) => {
  const theme = useMantineTheme();
  const supabase = useSupabaseClient();
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);
  const [viewModalOpened, { open: openViewModal, close: closeViewModal }] = useDisclosure(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedReflection, setSelectedReflection] = useState(null);

  // Form state
  const [newReflection, setNewReflection] = useState({
    date: new Date(),
    type: 'daily',
    title: '',
    content: '',
    sentiment: 'neutral',
    key_learnings: '',
    is_favorite: false
  });

  // Reflection types
  const reflectionTypes = [
    { value: 'daily', label: 'Daily Reflection' },
    { value: 'training', label: 'Training Session' },
    { value: 'competition', label: 'Competition' },
    { value: 'recovery', label: 'Recovery Day' },
    { value: 'goal_setting', label: 'Goal Setting' }
  ];

  // Sentiment options
  const sentimentOptions = [
    { value: 'positive', label: 'Positive', icon: IconMoodHappy, color: 'green' },
    { value: 'neutral', label: 'Neutral', icon: null, color: 'blue' },
    { value: 'negative', label: 'Negative', icon: IconMoodSad, color: 'red' }
  ];

  // Fetch reflections for the current month
  useEffect(() => {
    const fetchReflections = async () => {
      if (!userId) return;

      try {
        const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

        const { data, error } = await supabase
          .from('reflections')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startOfMonth.toISOString().split('T')[0])
          .lte('date', endOfMonth.toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (error) {
          console.error('Error fetching reflections:', error);
          return;
        }

        setReflections(data || []);
      } catch (error) {
        console.error('Error in reflections fetch:', error);
      }
    };

    fetchReflections();
  }, [userId, selectedDate, supabase]);

  // Check if reflections exist for a date
  const getReflectionsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return reflections.filter(reflection => reflection.date === dateString);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Handle form field changes
  const handleDateChange = (value) => setNewReflection(prev => ({ ...prev, date: value }));
  const handleTypeChange = (value) => setNewReflection(prev => ({ ...prev, type: value }));
  const handleTitleChange = (event) => setNewReflection(prev => ({ ...prev, title: event.target.value }));
  const handleContentChange = (event) => setNewReflection(prev => ({ ...prev, content: event.target.value }));
  const handleSentimentChange = (value) => setNewReflection(prev => ({ ...prev, sentiment: value }));
  const handleKeyLearningsChange = (event) => setNewReflection(prev => ({ ...prev, key_learnings: event.target.value }));
  const handleFavoriteToggle = () => setNewReflection(prev => ({ ...prev, is_favorite: !prev.is_favorite }));

  // Reset form and open modal
  const handleAddReflection = (date = new Date()) => {
    setNewReflection({
      date,
      type: 'daily',
      title: '',
      content: '',
      sentiment: 'neutral',
      key_learnings: '',
      is_favorite: false
    });
    openAddModal();
  };

  // Edit existing reflection
  const handleEditReflection = (reflection) => {
    setNewReflection({
      id: reflection.id,
      date: new Date(reflection.date),
      type: reflection.type,
      title: reflection.title,
      content: reflection.content,
      sentiment: reflection.sentiment,
      key_learnings: reflection.key_learnings || '',
      is_favorite: reflection.is_favorite
    });
    openAddModal();
  };

  // View reflection details
  const handleViewReflection = (reflection) => {
    setSelectedReflection(reflection);
    openViewModal();
  };

  // Delete reflection
  const handleDeleteReflection = async () => {
    if (!selectedReflection) return;
    
    setDeleteLoading(true);
    
    try {
      const { error } = await supabase
        .from('reflections')
        .delete()
        .eq('id', selectedReflection.id);
      
      if (error) {
        throw error;
      }

      showNotification({
        title: 'Success',
        message: 'Reflection deleted successfully',
        color: 'green',
      });

      // Refresh reflections
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const { data } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: false });

      setReflections(data || []);
      closeViewModal();
    } catch (error) {
      console.error('Error deleting reflection:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to delete reflection',
        color: 'red',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Submit reflection
  const handleSubmit = async () => {
    if (!newReflection.title || !newReflection.content) {
      showNotification({
        title: 'Missing Information',
        message: 'Please fill in all required fields',
        color: 'orange',
      });
      return;
    }

    setLoading(true);
    
    try {
      const reflectionData = {
        user_id: userId,
        date: newReflection.date.toISOString().split('T')[0],
        type: newReflection.type,
        title: newReflection.title,
        content: newReflection.content,
        sentiment: newReflection.sentiment,
        key_learnings: newReflection.key_learnings || null,
        is_favorite: newReflection.is_favorite
      };

      let query;
      
      if (newReflection.id) {
        // Update existing reflection
        query = supabase
          .from('reflections')
          .update(reflectionData)
          .eq('id', newReflection.id);
      } else {
        // Insert new reflection
        query = supabase
          .from('reflections')
          .insert(reflectionData);
      }

      const { error } = await query;
      
      if (error) {
        throw error;
      }

      showNotification({
        title: 'Success',
        message: 'Reflection saved successfully',
        color: 'green',
      });

      // Refresh reflections
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const { data } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: false });

      setReflections(data || []);
      closeAddModal();
    } catch (error) {
      console.error('Error saving reflection:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to save reflection',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = async (reflection) => {
    try {
      const { error } = await supabase
        .from('reflections')
        .update({ is_favorite: !reflection.is_favorite })
        .eq('id', reflection.id);
      
      if (error) {
        throw error;
      }

      // Update local state
      setReflections(prev => {
        return prev.map(item => {
          if (item.id === reflection.id) {
            return { ...item, is_favorite: !item.is_favorite };
          }
          return item;
        });
      });

      if (selectedReflection && selectedReflection.id === reflection.id) {
        setSelectedReflection({ ...selectedReflection, is_favorite: !selectedReflection.is_favorite });
      }

      showNotification({
        title: 'Success',
        message: `Reflection ${reflection.is_favorite ? 'removed from' : 'added to'} favorites`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to update favorite status',
        color: 'red',
      });
    }
  };

  // Custom day renderer for the calendar
  const renderDay = (date) => {
    const dayReflections = getReflectionsForDate(date);
    
    if (!dayReflections.length) {
      return <div>{date.getDate()}</div>;
    }

    return (
      <Box style={{ position: 'relative' }}>
        <div>{date.getDate()}</div>
        <Box style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)' }}>
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: theme.colors.blue[6]
            }}
          />
        </Box>
      </Box>
    );
  };

  // Get sentiment details
  const getSentimentDetails = (sentiment) => {
    return sentimentOptions.find(option => option.value === sentiment) || {};
  };

  return (
    <Box>
      <Title order={2} mb="md">Reflections Journal</Title>
      <Text color="dimmed" mb="xl">
        Capture your thoughts, experiences, and insights to build self-awareness and track your mental progress.
      </Text>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        <Paper p="md" radius="md" withBorder>
          <Group position="apart" mb="lg">
            <Text weight={600} size="lg">Reflection Calendar</Text>
            <Button
              leftIcon={<IconPlus size={16} />}
              size="sm"
              onClick={() => handleAddReflection(new Date())}
            >
              New Reflection
            </Button>
          </Group>
          
          <Calendar
            value={selectedDate}
            onChange={setSelectedDate}
            size="lg"
            fullWidth
            renderDay={renderDay}
            styles={{
              day: {
                height: 60
              }
            }}
          />
          
          <Text size="sm" color="dimmed" mt="md" align="center">
            Blue dots indicate days with reflections.
          </Text>
        </Paper>

        <Box>
          <Paper p="md" radius="md" withBorder mb="md">
            <Group position="apart">
              <Text weight={600} size="lg">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <Badge size="lg">
                {reflections.length} {reflections.length === 1 ? 'Reflection' : 'Reflections'}
              </Badge>
            </Group>
          </Paper>

          {getReflectionsForDate(selectedDate).length > 0 ? (
            getReflectionsForDate(selectedDate).map(reflection => (
              <Paper key={reflection.id} p="md" radius="md" withBorder mb="md">
                <Group position="apart" mb="xs">
                  <Group spacing="xs">
                    <Badge
                      size="sm"
                      color={reflection.type === 'daily' ? 'blue' : 
                             reflection.type === 'training' ? 'green' : 
                             reflection.type === 'competition' ? 'orange' : 
                             reflection.type === 'recovery' ? 'teal' : 'grape'}
                    >
                      {reflectionTypes.find(t => t.value === reflection.type)?.label || reflection.type}
                    </Badge>
                    <Badge
                      size="sm"
                      color={getSentimentDetails(reflection.sentiment).color}
                      leftSection={getSentimentDetails(reflection.sentiment).icon && 
                        <getSentimentDetails(reflection.sentiment).icon size={10} />}
                    >
                      {getSentimentDetails(reflection.sentiment).label}
                    </Badge>
                  </Group>
                  <Tooltip label={reflection.is_favorite ? "Remove from favorites" : "Add to favorites"}>
                    <ActionIcon onClick={() => handleToggleFavorite(reflection)} color="yellow">
                      {reflection.is_favorite ? <IconStarFilled size={18} /> : <IconStar size={18} />}
                    </ActionIcon>
                  </Tooltip>
                </Group>
                
                <Text weight={600} size="lg" mb="xs">{reflection.title}</Text>
                <Text lineClamp={3} size="sm" mb="md">{reflection.content}</Text>
                
                <Group position="right" spacing="xs">
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => handleViewReflection(reflection)}
                    leftIcon={<IconEye size={16} />}
                  >
                    View
                  </Button>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => handleEditReflection(reflection)}
                    leftIcon={<IconPencil size={16} />}
                  >
                    Edit
                  </Button>
                </Group>
              </Paper>
            ))
          ) : (
            <Paper p="xl" radius="md" withBorder>
              <Box style={{ textAlign: 'center' }}>
                <IconBulb size={40} color={theme.colors.gray[5]} style={{ marginBottom: 10 }} />
                <Text size="lg" weight={500} mb="xs">No reflections for this day</Text>
                <Text color="dimmed" mb="md">
                  Record your thoughts and experiences to track your mental progress.
                </Text>
                <Button
                  onClick={() => handleAddReflection(selectedDate)}
                  leftIcon={<IconPlus size={16} />}
                >
                  Add Reflection
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      </SimpleGrid>

      {/* Favorite Reflections */}
      {reflections.some(r => r.is_favorite) && (
        <Paper p="md" radius="md" withBorder mt="xl">
          <Text weight={600} size="lg" mb="md">Favorite Reflections</Text>
          
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {reflections
              .filter(r => r.is_favorite)
              .slice(0, 3)
              .map(reflection => (
                <Paper key={reflection.id} p="sm" radius="md" withBorder>
                  <Group position="apart" mb="xs">
                    <Text weight={600}>{reflection.title}</Text>
                    <IconStarFilled size={16} color={theme.colors.yellow[6]} />
                  </Group>
                  <Text size="xs" color="dimmed" mb="xs">{formatDate(reflection.date)}</Text>
                  <Text size="sm" lineClamp={3} mb="sm">{reflection.content}</Text>
                  <Button 
                    variant="subtle" 
                    size="xs" 
                    compact 
                    onClick={() => handleViewReflection(reflection)}
                  >
                    Read more
                  </Button>
                </Paper>
              ))
            }
          </SimpleGrid>
        </Paper>
      )}

      {/* Add/Edit Reflection Modal */}
      <Modal
        opened={addModalOpened}
        onClose={closeAddModal}
        title={<Text weight={600}>{newReflection.id ? 'Edit Reflection' : 'New Reflection'}</Text>}
        size="lg"
      >
        <Group mb="md" grow>
          <Box>
            <Text weight={500} size="sm">Date</Text>
            <Calendar
              value={newReflection.date}
              onChange={handleDateChange}
              maxDate={new Date()}
              size="sm"
            />
          </Box>
          <Box>
            <Select
              label="Reflection Type"
              data={reflectionTypes}
              value={newReflection.type}
              onChange={handleTypeChange}
              mb="md"
            />
            
            <Select
              label="Overall Sentiment"
              data={sentimentOptions.map(option => ({
                value: option.value,
                label: option.label,
                group: 'Sentiment'
              }))}
              value={newReflection.sentiment}
              onChange={handleSentimentChange}
              mb="md"
            />
            
            <Group position="apart" mt="xl">
              <Text weight={500} size="sm">Mark as Favorite</Text>
              <ActionIcon 
                color={newReflection.is_favorite ? 'yellow' : 'gray'}
                onClick={handleFavoriteToggle}
                variant={newReflection.is_favorite ? 'filled' : 'light'}
              >
                {newReflection.is_favorite ? <IconCheck size={18} /> : <IconX size={18} />}
              </ActionIcon>
            </Group>
          </Box>
        </Group>

        <Divider my="md" />

        <Textarea
          label="Title"
          placeholder="Enter a title for your reflection"
          value={newReflection.title}
          onChange={handleTitleChange}
          required
          mb="md"
        />
        
        <Textarea
          label="Reflection Content"
          placeholder="Write your thoughts, experiences, and insights..."
          value={newReflection.content}
          onChange={handleContentChange}
          required
          minRows={6}
          mb="md"
        />
        
        <Textarea
          label="Key Learnings (Optional)"
          placeholder="What did you learn from this experience?"
          value={newReflection.key_learnings}
          onChange={handleKeyLearningsChange}
          minRows={3}
          mb="xl"
        />

        <Group position="right">
          <Button variant="outline" onClick={closeAddModal}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!newReflection.title || !newReflection.content}
          >
            {newReflection.id ? 'Update Reflection' : 'Save Reflection'}
          </Button>
        </Group>
      </Modal>

      {/* View Reflection Modal */}
      <Modal
        opened={viewModalOpened}
        onClose={closeViewModal}
        title={null}
        size="lg"
      >
        {selectedReflection && (
          <Box>
            <Group position="apart" mb="xs">
              <Group spacing="xs">
                <Badge
                  size="md"
                  color={selectedReflection.type === 'daily' ? 'blue' : 
                         selectedReflection.type === 'training' ? 'green' : 
                         selectedReflection.type === 'competition' ? 'orange' : 
                         selectedReflection.type === 'recovery' ? 'teal' : 'grape'}
                >
                  {reflectionTypes.find(t => t.value === selectedReflection.type)?.label || selectedReflection.type}
                </Badge>
                <Text color="dimmed">{formatDate(selectedReflection.date)}</Text>
              </Group>
              <Group spacing="xs">
                <Tooltip label={selectedReflection.is_favorite ? "Remove from favorites" : "Add to favorites"}>
                  <ActionIcon onClick={() => handleToggleFavorite(selectedReflection)} color="yellow">
                    {selectedReflection.is_favorite ? <IconStarFilled size={18} /> : <IconStar size={18} />}
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>

            <Title order={3} mt="md" mb="xs">{selectedReflection.title}</Title>
            
            <Badge
              size="sm"
              mt="xs"
              mb="lg"
              color={getSentimentDetails(selectedReflection.sentiment).color}
              leftSection={getSentimentDetails(selectedReflection.sentiment).icon && 
                <getSentimentDetails(selectedReflection.sentiment).icon size={10} />}
            >
              {getSentimentDetails(selectedReflection.sentiment).label}
            </Badge>
            
            <Text style={{ whiteSpace: 'pre-line' }} mb="xl">{selectedReflection.content}</Text>
            
            {selectedReflection.key_learnings && (
              <>
                <Divider my="md" />
                <Text weight={600} size="md" mb="xs">Key Learnings</Text>
                <Text style={{ whiteSpace: 'pre-line' }} mb="lg">{selectedReflection.key_learnings}</Text>
              </>
            )}

            <Divider my="lg" />

            <Group position="right">
              <Button 
                leftIcon={<IconPencil size={16} />}
                variant="outline" 
                onClick={() => {
                  closeViewModal();
                  handleEditReflection(selectedReflection);
                }}
              >
                Edit
              </Button>
              <Button
                leftIcon={<IconTrash size={16} />}
                color="red"
                variant="outline"
                onClick={handleDeleteReflection}
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

export default Reflection;