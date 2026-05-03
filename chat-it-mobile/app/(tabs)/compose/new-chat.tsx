import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";
import {
  searchUsers,
  createDirectChat,
  type SearchResult,
} from "@/features/chat/api/chatApi";

export default function NewChatScreen() {
  const user = useAuthStore((s) => s.user);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!query.trim() || !user) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchUsers(query.trim(), user.id);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, user?.id]);

  const handleSelectUser = useCallback(
    async (item: SearchResult) => {
      if (!user || creating) return;
      setCreating(true);
      try {
        const chatId = await createDirectChat(user.id, item.id);
        router.replace({
          pathname: "/(tabs)/chats/[chatId]",
          params: { chatId, name: item.name },
        });
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to start chat.");
      } finally {
        setCreating(false);
      }
    },
    [user, creating]
  );

  const renderItem = useCallback(
    ({ item }: { item: SearchResult }) => (
      <Pressable
        onPress={() => handleSelectUser(item)}
        disabled={creating}
        className="flex-row items-center px-4 py-3 active:bg-gray-50 dark:active:bg-gray-900"
      >
        <View
          style={{
            backgroundColor: `hsl(${Math.abs(item.name?.charCodeAt(0) ?? 0) * 37 % 360}, 55%, 72%)`,
          }}
          className="w-11 h-11 rounded-full items-center justify-center mr-3"
        >
          <Text className="text-white text-base font-bold">
            {(item.name || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View className="flex-1">
          <Text
            className="text-base font-semibold text-black dark:text-white"
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.username && (
            <Text className="text-sm text-gray-400" numberOfLines={1}>
              @{item.username}
            </Text>
          )}
        </View>
      </Pressable>
    ),
    [handleSelectUser, creating]
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-2 border-b border-gray-200 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="mr-3 py-1">
          <Text className="text-lg text-blue-500">←</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-black dark:text-white flex-1">
          New Chat
        </Text>
      </View>

      {/* Search */}
      <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-900">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by username or name..."
          placeholderTextColor="#999"
          autoFocus
          autoCapitalize="none"
          className="h-10 bg-gray-100 dark:bg-gray-900 text-black dark:text-white rounded-xl px-4 text-base"
        />
      </View>

      {/* Creating overlay */}
      {creating && (
        <View className="py-3 items-center bg-blue-50 dark:bg-blue-950">
          <Text className="text-blue-500 text-sm font-medium">
            Starting chat...
          </Text>
        </View>
      )}

      {/* Results */}
      {searching ? (
        <View className="pt-8 items-center">
          <ActivityIndicator size="small" color="#888" />
        </View>
      ) : results.length > 0 ? (
        <FlashList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      ) : query.trim() ? (
        <View className="pt-16 items-center">
          <Text className="text-gray-400 text-base">
            No users found for "{query}"
          </Text>
        </View>
      ) : (
        <View className="pt-16 items-center px-6">
          <Text className="text-gray-400 text-base text-center">
            Search for a user to start a conversation
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
