import React from "react";
import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { Row, Column } from "@/components/ui/Layout";

export function ChatListItemSkeleton() {
  return (
    <Row className="px-4 py-3 items-center">
      <Skeleton className="w-12 h-12 mr-3" rounded="pill" />
      <Column className="flex-1 justify-center">
        <Row className="justify-between items-center mb-2">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-10 h-3" />
        </Row>
        <Skeleton className="w-3/4 h-3" />
      </Column>
    </Row>
  );
}

export function ChatListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <View className="flex-1">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>
          <ChatListItemSkeleton />
        </View>
      ))}
    </View>
  );
}
