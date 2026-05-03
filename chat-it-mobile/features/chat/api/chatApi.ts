import { supabase } from "@/lib/supabase";
import type { ChatData, MessageData } from "@/features/chat/types";

/**
 * Fetch all chats for a user via the get_user_chats RPC.
 * Maps the res_ prefixed columns to our ChatData interface.
 */
export async function fetchUserChats(userId: string): Promise<ChatData[]> {
  const { data, error } = await supabase.rpc("get_user_chats", {
    p_user_id: userId,
  });
  if (error) throw error;

  return ((data as any[]) ?? []).map((c) => ({
    chat_id: c.res_chat_id,
    chat_type: c.res_chat_type,
    name: c.res_name,
    avatar_url: c.res_avatar_url,
    last_message: c.res_last_message,
    last_message_time: c.res_last_message_time,
    unread_count: Number(c.res_unread_count),
    is_muted: c.res_is_muted,
    is_archived: c.res_is_archived,
    is_favorite: c.res_is_favorite,
    other_user_id: c.res_other_user_id,
  }));
}

/**
 * Fetch paginated messages for a chat via get_chat_messages RPC.
 * Returns messages in chronological order (oldest first).
 */
export async function fetchChatMessages(
  chatId: string,
  userId: string,
  before?: string | null,
  limit: number = 30
): Promise<MessageData[]> {
  const { data, error } = await (supabase as any).rpc("get_chat_messages", {
    p_chat_id: chatId,
    p_user_id: userId,
    p_before: before ?? null,
    p_limit: limit,
  });
  if (error) throw error;

  // RPC returns newest-first, reverse to get chronological order
  return ((data as any[]) ?? [])
    .map((m) => ({
      id: m.res_id,
      chat_id: m.res_chat_id,
      sender_id: m.res_sender_id,
      content: m.res_content,
      type: m.res_type,
      created_at: m.res_created_at,
      profiles: m.res_profiles,
      status: m.res_status as MessageData["status"],
      media_url: m.res_media_url,
      file_name: m.res_file_name,
      file_size: m.res_file_size || null,
    }))
    .reverse();
}

/**
 * Send a text message. Simple insert — no optimistic logic.
 */
export async function sendTextMessage(
  chatId: string,
  senderId: string,
  content: string
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      content: content.trim(),
      type: "text",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Sprint 3 APIs ──

export interface SearchResult {
  id: string;
  type: "user" | "group";
  name: string;
  username?: string;
  avatar_url: string | null;
}

/**
 * Search users by username or full_name.
 */
export async function searchUsers(
  query: string,
  currentUserId: string
): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .neq("id", currentUserId)
    .limit(15);
  if (error) throw error;

  return (data ?? []).map((u) => ({
    id: u.id,
    type: "user" as const,
    name: u.full_name,
    username: u.username,
    avatar_url: u.avatar_url,
  }));
}

/**
 * Search existing chats via the search_user_chats RPC.
 */
export async function searchChats(
  query: string,
  userId: string
): Promise<SearchResult[]> {
  const { data, error } = await (supabase as any).rpc("search_user_chats", {
    p_query: query,
    p_user_id: userId,
  });
  if (error) throw error;

  return ((data as any[]) ?? []).map((c) => ({
    id: c.chat_id,
    type: c.chat_type as "user" | "group",
    name: c.name,
    username: c.username,
    avatar_url: c.avatar_url,
  }));
}

/**
 * Check if a direct chat already exists between two users.
 */
export async function getDirectChatBetweenUsers(
  user1Id: string,
  user2Id: string
): Promise<string | null> {
  const { data, error } = await (supabase as any).rpc(
    "get_direct_chat_between_users",
    {
      user1_id: user1Id,
      user2_id: user2Id,
    }
  );
  if (error) throw error;
  return data && data.length > 0 ? data[0].chat_id : null;
}

/**
 * Create a new direct chat between two users.
 */
export async function createDirectChat(
  currentUserId: string,
  otherUserId: string
): Promise<string> {
  // Check if chat already exists
  const existingId = await getDirectChatBetweenUsers(
    currentUserId,
    otherUserId
  );
  if (existingId) return existingId;

  // Create new chat
  const { data: chat, error: chatErr } = await supabase
    .from("chats")
    .insert({ type: "direct" })
    .select()
    .single();
  if (chatErr || !chat) throw chatErr || new Error("Failed to create chat");

  // Add both members
  const { error: memberErr } = await supabase.from("chat_members").insert([
    { chat_id: chat.id, user_id: currentUserId, role: "member" },
    { chat_id: chat.id, user_id: otherUserId, role: "member" },
  ]);
  if (memberErr) throw memberErr;

  return chat.id;
}

/**
 * Toggle archive status for a chat.
 * Uses the `archived_chats` table (insert to archive, delete to unarchive).
 */
export async function toggleArchiveChat(
  chatId: string,
  userId: string,
  isArchived: boolean
) {
  if (isArchived) {
    // Archive: insert into archived_chats
    const { error } = await supabase
      .from("archived_chats")
      .insert({ chat_id: chatId, user_id: userId });
    if (error) throw error;
  } else {
    // Unarchive: delete from archived_chats
    const { error } = await supabase
      .from("archived_chats")
      .delete()
      .eq("chat_id", chatId)
      .eq("user_id", userId);
    if (error) throw error;
  }
}
