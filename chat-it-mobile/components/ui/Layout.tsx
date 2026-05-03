import React from "react";
import { View, ViewProps } from "react-native";
import { SafeAreaView, SafeAreaViewProps } from "react-native-safe-area-context";
import { cn } from "./Typography";

interface ContainerProps extends SafeAreaViewProps {
  children: React.ReactNode;
  className?: string;
  edges?: SafeAreaViewProps["edges"];
}

export function ScreenContainer({ children, className, edges = ["top"], ...props }: ContainerProps) {
  return (
    <SafeAreaView
      className={cn("flex-1 bg-background", className)}
      edges={edges}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}

interface LayoutProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export function Row({ children, className, ...props }: LayoutProps) {
  return (
    <View className={cn("flex-row items-center", className)} {...props}>
      {children}
    </View>
  );
}

export function Column({ children, className, ...props }: LayoutProps) {
  return (
    <View className={cn("flex-col", className)} {...props}>
      {children}
    </View>
  );
}

export function Divider({ className, ...props }: LayoutProps) {
  return <View className={cn("h-px w-full bg-border", className)} {...props} />;
}

export function Spacer({ className, ...props }: LayoutProps) {
  return <View className={cn("flex-1", className)} {...props} />;
}
