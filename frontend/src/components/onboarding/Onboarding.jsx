import React, { useState, useEffect } from 'react';
import {
  Box,
  Title,
  Text,
  Group,
  Paper,
  Button,
  Stepper,
  Progress,
  useMantineTheme,
  Container,
  Center,
  ThemeIcon
} from '@mantine/core';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { showNotification } from '@mantine/notifications';
import {
  IconUser,
  IconTarget,
  IconBarbell,
  IconClipboardCheck,
  IconChevronRight,
  IconChevronLeft,
  IconCheck,
  IconRocket
} from '@tabler/icons-react';

// Import onboarding step components
import AthleteProfile from './AthleteProfile';
import GoalSetting from './GoalSetting';
import TrainingPreferences from './TrainingPreferences';
import InitialAssessment from './InitialAssessment';

/**
 * Main Onboarding component that guides new athletes through the setup process
 * with multiple steps for profile creation, goal setting, and initial assessments
 */
const Onboarding = ({ userId, userProfile }) => {
  const theme = useMantineTheme();
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error checking onboarding status:', error);
          return;
        }

        if (data && data.onboarding_completed) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error in onboarding status check:', error);
      }
    };

    checkOnboardingStatus();
  }, [userId, router, supabase]);

  // Define onboarding steps
  const steps = [
    {
      title: "Welcome",
      component: () => (
        <Box p="xl" style={{ maxWidth: 600, margin: '0 auto' }}>
          <Center mb="xl">
            <ThemeIcon size={80} radius={40} color="blue">
              <IconRocket size={40} />
            </ThemeIcon>
          </Center>
          
          <Title order={2} align="center" mb="md">Welcome to Bobsleigh Coach AI</Title>
          
          <Text align="center" size="lg" mb="xl">
            Let's set up your profile and training environment to get you started on your bobsleigh journey.
          </Text>
          
          <Text mb="md">
            During this onboarding process, we'll collect information about:
          </Text>
          
          <Box mb="xl">
            <Group mb="md">
              <ThemeIcon size={28} radius="xl" color="blue">
                <IconUser size={16} />
              </ThemeIcon>
              <Text weight={500}>Your athlete profile and physical attributes</Text>
            </Group>
            
            <Group mb="md">
              <ThemeIcon size={28} radius="xl" color="green">
                <IconTarget size={16} />
              </ThemeIcon>
              <Text weight={500}>Your goals and competition targets</Text>
            </Group>
            
            <Group mb="md">
              <ThemeIcon size={28} radius="xl" color="orange">
                <IconBarbell size={16} />
              </ThemeIcon>
              <Text weight={500}>Your training preferences and availability</Text>
            </Group>
            
            <Group mb="md">
              <ThemeIcon size={28} radius="xl" color="red">
                <IconClipboardCheck size={16} />
              </ThemeIcon>
              <Text weight={500}>Initial performance assessment</Text>
            </Group>
          </Box>
          
          <Text color="dimmed" mb="xl">
            This information helps us create a personalized training program that's optimized for your needs and goals.
            You can update any of this information later in your profile settings.
          </Text>
        </Box>
      ),
      description: "Welcome & Introduction"
    },
    {
      title: "Athlete Profile",
      component: ({ onComplete }) => <AthleteProfile userId={userId} onComplete={onComplete} />,
      description: "Basic information"
    },
    {
      title: "Goal Setting",
      component: ({ onComplete }) => <GoalSetting userId={userId} onComplete={onComplete} />,
      description: "Set your goals"
    },
    {
      title: "Training Preferences",
      component: ({ onComplete }) => <TrainingPreferences userId={userId} onComplete={onComplete} />,
      description: "Training schedule"
    },
    {
      title: "Initial Assessment",
      component: ({ onComplete }) => <InitialAssessment userId={userId} onComplete={onComplete} />,
      description: "Baseline metrics"
    },
    {
      title: "All Set!",
      component: () => (
        <Box p="xl" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <Center mb="xl">
            <ThemeIcon size={100} radius={50} color="green">
              <IconCheck size={50} />
            </ThemeIcon>
          </Center>
          
          <Title order={2} mb="md">You're All Set!</Title>
          
          <Text size="lg" mb="xl">
            Your profile has been set up successfully. You're ready to start your bobsleigh training program.
          </Text>
          
          <Text mb="xl">
            Your coach will review your profile and assessments to create a personalized training plan
            that aligns with your goals and schedule. You can expect your first training week to be available soon.
          </Text>
          
          <Text color="dimmed" mb="xl">
            In the meantime, you can explore the dashboard, check out the resources section,
            and complete your daily check-ins to help us optimize your training.
          </Text>
        </Box>
      ),
      description: "Setup complete"
    }
  ];

  // Handle step completion
  const handleStepComplete = async (data) => {
    setCompletedSteps(prev => [...prev, step]);
    handleNextStep();
  };

  // Handle next step
  const handleNextStep = () => {
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  };

  // Handle skip setup
  const handleSkipSetup = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to skip the setup? You can complete your profile later, but you'll have a better experience if you complete it now."
    );

    if (confirmed) {
      await completeOnboarding();
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    setLoading(true);

    try {
      // Update user's onboarding status
      const { error } = await supabase
        .from('users')
        .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      setOnboardingComplete(true);

      showNotification({
        title: 'Welcome aboard!',
        message: 'Your profile has been set up successfully.',
        color: 'green',
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      showNotification({
        title: 'Error',
        message: 'There was an error completing the setup.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = steps[step].component;

  return (
    <Box className="min-h-screen bg-gradient-to-r from-blue-900 to-indigo-900">
      <Container size="lg" py="xl">
        <Paper shadow="md" radius="lg" p="xl" className="border-2 border-blue-400">
          <Box mb="xl">
            <Group position="apart" mb="md">
              <Title order={2} className="text-blue-700">Getting Started</Title>
              
              {step === 0 && (
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={handleSkipSetup}
                >
                  Skip Setup
                </Button>
              )}
            </Group>
            
            <Progress
              value={((step + 1) / steps.length) * 100}
              size="xl"
              radius="xl"
              color="blue"
              mb="sm"
            />
            
            <Text align="center" color="dimmed">
              Step {step + 1} of {steps.length}: {steps[step].description}
            </Text>
          </Box>

          <Stepper
            active={step}
            onStepClick={setStep}
            breakpoint="sm"
            allowNextStepsSelect={false}
          >
            {steps.map((s, index) => (
              <Stepper.Step
                key={index}
                label={s.title}
                description={s.description}
                completedIcon={<IconCheck size={18} />}
              />
            ))}
          </Stepper>

          <Box my="xl">
            <CurrentStepComponent onComplete={handleStepComplete} />
          </Box>

          <Group position="apart" mt="xl">
            {step > 0 && step < steps.length - 1 && (
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                leftIcon={<IconChevronLeft size={16} />}
                size="md"
              >
                Back
              </Button>
            )}
            
            {step === 0 && (
              <Button
                onClick={handleNextStep}
                rightIcon={<IconChevronRight size={16} />}
                size="md"
              >
                Get Started
              </Button>
            )}
            
            {step === steps.length - 1 && (
              <Button
                onClick={completeOnboarding}
                loading={loading}
                size="md"
                color="green"
              >
                Go to Dashboard
              </Button>
            )}
            
            {step !== 0 && step !== steps.length - 1 && (
              <Button
                onClick={handleNextStep}
                rightIcon={<IconChevronRight size={16} />}
                size="md"
                variant="light"
              >
                Skip this step
              </Button>
            )}
          </Group>
        </Paper>
      </Container>
    </Box>
  );
};

export default Onboarding;