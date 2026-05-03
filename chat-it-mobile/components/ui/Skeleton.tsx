import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { View, StyleProp, ViewStyle } from "react-native";
import { cn } from "./Typography";

interface SkeletonProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
  rounded?: "sm" | "md" | "lg" | "pill" | "none";
}

export function Skeleton({
  className,
  style,
  rounded = "md",
}: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const roundedClass = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    pill: "rounded-pill",
    none: "rounded-none",
  }[rounded];

  return (
    <Animated.View
      className={cn("bg-surface-secondary", roundedClass, className)}
      style={[animatedStyle, style]}
    />
  );
}
