import { useEffect, useRef, useCallback } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { AppState } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import {
  fetchChatMessages,
  sendTextMessage,
} from "@/features/chat/api/chatApi";
import { SYSTEM_CHAT_ID, SYSTEM_USER_ID } from "@/lib/constants";
import type { MessageData } from "@/features/chat/types";

/**
 * Generates a temporary ID for optimistic messages.
 * Prefixed with "temp_" so it can be distinguished from real DB UUIDs.
 */
function makeTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Fetch messages + send (optimistic) + realtime.
 *
 * Phase 1.5 fixes:
 * - Optimistic send: instant temp message → replaced by real message on success
 * - Mounted ref guard: prevents stale async realtime callbacks writing to cache
 * - AppState listener: re-fetches messages when app returns from background
 */
export function useMessages(paramChatId: string | undefined) {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();

  const isSystemChat =
    paramChatId === "chat-it" || paramChatId === SYSTEM_CHAT_ID;
  const chatId = isSystemChat ? SYSTEM_CHAT_ID : paramChatId;

  const queryKey = ["messages", chatId, user?.id] as const;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }) => {
        if (!chatId || !user) return [];
        return fetchChatMessages(chatId, user.id, pageParam, 30);
      },
      enabled: !!chatId && !!user,
      initialPageParam: null as string | null,
      getNextPageParam: (firstPage) => {
        return firstPage.length === 30 ? firstPage[0].created_at : undefined;
      },
      staleTime: Infinity,
    });

  // Flatten: reverse pages (oldest first) then flatten
  const messages: MessageData[] = data?.pages
    ? [...data.pages].reverse().flat()
    : [];

  // ── Realtime: listen for new messages from others ──
  useEffect(() => {
    if (!chatId || !user) return;
    let mounted = true;

    const channel = supabase
      .channel(`mobile:messages:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;

          // Skip own messages — handled by optimistic send
          if (newMsg.sender_id === user.id) return;

          // Fetch profile asynchronously — guard with mounted ref
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", newMsg.sender_id)
            .single();

          // Component may have unmounted while profile was fetching
          if (!mounted) return;

          queryClient.setQueryData(queryKey, (old: any) => {
            if (!old) return old;

            // Deduplicate — skip if we already have this message id
            const exists = old.pages.some((page: MessageData[]) =>
              page.some((m) => m.id === newMsg.id)
            );
            if (exists) return old;

            // Append to the most recent page (index 0)
            const updatedPages = [...old.pages];
            updatedPages[0] = [
              ...updatedPages[0],
              {
                ...newMsg,
                profiles: senderProfile,
                status: "sent",
              } as MessageData,
            ];
            return { ...old, pages: updatedPages };
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [chatId, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── AppState: refetch on foreground resume ──
  useEffect(() => {
    if (!chatId || !user) return;

    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        // App came back from background — catch up on missed messages
        queryClient.invalidateQueries({ queryKey });
      }
    });

    return () => sub.remove();
  }, [chatId, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Optimistic send ──
  const sendMutation = useMutation({
    mutationFn: async ({
      content,
      tempId,
    }: {
      content: string;
      tempId: string;
    }) => {
      if (!chatId || !user) throw new Error("Not initialized");
      const senderId =
        isSystemChat && profile?.role === "admin" ? SYSTEM_USER_ID : user.id;
      return sendTextMessage(chatId, senderId, content);
    },

    onMutate: async ({ content, tempId }) => {
      if (!chatId || !user) return;

      // Cancel any in-flight refetch to avoid overwriting optimistic state
      await queryClient.cancelQueries({ queryKey });

      // Build the optimistic message
      const tempMsg: MessageData = {
        id: tempId,
        chat_id: chatId,
        sender_id: user.id,
        content,
        type: "text",
        created_at: new Date().toISOString(),
        status: "sending",
        profiles: {
          full_name: profile?.full_name ?? "",
          avatar_url: profile?.avatar_url ?? null,
        },
      };

      // Append temp message to the cache
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        const updatedPages = [...old.pages];
        updatedPages[0] = [...updatedPages[0], tempMsg];
        return { ...old, pages: updatedPages };
      });

      return { tempId };
    },

    onSuccess: (realMsg, { tempId }) => {
      // Replace the temp message with the confirmed DB row
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: MessageData[]) =>
            page.map((m) =>
              m.id === tempId
                ? { ...realMsg, status: "sent" as const, profiles: {
                    full_name: profile?.full_name ?? "",
                    avatar_url: profile?.avatar_url ?? null,
                  }}
                : m
            )
          ),
        };
      });

      // Only update the chat list — do NOT invalidate messages (we already have the real row)
      queryClient.invalidateQueries({ queryKey: ["chats", user?.id] });
    },

    onError: (_err, { tempId }) => {
      // Mark the temp message as failed instead of removing it
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: MessageData[]) =>
            page.map((m) =>
              m.id === tempId ? { ...m, status: "failed" } : m
            )
          ),
        };
      });
    },
  });

  const sendMessage = useCallback(
    async (content: string) => {
      const tempId = makeTempId();
      return sendMutation.mutateAsync({ content, tempId });
    },
    [sendMutation]
  );

  const retryMessage = useCallback(
    async (tempId: string, content: string) => {
      // Optimistically revert status back to "sending"
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: MessageData[]) =>
            page.map((m) =>
              m.id === tempId ? { ...m, status: "sending" } : m
            )
          ),
        };
      });
      return sendMutation.mutateAsync({ content, tempId });
    },
    [sendMutation, queryClient, queryKey]
  );

  return {
    messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    sendMessage,
    retryMessage,
    isSending: sendMutation.isPending,
  };
}
