import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "./ui/Layout";
import { Heading, Body, Small } from "./ui/Typography";
import { AnimatedPressable } from "./ui/AnimatedPressable";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Global error boundary — catches unhandled render errors anywhere in the tree.
 * Prevents the white screen of death by showing a recoverable error UI.
 *
 * Must be a class component — React requires it for componentDidCatch.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message ?? "Unknown error",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log for debugging — swap with Sentry/Crashlytics in production
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRestart = () => {
    this.setState({ hasError: false, errorMessage: "" });
    router.replace("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <ScreenContainer className="items-center justify-center px-8 text-center">
          <Heading className="text-5xl mb-4">⚠️</Heading>
          <Heading className="mb-2 text-center">
            Something went wrong
          </Heading>
          <Body className="text-text-muted text-center mb-8">
            {this.state.errorMessage}
          </Body>
          <AnimatedPressable
            onPress={this.handleRestart}
            className="bg-primary rounded-pill px-8 py-3"
          >
            <Body className="text-white font-sf-pro-semibold">
              Restart App
            </Body>
          </AnimatedPressable>
        </ScreenContainer>
      );
    }

    return this.props.children;
  }
}
