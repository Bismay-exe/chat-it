import React from "react";
import { Text as RNText, View, Pressable, TextProps, Platform } from "react-native";
import { clsx } from "clsx";
import { cssInterop } from "nativewind";

export function cn(...inputs: (string | undefined | null | false)[]) {
  return clsx(inputs);
}

if (Platform.OS !== "web") {
  cssInterop(RNText, { className: "style" });
  cssInterop(View, { className: "style" });
  cssInterop(Pressable, { className: "style" });
}

interface TypographyProps extends TextProps {
  children: React.ReactNode;
  className?: string;
}

export function Heading({ children, className, ...props }: TypographyProps) {
  return (
    <RNText
      className={cn(
        "font-sf-pro-bold text-[50px] tracking-tighter text-text-primary",
        className
      )}
      {...props}
    >
      {children}
    </RNText>
  );
}

export function Subheading({ children, className, ...props }: TypographyProps) {
  return (
    <RNText
      className={cn(
        "font-sf-pro-semibold text-lg text-text-primary",
        className
      )}
      {...props}
    >
      {children}
    </RNText>
  );
}

export function Body({ children, className, ...props }: TypographyProps) {
  return (
    <RNText
      className={cn(
        "font-sf-pro text-base text-text-primary leading-6",
        className
      )}
      {...props}
    >
      {children}
    </RNText>
  );
}

export function Caption({ children, className, ...props }: TypographyProps) {
  return (
    <RNText
      className={cn(
        "font-sf-pro text-sm text-text-secondary",
        className
      )}
      {...props}
    >
      {children}
    </RNText>
  );
}

export function Small({ children, className, ...props }: TypographyProps) {
  return (
    <RNText
      className={cn(
        "font-sf-pro text-xs text-text-muted",
        className
      )}
      {...props}
    >
      {children}
    </RNText>
  );
}

