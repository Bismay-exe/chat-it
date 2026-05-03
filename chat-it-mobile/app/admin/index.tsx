import React from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";

/**
 * Admin panel placeholder — only visible to admin-role users.
 * Full admin features (user management, reports, broadcast) will be
 * implemented when the web admin dashboard is ported.
 */
export default function AdminScreen() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === "admin";

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-900">
        <Pressable onPress={() => router.back()} className="mr-3 py-1">
          <Text className="text-lg text-blue-500">←</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-black dark:text-white">
          Admin Panel
        </Text>
      </View>

      {isAdmin ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-5xl mb-4">🛡️</Text>
          <Text className="text-xl font-semibold text-black dark:text-white mb-2 text-center">
            Admin Dashboard
          </Text>
          <Text className="text-gray-400 text-base text-center leading-6 mb-8">
            Full admin tools coming soon. User management, reports, broadcasts,
            and system settings will be available here.
          </Text>

          {/* Placeholder action cards */}
          {[
            { icon: "👥", label: "User Management", desc: "View and manage users" },
            { icon: "📢", label: "Broadcasts", desc: "Send system announcements" },
            { icon: "🚨", label: "Reports", desc: "Review flagged content" },
            { icon: "⚙️", label: "System Settings", desc: "App configuration" },
          ].map((item) => (
            <View
              key={item.label}
              className="w-full flex-row items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl mb-3"
            >
              <Text className="text-2xl mr-4">{item.icon}</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-black dark:text-white">
                  {item.label}
                </Text>
                <Text className="text-sm text-gray-400">{item.desc}</Text>
              </View>
              <Text className="text-xs text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                Soon
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-5xl mb-4">🔒</Text>
          <Text className="text-xl font-semibold text-black dark:text-white mb-2">
            Access Denied
          </Text>
          <Text className="text-gray-400 text-base text-center">
            You don't have admin permissions to access this page.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
