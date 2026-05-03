import React, { useCallback } from "react";
import {
  View,
  RefreshControl,
  Alert,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useChats } from "@/features/chat/hooks/useChats";
import { useAuthStore } from "@/store/authStore";
import { toggleArchiveChat } from "@/features/chat/api/chatApi";
import type { ChatData } from "@/features/chat/types";
import { ScreenContainer, Row, Divider } from "@/components/ui/Layout";
import { Subheading, Body, Caption, cn } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChatListSkeleton } from "@/features/chat/components/ChatListSkeleton";

export default function ArchivedChatsScreen() {
  const { chats, isLoading, refetch } = useChats();
  const user = useAuthStore((s) => s.user);

  const archivedChats = chats.filter((c) => c.is_archived);

  const handleUnarchive = useCallback(
    async (chat: ChatData) => {
      if (!user) return;
      Alert.alert("Unarchive", `Move "${chat.name || "Chat"}" back to chats?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unarchive",
          onPress: async () => {
            try {
              await toggleArchiveChat(chat.chat_id, user.id, false);
              refetch();
            } catch {
              Alert.alert("Error", "Failed to unarchive chat.");
            }
          },
        },
      ]);
    },
    [user, refetch]
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatData }) => (
      <AnimatedPressable
        onPress={() =>
          router.push({
            pathname: "/(tabs)/chats/[chatId]",
            params: { chatId: item.chat_id, name: item.name },
          })
        }
        onLongPress={() => handleUnarchive(item)}
        className="flex-row items-center px-4 py-3 active:bg-surface-secondary"
      >
        <Avatar name={item.name} size="lg" className="mr-3 w-12 h-12" />
        <View className="flex-1">
          <Subheading numberOfLines={1}>
            {item.name || "Chat"}
          </Subheading>
          <Caption numberOfLines={1}>
            {item.last_message || "No messages"}
          </Caption>
        </View>
      </AnimatedPressable>
    ),
    [handleUnarchive]
  );

  return (
    <ScreenContainer>
      <Row className="px-4 py-3 border-b border-border">
        <AnimatedPressable onPress={() => router.back()} className="mr-3 py-1 px-2">
          <Subheading className="text-primary">←</Subheading>
        </AnimatedPressable>
        <Subheading className="flex-1">
          Archived Chats
        </Subheading>
      </Row>

      {isLoading && !archivedChats.length ? (
        <ChatListSkeleton />
      ) : (
        <FlashList
          data={archivedChats}
          renderItem={renderItem}
          keyExtractor={(item) => item.chat_id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#fff" />
          }
          ItemSeparatorComponent={() => <Divider className="ml-16" />}
          ListEmptyComponent={
            <EmptyState
              icon="📦"
              title="No archived chats"
              description="Long-press a chat to archive it."
            />
          }
        />
      )}
    </ScreenContainer>
  );
}
