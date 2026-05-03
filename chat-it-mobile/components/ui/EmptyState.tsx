import React from "react";
import { View } from "react-native";
import { Subheading, Caption, Heading } from "./Typography";
import { AnimatedPressable } from "./AnimatedPressable";
import { cn } from "./Typography";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = "📂",
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn("flex-1 items-center justify-center p-6", className)}>
      <View className="w-20 h-20 rounded-full bg-surface-secondary items-center justify-center mb-6 border border-border">
        <Heading className="text-4xl">{icon}</Heading>
      </View>
      <Subheading className="text-center mb-2">{title}</Subheading>
      {description && (
        <Caption className="text-center mb-8 max-w-[80%]">
          {description}
        </Caption>
      )}
      {actionLabel && onAction && (
        <AnimatedPressable
          onPress={onAction}
          className="bg-primary px-6 py-3 rounded-pill"
        >
          <Subheading className="text-white font-sf-pro-bold">
            {actionLabel}
          </Subheading>
        </AnimatedPressable>
      )}
    </View>
  );
}
