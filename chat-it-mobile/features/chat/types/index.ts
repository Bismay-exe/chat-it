export interface ChatData {
  chat_id: string;
  chat_type: "direct" | "group";
  name: string;
  avatar_url: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  is_muted: boolean;
  is_archived: boolean;
  is_favorite: boolean;
  other_user_id: string | null;
}

export interface MessageData {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: "text" | "image" | "video" | "file";
  media_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null } | null;
  status?: "sending" | "sent" | "error" | "read" | "failed";
}
