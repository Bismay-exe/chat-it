import React from "react";
import { View, Alert } from "react-native";
import { router } from "expo-router";
import { signOut } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/store/authStore";
import { ScreenContainer, Row, Divider } from "@/components/ui/Layout";
import { Heading, Subheading, Body, Caption, cn } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";

/**
 * Settings screen — profile info + settings list + logout.
 */
export default function SettingsScreen() {
  const { profile } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            useAuthStore.getState().logout();
            router.replace("/(auth)/welcome");
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to sign out.");
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <View className="px-5 pt-4 pb-3">
        <Heading className="text-3xl">Settings</Heading>
      </View>

      <View className="flex-1 px-5 pt-2">
        {/* User profile card */}
        {profile && (
          <AnimatedPressable
            onPress={() => router.push("/profile")}
            className="flex-row items-center bg-surface-secondary border border-border rounded-2xl p-4 mb-6"
          >
            <Avatar name={profile.full_name} size="md" className="mr-4 w-14 h-14" />
            <View className="flex-1">
              <Subheading>
                {profile.full_name}
              </Subheading>
              <Caption>
                @{profile.username}
              </Caption>
            </View>
            <Body className="text-text-muted text-lg">›</Body>
          </AnimatedPressable>
        )}

        {/* Settings items */}
        <View className="bg-surface-secondary border border-border rounded-2xl overflow-hidden">
          {[
            { label: "Account", icon: "👤" },
            { label: "Privacy", icon: "🔒" },
            { label: "Appearance", icon: "🎨" },
            { label: "Notifications", icon: "🔔" },
            { label: "Help", icon: "❓" },
            { label: "About", icon: "ℹ️" },
          ].map((item, idx, arr) => (
            <React.Fragment key={item.label}>
              <AnimatedPressable
                className="flex-row items-center px-4 py-4"
              >
                <Heading className="text-lg mr-3">{item.icon}</Heading>
                <Body className="flex-1 text-base">
                  {item.label}
                </Body>
                <Body className="text-text-muted">›</Body>
              </AnimatedPressable>
              {idx < arr.length - 1 && <Divider className="ml-14" />}
            </React.Fragment>
          ))}

          {/* Admin Panel — only for admin role */}
          {profile?.role === "admin" && (
            <React.Fragment>
              <Divider className="ml-14" />
              <AnimatedPressable
                onPress={() => router.push("/admin")}
                className="flex-row items-center px-4 py-4"
              >
                <Heading className="text-lg mr-3">🛡️</Heading>
                <Body className="flex-1 text-base">
                  Admin Panel
                </Body>
                <Body className="text-text-muted">›</Body>
              </AnimatedPressable>
            </React.Fragment>
          )}
        </View>

        {/* Logout */}
        <AnimatedPressable
          onPress={handleLogout}
          className="mt-8 py-4 items-center bg-error/10 rounded-2xl border border-error/20"
        >
          <Body className="text-error font-sf-pro-semibold">
            Sign Out
          </Body>
        </AnimatedPressable>
      </View>
    </ScreenContainer>
  );
}
