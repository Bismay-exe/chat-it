import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Pulse tab — social feed placeholder.
 * Will be implemented in a future sprint with status updates,
 * stories, and activity feed features.
 */
export default function PulseScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["top"]}>
      <View className="px-5 pt-4 pb-3">
        <Text className="text-3xl font-bold text-black dark:text-white">
          Pulse
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-5xl mb-4">⚡</Text>
        <Text className="text-xl font-semibold text-black dark:text-white mb-2 text-center">
          Coming Soon
        </Text>
        <Text className="text-gray-400 text-base text-center leading-6">
          Pulse will be your social feed — status updates, stories, and
          activity from your contacts. Stay tuned!
        </Text>
      </View>
    </SafeAreaView>
  );
}
