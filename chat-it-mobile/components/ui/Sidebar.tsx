import React, { useEffect, useState } from "react";
import { View, Pressable, Dimensions, Text, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from "react-native-reanimated";
import { Gesture, GestureDetector, ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { cn, Heading, Subheading } from "@/components/ui/Typography";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { useUIStore } from "@/store/uiStore";
import { cssInterop } from "nativewind";

// Register standard Text for NativeWind interop on Android
cssInterop(Text, { className: "style" });

const SCREEN_WIDTH = Dimensions.get("window").width;
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8;

export interface SidebarItemType {
  id: string;
  label: string;
  onPress: () => void;
}

export interface SidebarGroupType {
  title: string;
  items: SidebarItemType[];
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  groups: SidebarGroupType[];
  selectedItemIds?: string[];
  position?: "left" | "right";
  swipeEnabled?: boolean;
}

export function Sidebar({
  isOpen,
  onClose,
  groups,
  selectedItemIds = [],
  position = "left",
  swipeEnabled = true
}: SidebarProps) {
  const setSidebarOpenGlobal = useUIStore((s) => s.setSidebarOpen);

  // We use a normalized shared value: 0 means fully closed, 1 means fully open.
  const progress = useSharedValue(isOpen ? 1 : 0);
  const startProgress = useSharedValue(0);
  const [isRendered, setIsRendered] = useState(isOpen);

  const SPRING_CONFIG = { damping: 20, stiffness: 150, mass: 0.8 };

  useEffect(() => {
    setSidebarOpenGlobal(isOpen);
    if (isOpen) {
      setIsRendered(true);
      progress.value = withSpring(1, SPRING_CONFIG);
    } else {
      progress.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) runOnJS(setIsRendered)(false);
      });
    }
  }, [isOpen]);

  const handleAnimatedClose = () => {
    progress.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(setIsRendered)(false);
        runOnJS(onClose)();
      }
    });
  };

  const animatedSidebarStyle = useAnimatedStyle(() => {
    // 0 = closed, 1 = open
    // Shift by 10% of the sidebar width (parallax effect) instead of 100%
    const translateAmount = SIDEBAR_WIDTH * 0.1;
    const translateX = position === "left"
      ? -translateAmount * (1 - progress.value)
      : translateAmount * (1 - progress.value);

    return {
      transform: [{ translateX }],
      opacity: progress.value,
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    // Scale goes from 0.85 to 1 for the content only
    const scale = 0.85 + 0.15 * progress.value;

    return {
      transform: [{ scale }],
    };
  });



  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onBegin(() => {
      if (!isRendered) {
        runOnJS(setIsRendered)(true);
      }
      startProgress.value = progress.value;
    })
    .onUpdate((e) => {
      // Calculate new progress based on drag
      let newProgress;
      if (position === "left") {
        const startX = startProgress.value * SIDEBAR_WIDTH;
        const currentX = startX + e.translationX;
        newProgress = currentX / SIDEBAR_WIDTH;
      } else {
        const startX = startProgress.value * -SIDEBAR_WIDTH;
        const currentX = startX + e.translationX;
        newProgress = Math.abs(currentX) / SIDEBAR_WIDTH;
      }

      // clamp between 0 and 1
      progress.value = Math.max(0, Math.min(1, newProgress));
    })
    .onEnd((e) => {
      const velocity = position === "left" ? e.velocityX : -e.velocityX;
      const shouldOpen = progress.value > 0.5 || velocity > 500;
      const shouldClose = progress.value < 0.5 || velocity < -500;

      if (shouldClose && !shouldOpen) {
        progress.value = withTiming(0, { duration: 250 }, (finished) => {
          if (finished) {
            runOnJS(setIsRendered)(false);
            runOnJS(onClose)();
          }
        });
      } else {
        progress.value = withSpring(1, SPRING_CONFIG);
        if (!isOpen) {
          runOnJS(setSidebarOpenGlobal)(true);
        }
      }
    });

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: 100 }]}
      pointerEvents={isRendered ? "auto" : "box-none"}
    >
      <GestureDetector gesture={panGesture}>
        <View style={StyleSheet.absoluteFill} pointerEvents={isRendered ? "auto" : "box-none"}>

          {/* Edge zone to detect swipe-to-open when closed */}
          {!isRendered && swipeEnabled && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 25,
                [position]: 0
              }}
            />
          )}

          {/* Actual Sidebar Content */}
          {isRendered && (
            <Animated.View style={[StyleSheet.absoluteFill, { flexDirection: position === "left" ? "row" : "row-reverse" }]}>
              <Animated.View style={[{ width: SIDEBAR_WIDTH, height: "100%" }, animatedSidebarStyle]}>
                <LinearGradient
                  colors={position === "left" ? ["rgba(0,0,0,1)", "rgba(0,0,0,0.3)", "rgba(0,0,0,0)"] : ["rgba(0,0,0,0)", "rgba(0,0,0,0.3)", "rgba(0,0,0,1)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />

                <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
                  <Animated.View style={[{ flex: 1, paddingHorizontal: 10 }, animatedContentStyle]}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}>
                      <AnimatedPressable onPress={handleAnimatedClose} className={cn("mb-8 w-10 h-10 items-center justify-center", position === "left" ? "-ml-2" : "self-end -mr-2")}>
                        <Heading className="text-white text-[20px]">✕</Heading>
                      </AnimatedPressable>

                      {groups.map((group, groupIdx) => (
                        <View key={`group-${groupIdx}`} className="mb-6">
                          <Subheading className={cn("text-white mb-4 tracking-tight text-lg font-sf-pro-semibold", position === "right" && "text-right")}>
                            {group.title}
                          </Subheading>

                          {group.items.map((item) => {
                            const isSelected = selectedItemIds.includes(item.id);
                            return (
                              <AnimatedPressable
                                key={item.id}
                                onPress={() => {
                                  item.onPress();
                                  handleAnimatedClose();
                                }}
                                className={cn("mb-4", position === "right" && "items-end")}
                              >
                                <Text
                                  className={cn(
                                    "text-[50px] tracking-[-3px] leading-[44px]",
                                    isSelected ? "font-sf-pro-semibold text-white" : "font-sf-pro-medium text-white/60",
                                    position === "right" && "text-right"
                                  )}
                                >
                                  {item.label}
                                </Text>
                              </AnimatedPressable>
                            );
                          })}
                        </View>
                      ))}
                    </ScrollView>
                  </Animated.View>
                </SafeAreaView>
              </Animated.View>
              <Pressable style={{ flex: 1 }} onPress={handleAnimatedClose} />
            </Animated.View>
          )}

        </View>
      </GestureDetector>
    </View>
  );
}
