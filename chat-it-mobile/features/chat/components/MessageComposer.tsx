import React from "react";
import { View, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Heading, Caption, cn } from "@/components/ui/Typography";

interface MessageComposerProps {
  text: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  isConnected: boolean;
  canSend: boolean;
}

export function MessageComposer({
  text,
  onChangeText,
  onSend,
  isSending,
  isConnected,
  canSend,
}: MessageComposerProps) {
  if (!canSend) {
    return (
      <View className="px-4 py-4 border-t border-border bg-background items-center">
        <Caption>This is a read-only channel</Caption>
      </View>
    );
  }

  return (
    <View className="flex-row items-end px-3 py-2 border-t border-border bg-background">
      <TextInput
        value={text}
        onChangeText={onChangeText}
        placeholder="Type a message..."
        placeholderTextColor="#A1A1AA"
        multiline
        maxLength={4000}
        className={cn(
          "flex-1 bg-surface-secondary text-text-primary rounded-2xl px-4 py-2.5",
          "font-sf-pro text-[15px] max-h-24 mr-2"
        )}
      />
      <Pressable
        onPress={onSend}
        disabled={!text.trim() || isSending || !isConnected}
        className={cn(
          "w-10 h-10 rounded-pill items-center justify-center",
          text.trim() && isConnected ? "bg-primary" : "bg-surface-secondary"
        )}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Heading
            className={cn(
              "text-lg",
              text.trim() && isConnected ? "text-white" : "text-text-muted"
            )}
          >
            ↑
          </Heading>
        )}
      </Pressable>
    </View>
  );
}
