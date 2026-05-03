import React from "react";
import { Tabs } from "expo-router";
import { DEV_FLAGS } from "@/lib/devFlags";
import { BottomDock } from "@/components/ui/BottomDock";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomDock {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="compose" />
      <Tabs.Screen
        name="pulse"
        options={{
          href: DEV_FLAGS.ENABLE_PULSE ? undefined : null,
        }}
      />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
