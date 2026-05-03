import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable
} from "react-native";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useLocalSearchParams, router } from "expo-router";
import { useMessages } from "@/features/chat/hooks/useMessages";
import { useAuthStore } from "@/store/authStore";
import { SYSTEM_CHAT_ID } from "@/lib/constants";
import { useNetworkState } from "@/hooks/useNetworkState";
import { OfflineBanner } from "@/components/OfflineBanner";
import type { MessageData } from "@/features/chat/types";
import { MessageBubble } from "@/features/chat/components/MessageBubble";
import { MessageComposer } from "@/features/chat/components/MessageComposer";
import { ScreenContainer, Row } from "@/components/ui/Layout";
import { Subheading, Small } from "@/components/ui/Typography";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ChatThreadScreen() {
  const { chatId, name } = useLocalSearchParams<{
    chatId: string;
    name?: string;
  }>();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const listRef = useRef<FlashListRef<MessageData>>(null);

  const {
    messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    sendMessage,
    retryMessage,
    isSending,
  } = useMessages(chatId);

  const [text, setText] = useState("");
  // Stable ref to the messages array — lets renderItem avoid
  // including `messages` in its dep array (which would cause full re-renders)
  const messagesRef = useRef<MessageData[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  });

  const isSystemChat =
    chatId === "chat-it" || chatId === SYSTEM_CHAT_ID;
  const isAdmin = profile?.role === "admin";
  const canSend = !isSystemChat || isAdmin;

  const { isConnected } = useNetworkState();

  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content || isSending) return;
    setText("");
    try {
      await sendMessage(content);
    } catch {
      // Restore text so user can retry — optimistic message is already removed
      setText(content);
    }
  }, [text, isSending, sendMessage]);

  const loadOlder = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item, index }: { item: MessageData; index: number }) => (
      <MessageBubble
        msg={item}
        isOwnMessage={item.sender_id === user?.id}
        prevMsg={index > 0 ? messagesRef.current[index - 1] : undefined}
        onRetry={item.status === "failed" ? () => retryMessage(item.id, item.content) : undefined}
      />
    ),
    [user?.id, retryMessage] // messagesRef is stable — no need in deps
  );

  return (
    <ScreenContainer>
      <OfflineBanner />
      {/* Header */}
      <Row className="px-4 py-3 border-b border-border">
        <AnimatedPressable onPress={() => router.back()} className="mr-3 py-1 px-2">
          <Subheading className="text-primary">←</Subheading>
        </AnimatedPressable>
        <Subheading className="flex-1" numberOfLines={1}>
          {name || "Chat"}
        </Subheading>
      </Row>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <View className="flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#888" />
            </View>
          ) : (
            <FlashList
              ref={listRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              onStartReached={loadOlder}
              onStartReachedThreshold={0.5}
              ListHeaderComponent={
                isFetchingNextPage ? (
                  <View className="py-3 items-center">
                    <ActivityIndicator size="small" color="#888" />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <EmptyState
                  icon="💭"
                  title="No messages yet"
                  description="Send the first message to start the conversation!"
                  className="pt-20"
                />
              }
              contentContainerStyle={{ paddingBottom: 8, paddingTop: 8 }}
            />
          )}
        </View>

        {/* Input */}
        <MessageComposer
          text={text}
          onChangeText={setText}
          onSend={handleSend}
          isSending={isSending}
          isConnected={isConnected}
          canSend={canSend}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
