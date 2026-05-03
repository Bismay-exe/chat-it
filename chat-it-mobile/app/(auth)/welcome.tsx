import React from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="flex-1 justify-center items-center px-8">
        {/* Hero */}
        <Text className="text-5xl font-extrabold text-black dark:text-white mb-3 text-center">
          Chat It
        </Text>
        <Text className="text-lg text-gray-500 dark:text-gray-400 text-center mb-12">
          Simple, fast, and built for real moments.
        </Text>
      </View>

      {/* Bottom action */}
      <View className="px-6 pb-8">
        <Pressable
          onPress={() => router.push("/(auth)/login")}
          className="h-14 bg-black dark:bg-white rounded-2xl items-center justify-center active:opacity-80"
        >
          <Text className="text-white dark:text-black text-lg font-semibold">
            Get Started
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
