import React from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Compose tab — quick actions hub.
 */
export default function ComposeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["top"]}>
      <View className="px-5 pt-4 pb-3">
        <Text className="text-3xl font-bold text-black dark:text-white">
          Compose
        </Text>
      </View>

      <View className="px-5 pt-4">
        <Pressable
          onPress={() => router.push("/(tabs)/compose/new-chat")}
          className="flex-row items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl active:opacity-80 mb-3"
        >
          <View className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center mr-3">
            <Text className="text-xl">💬</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-black dark:text-white">
              New Chat
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              Start a conversation with someone
            </Text>
          </View>
          <Text className="text-gray-400 text-lg">›</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
