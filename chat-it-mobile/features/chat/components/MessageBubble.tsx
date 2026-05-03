import React from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Body, Caption, Small, cn } from "@/components/ui/Typography";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import type { MessageData } from "@/features/chat/types";

function formatMsgTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function shouldShowDate(msg: MessageData, prevMsg?: MessageData): boolean {
  if (!prevMsg) return true;
  const curr = new Date(msg.created_at).toDateString();
  const prev = new Date(prevMsg.created_at).toDateString();
  return curr !== prev;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();

  if (d.toDateString() === now.toDateString()) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface MessageBubbleProps {
  msg: MessageData;
  isOwnMessage: boolean;
  prevMsg?: MessageData;
  onRetry?: () => void;
}

export const MessageBubble = React.memo(function MessageBubble({
  msg,
  isOwnMessage,
  prevMsg,
  onRetry,
}: MessageBubbleProps) {
  const showDate = shouldShowDate(msg, prevMsg);
  const senderName =
    typeof msg.profiles === "object" && msg.profiles
      ? (msg.profiles as any).full_name
      : null;
  const isSending = msg.status === "sending";
  const isFailed = msg.status === "failed";

  const BubbleContainer = isFailed && onRetry ? AnimatedPressable : View;
  const bubbleProps = isFailed && onRetry ? { onPress: onRetry, scaleTo: 0.98 } : {};

  return (
    <View>
      {showDate && (
        <View className="items-center my-3">
          <View className="bg-surface-secondary rounded-pill px-3 py-1">
            <Small>{formatDateLabel(msg.created_at)}</Small>
          </View>
        </View>
      )}

      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        className={cn(
          "px-4 mb-1.5",
          isOwnMessage ? "items-end" : "items-start"
        )}
      >
        {!isOwnMessage && senderName && (
          <Caption className="mb-0.5 ml-1">
            {senderName}
          </Caption>
        )}
        <BubbleContainer
          {...bubbleProps}
          className={cn(
            "max-w-[80%] rounded-2xl px-3.5 py-2",
            isOwnMessage
              ? isFailed
                ? "bg-error/20 border border-error/50 rounded-br-sm"
                : isSending
                  ? "bg-primary-soft rounded-br-sm"
                  : "bg-primary rounded-br-sm"
              : "bg-surface-secondary rounded-bl-sm"
          )}
        >
          <Body className={cn(isOwnMessage ? (isFailed ? "text-error" : "text-white") : "text-text-primary")}>
            {msg.content}
          </Body>
          <View className={cn("mt-0.5 self-end flex-row items-center")}>
            {isFailed && (
              <Small className="text-error mr-1 text-[10px]">Tap to retry</Small>
            )}
            <Small className={cn(isOwnMessage ? (isFailed ? "text-error/70" : "text-white/70") : "text-text-muted", "text-[10px]")}>
              {isSending ? "⏱" : isFailed ? "❌" : formatMsgTime(msg.created_at)}
            </Small>
          </View>
        </BubbleContainer>
      </Animated.View>
    </View>
  );
});
