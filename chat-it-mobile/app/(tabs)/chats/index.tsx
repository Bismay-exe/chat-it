import React, { useCallback, useState } from "react";
import { View, RefreshControl } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useChats } from "@/features/chat/hooks/useChats";
import { useAuthStore } from "@/store/authStore";
import { OfflineBanner } from "@/components/OfflineBanner";
import type { ChatData } from "@/features/chat/types";
import { ChatListItem } from "@/features/chat/components/ChatListItem";
import { ScreenContainer, Row, Divider } from "@/components/ui/Layout";
import { Heading, Small } from "@/components/ui/Typography";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { Sidebar, SidebarGroupType } from "@/components/ui/Sidebar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChatListSkeleton } from "@/features/chat/components/ChatListSkeleton";

const ItemSeparator = React.memo(function ItemSeparator() {
  return <Divider className="ml-16" />;
});

export default function ChatsIndexScreen() {
  const { chats, isLoading, refetch } = useChats();
  const user = useAuthStore((s) => s.user);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"All chats" | "Unread" | "Favorites" | "Archived">("All chats");

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const sidebarGroups: SidebarGroupType[] = [
    {
      title: "Pages",
      items: [
        { id: "page-chats", label: "Chats", onPress: () => router.push("/(tabs)/chats") },
        { id: "page-threads", label: "Threads", onPress: () => {} },
        { id: "page-settings", label: "Settings", onPress: () => router.push("/(tabs)/settings") },
      ],
    },
    {
      title: "Filters",
      items: (["All chats", "Unread", "Favorites", "Archived"] as const).map(filter => ({
        id: `filter-${filter}`,
        label: filter,
        onPress: () => setSelectedFilter(filter)
      }))
    }
  ];

  const selectedItemIds = ["page-chats", `filter-${selectedFilter}`];

  let filteredChats = chats;
  if (selectedFilter === "All chats") {
    filteredChats = chats.filter((c) => !c.is_archived);
  } else if (selectedFilter === "Unread") {
    filteredChats = chats.filter((c) => !c.is_archived && c.unread_count > 0);
  } else if (selectedFilter === "Favorites") {
    filteredChats = chats.filter((c) => !c.is_archived && c.is_favorite);
  } else if (selectedFilter === "Archived") {
    filteredChats = chats.filter((c) => c.is_archived);
  }

  const pinnedChats = filteredChats.filter((c) => c.is_favorite);
  const regularChats = filteredChats.filter((c) => !c.is_favorite);
  const sortedChats = [...pinnedChats, ...regularChats];

  const archivedCount = chats.filter((c) => c.is_archived).length;

  const renderItem = useCallback(
    ({ item }: { item: ChatData }) => (
      <ChatListItem chat={item} userId={user?.id ?? ""} />
    ),
    [user?.id]
  );

  return (
    <ScreenContainer>
      <OfflineBanner />
      
      {/* Sidebar Modal */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        groups={sidebarGroups}
        selectedItemIds={selectedItemIds}
        swipeEnabled={true}
      />

      <Row className="justify-between px-4 pt-4 pb-3">
        <AnimatedPressable onPress={openSidebar}>
          <Heading>{selectedFilter}</Heading>
        </AnimatedPressable>
        <Row>
          <AnimatedPressable
            onPress={() => router.push("/(tabs)/chats/search")}
            className="w-10 h-10 items-center justify-center mr-1"
          >
            <Heading>🔍</Heading>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => router.push("/(tabs)/chats/archived")}
            className="w-10 h-10 items-center justify-center relative"
          >
            <Heading>📦</Heading>
            {archivedCount > 0 && (
              <View className="absolute top-1 right-1 bg-primary rounded-pill min-w-4 h-4 items-center justify-center px-1">
                <Small className="text-white font-sf-pro-bold text-[10px]">
                  {archivedCount}
                </Small>
              </View>
            )}
          </AnimatedPressable>
        </Row>
      </Row>

      {isLoading && !chats.length ? (
        <ChatListSkeleton />
      ) : (
        <FlashList
          data={sortedChats}
          renderItem={renderItem}
          keyExtractor={(item) => item.chat_id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#FFFFFF" />
          }
          ListEmptyComponent={
            <EmptyState
              icon="💬"
              title="No chats yet"
              description="Start a conversation by finding a user."
              actionLabel="Search Users"
              onAction={() => router.push("/(tabs)/chats/search")}
              className="pt-20"
            />
          }
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={{ paddingBottom: 100 }} // space for floating dock
        />
      )}
    </ScreenContainer>
  );
}
