"use client";

import React, { Component, ReactNode } from "react";
import {
  Card,
  Stack,
  Title,
  Text,
  Button,
  Alert,
  Group,
  Code,
  Collapse,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconRefresh,
  IconBug,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log to external service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card shadow="sm" padding="xl" radius="md" withBorder maw={800} mx="auto" mt="xl">
          <Stack gap="lg">
            <Alert color="red" title="Something went wrong" icon={<IconAlertTriangle size={20} />}>
              <Text size="sm">
                The application encountered an unexpected error. Don't worry - your data is safe.
              </Text>
            </Alert>

            <Stack gap="md" align="center">
              <IconBug size={48} color="gray" />
              <Title order={3} ta="center">
                Oops! Something broke
              </Title>
              <Text c="dimmed" ta="center" maw={400}>
                We've logged this error and will fix it soon. Try refreshing the page or 
                resetting the component.
              </Text>
            </Stack>

            <Group justify="center" gap="sm">
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={this.handleReset}
                variant="filled"
              >
                Try Again
              </Button>
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={this.handleReload}
                variant="light"
              >
                Reload Page
              </Button>
            </Group>

            {/* Developer Details */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <Stack gap="sm">
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={this.toggleDetails}
                  leftSection={
                    this.state.showDetails ? 
                      <IconChevronUp size={16} /> : 
                      <IconChevronDown size={16} />
                  }
                >
                  {this.state.showDetails ? "Hide" : "Show"} Error Details
                </Button>

                <Collapse in={this.state.showDetails}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Error Message:</Text>
                    <Code block color="red">
                      {this.state.error.message}
                    </Code>
                    
                    {this.state.error.stack && (
                      <>
                        <Text size="sm" fw={500} mt="sm">Stack Trace:</Text>
                        <Code block style={{ fontSize: "11px", maxHeight: "200px", overflow: "auto" }}>
                          {this.state.error.stack}
                        </Code>
                      </>
                    )}
                    
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <Text size="sm" fw={500} mt="sm">Component Stack:</Text>
                        <Code block style={{ fontSize: "11px", maxHeight: "200px", overflow: "auto" }}>
                          {this.state.errorInfo.componentStack}
                        </Code>
                      </>
                    )}
                  </Stack>
                </Collapse>
              </Stack>
            )}
          </Stack>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}