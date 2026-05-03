import "../global.css";

import React, { useEffect } from "react";
import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
// import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Configure how notifications should be handled when app is in foreground
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });

// Keep the splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AuthSessionRestore() {
  useAuthSession();
  return null;
}

/**
 * Root layout — DUMB.
 * Only providers + auth session restore + Slot. No routing logic here.
 * Auth bootstrap gate (redirect) still lives in app/index.tsx.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "SF-Pro-Regular": require("../assets/fonts/SF-Pro-Regular.otf"),
    "SF-Pro-Medium": require("../assets/fonts/SF-Pro-Medium.otf"),
    "SF-Pro-SemiBold": require("../assets/fonts/SF-Pro-SemiBold.otf"),
    "SF-Pro-Bold": require("../assets/fonts/SF-Pro-Bold.otf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Handle incoming notifications and route tapping
  // useEffect(() => {
  //   let isMounted = true;

  //   // Foreground listener
  //   const notificationListener = Notifications.addNotificationReceivedListener(
  //     (notification) => {
  //       // Here you could update local state or show a custom in-app toast
  //       console.log("Notification received:", notification);
  //     }
  //   );

  //   // Background / Tap listener
  //   const responseListener =
  //     Notifications.addNotificationResponseReceivedListener((response) => {
  //       const data = response.notification.request.content.data;
  //       if (data && typeof data.chatId === "string") {
  //         router.push({
  //           pathname: "/(tabs)/chats/[chatId]",
  //           params: { chatId: data.chatId },
  //         });
  //       }
  //     });

  //   return () => {
  //     isMounted = false;
  //     notificationListener.remove();
  //     responseListener.remove();
  //   };
  // }, []);

  // Don't render the app until fonts are ready — prevents flash of default font
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthSessionRestore />
          <SafeAreaProvider>
            <Slot />
          </SafeAreaProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
