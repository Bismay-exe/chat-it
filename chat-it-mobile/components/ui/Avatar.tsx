import React from "react";
import { View } from "react-native";
import { Subheading } from "./Typography";
import { cn } from "./Typography";

interface AvatarProps {
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const hue = Math.abs((name || "?").charCodeAt(0) * 37) % 360;

  let sizeClasses = "w-12 h-12";
  if (size === "sm") sizeClasses = "w-8 h-8";
  if (size === "lg") sizeClasses = "w-16 h-16";

  return (
    <View
      style={{ backgroundColor: `hsl(${hue}, 55%, 30%)` }}
      className={cn(
        "rounded-full items-center justify-center",
        sizeClasses,
        className
      )}
    >
      <Subheading className={cn("text-white", size === "sm" && "text-sm", size === "lg" && "text-2xl")}>
        {initial}
      </Subheading>
    </View>
  );
}
