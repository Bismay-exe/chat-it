import React, { useEffect } from "react";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { LoadingScreen } from "@/components/LoadingScreen";

/**
 * Auth bootstrap gate.
 *
 * Waits for session to be restored (by useAuthSession in root layout),
 * then redirects based on auth state.
 *
 * This screen only renders when the user navigates to "/" explicitly
 * (app startup, not web reloads on deep routes).
 */
export default function IndexGate() {
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return; // Wait for session restore

    if (user) {
      router.replace("/(tabs)/chats");
    } else {
      router.replace("/(auth)/welcome");
    }
  }, [user, isLoading]);

  return <LoadingScreen />;
}
