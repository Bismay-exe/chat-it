import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import {
  searchChats,
  type SearchResult,
} from "@/features/chat/api/chatApi";
import { ScreenContainer, Row } from "@/components/ui/Layout";
import { Heading, Subheading, Body, Caption, cn } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ChatSearchScreen() {
  const user = useAuthStore((s) => s.user);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim() || !user) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchChats(query.trim(), user.id);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, user?.id]);

  const handleSelect = useCallback((item: SearchResult) => {
    router.push({
      pathname: "/(tabs)/chats/[chatId]",
      params: { chatId: item.id, name: item.name },
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: SearchResult }) => (
      <AnimatedPressable
        onPress={() => handleSelect(item)}
        className="flex-row items-center px-4 py-3 active:bg-surface-secondary"
      >
        <Avatar name={item.name} size="md" className="mr-3 w-11 h-11" />
        <View className="flex-1">
          <Subheading numberOfLines={1}>
            {item.name}
          </Subheading>
          {item.username && (
            <Caption numberOfLines={1}>
              @{item.username}
            </Caption>
          )}
        </View>
      </AnimatedPressable>
    ),
    [handleSelect]
  );

  return (
    <ScreenContainer>
      {/* Header + Search bar */}
      <Row className="px-4 py-2 border-b border-border">
        <AnimatedPressable onPress={() => router.back()} className="mr-3 py-1 px-2">
          <Subheading className="text-primary">←</Subheading>
        </AnimatedPressable>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search chats..."
          placeholderTextColor="#A1A1AA"
          autoFocus
          autoCapitalize="none"
          className="flex-1 h-10 bg-surface-secondary text-text-primary rounded-xl px-4 text-base font-sf-pro"
        />
      </Row>

      {/* Results */}
      {searching ? (
        <View className="pt-8 items-center">
          <ActivityIndicator size="small" color="#fff" />
        </View>
      ) : results.length > 0 ? (
        <FlashList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      ) : query.trim() ? (
        <EmptyState
          icon="🤷"
          title="No results found"
          description={`We couldn't find any chats matching "${query}".`}
        />
      ) : (
        <EmptyState
          icon="🔍"
          title="Search"
          description="Search your conversations by name or username."
        />
      )}
    </ScreenContainer>
  );
}
