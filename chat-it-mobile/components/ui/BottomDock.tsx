import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEV_FLAGS } from "@/lib/devFlags";
import { Small, cn } from "@/components/ui/Typography";
import { useUIStore } from "@/store/uiStore";

export function BottomDock({
  state,
  navigation,
  descriptors,
}: {
  state: any;
  navigation: any;
  descriptors: any;
}) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 16);
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);

  // If the sidebar is open, we hide the tab bar completely
  if (isSidebarOpen) {
    return null;
  }

  const tabs = [
    { name: "chats", label: "Chats", icon: "💬" },
    { name: "compose", label: "Compose", icon: "✏️" },
    ...(DEV_FLAGS.ENABLE_PULSE
      ? [{ name: "pulse", label: "Pulse", icon: "⚡" }]
      : []),
    { name: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <View
      style={{ paddingBottom: bottomPadding }}
      className="absolute bottom-0 left-0 right-0 items-center justify-center pointer-events-box-none"
    >
      <View className="flex-row items-center justify-around px-4 py-2 bg-surface-secondary/95 backdrop-blur-md rounded-pill border border-border shadow-lg min-w-[80%] mx-auto mb-2">
        {tabs.map((tab) => {
          const tabIndex = state.routes.findIndex(
            (r: any) => r.name === tab.name
          );
          const isActive = state.index === tabIndex;

          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                if (tabIndex >= 0) {
                  navigation.navigate(tab.name);
                }
              }}
              className="items-center px-4 py-1 relative"
            >
              <Text className="text-xl mb-1">{tab.icon}</Text>
              <Small
                className={cn(
                  "font-sf-pro-semibold",
                  isActive ? "text-primary" : "text-text-muted"
                )}
              >
                {tab.label}
              </Small>
              {isActive && (
                <View className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
