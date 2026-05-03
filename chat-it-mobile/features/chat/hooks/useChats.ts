import { useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppState } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { fetchUserChats } from "@/features/chat/api/chatApi";
import type { ChatData } from "@/features/chat/types";

/**
 * Fetch chat list + subscribe to realtime new-message events.
 *
 * Sprint 2 scope:
 * - Fetch via RPC
 * - Realtime: new message → bump chat to top + increment unread
 * - NO: archive/mute/favorite mutations, NO optimistic updates
 */
export function useChats() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const {
    data: chats = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["chats", user?.id],
    queryFn: () => fetchUserChats(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Debounced refetch to avoid hammering on rapid events
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefetch = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => refetch(), 300);
  }, [refetch]);

  // Realtime: listen for new messages to update chat list
  useEffect(() => {
    if (!user) return;

    const msgChannel = supabase
      .channel("mobile:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as any;

          queryClient.setQueryData(
            ["chats", user.id],
            (prev: ChatData[] | undefined) => {
              if (!prev) return prev;

              const idx = prev.findIndex(
                (c) => c.chat_id === newMsg.chat_id
              );
              if (idx === -1) {
                // New chat we don't have yet — full refetch
                debouncedRefetch();
                return prev;
              }

              const existing = prev[idx];
              const isMe = newMsg.sender_id === user.id;

              const updated: ChatData = {
                ...existing,
                last_message: newMsg.content,
                last_message_time: newMsg.created_at,
                unread_count: isMe
                  ? existing.unread_count
                  : existing.unread_count + 1,
              };

              const next = [...prev];
              next.splice(idx, 1);
              return [updated, ...next];
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [user?.id, queryClient, debouncedRefetch]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // AppState: refetch chat list when app returns to foreground
  useEffect(() => {
    if (!user) return;
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        refetch();
      }
    });
    return () => sub.remove();
  }, [user?.id, refetch]); // eslint-disable-line react-hooks/exhaustive-deps

  return { chats, isLoading, error, refetch };
}
