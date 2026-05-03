import React from "react";
import { View } from "react-native";
import { Subheading, Caption, Heading } from "./Typography";
import { AnimatedPressable } from "./AnimatedPressable";
import { cn } from "./Typography";

interface ErrorStateProps {
  icon?: string;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  icon = "⚠️",
  title = "Something went wrong",
  message = "Please check your connection and try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <View className={cn("flex-1 items-center justify-center p-6", className)}>
      <View className="w-20 h-20 rounded-full bg-error/10 items-center justify-center mb-6 border border-error/20">
        <Heading className="text-4xl">{icon}</Heading>
      </View>
      <Subheading className="text-center mb-2">{title}</Subheading>
      <Caption className="text-center mb-8 max-w-[80%] text-error/80">
        {message}
      </Caption>
      {onRetry && (
        <AnimatedPressable
          onPress={onRetry}
          className="bg-surface-secondary border border-border px-6 py-3 rounded-pill"
        >
          <Subheading className="text-text-primary font-sf-pro-semibold">
            Try Again
          </Subheading>
        </AnimatedPressable>
      )}
    </View>
  );
}
