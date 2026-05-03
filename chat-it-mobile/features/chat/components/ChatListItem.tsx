import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Avatar } from "@/components/ui/Avatar";
import { Subheading, Body, Caption, Small, cn } from "@/components/ui/Typography";
import { Row, Column } from "@/components/ui/Layout";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import type { ChatData } from "@/features/chat/types";

/**
 * Format time for chat list — shows HH:MM for today, date otherwise.
 */
function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

interface ChatListItemProps {
  chat: ChatData;
  userId?: string;
  onPress?: () => void;
}

export const ChatListItem = React.memo(function ChatListItem({ chat, userId, onPress }: ChatListItemProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push({
      pathname: "/(tabs)/chats/[chatId]",
      params: { chatId: chat.chat_id, name: chat.name },
    });
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      className={cn(
        "flex-row items-center px-3 py-2 bg-foreground rounded-[35px] border border-background",
        "active:bg-surface-secondary"
      )}
    >
      <Avatar name={chat.name} size="lg" className="mr-3" />

      <Column className="flex-1 mr-2">
        <Row className="justify-between mb-1">
          <Subheading className="flex-1 mr-2 text-[#1a1a1a] tracking-tighter font-sf-pro-bold" numberOfLines={1}>
            {chat.name}
          </Subheading>
          <Caption className="text-background">
            {formatTime(chat.last_message_time)}
          </Caption>
        </Row>
        
        <Row className="justify-between">
          <Body className="text-text-secondary flex-1 mr-2" numberOfLines={1}>
            {chat.last_message || "No messages yet"}
          </Body>
          
          {chat.unread_count > 0 && (
            <View className="bg-primary rounded-pill min-w-5 h-5 items-center justify-center px-1.5">
              <Small className="text-white font-sf-pro-bold">
                {chat.unread_count > 99 ? "99+" : chat.unread_count}
              </Small>
            </View>
          )}
        </Row>
      </Column>
    </AnimatedPressable>
  );
});
