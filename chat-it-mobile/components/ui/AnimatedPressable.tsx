import React, { useCallback } from "react";
import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { cssInterop } from "nativewind";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  scaleTo?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressableComponent = React.forwardRef<any, AnimatedPressableProps>(
  ({ children, scaleTo = 0.96, style, onPressIn, onPressOut, ...props }, ref) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    const handlePressIn = useCallback(
      (e: any) => {
        scale.value = withTiming(scaleTo, { duration: 100 });
        opacity.value = withTiming(0.85, { duration: 100 });
        onPressIn?.(e);
      },
      [scaleTo, onPressIn]
    );

    const handlePressOut = useCallback(
      (e: any) => {
        scale.value = withTiming(1, { duration: 100 });
        opacity.value = withTiming(1, { duration: 100 });
        onPressOut?.(e);
      },
      [onPressOut]
    );

    return (
      <AnimatedPressableBase
        ref={ref}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[style, animatedStyle]}
        {...props}
      >
        {children}
      </AnimatedPressableBase>
    );
  }
);


cssInterop(AnimatedPressableComponent, { className: "style" });

export const AnimatedPressable = AnimatedPressableComponent;
