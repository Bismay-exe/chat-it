import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { useNetworkState } from "@/hooks/useNetworkState";

/**
 * Slides down from the top when the device is offline.
 * Auto-hides when connectivity is restored.
 */
export function OfflineBanner() {
  const { isConnected } = useNetworkState();
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isConnected ? -50 : 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  }, [isConnected, slideAnim]);

  // Render nothing once the banner is fully hidden — avoids blocking touches
  if (isConnected) return null;

  return (
    <Animated.View
      style={{ transform: [{ translateY: slideAnim }] }}
      className="absolute top-0 left-0 right-0 z-50 flex-row items-center justify-center py-2 px-4 bg-red-500"
    >
      <Text className="text-white text-xs font-semibold">
        ⚠ No internet connection
      </Text>
    </Animated.View>
  );
}
