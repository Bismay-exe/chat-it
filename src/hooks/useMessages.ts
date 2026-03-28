import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export interface MessageData {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string } | null;
}

export function useMessages(chatId: string | undefined) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!chatId || !user) return;

    let mounted = true;
    setIsLoading(true);

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, profiles(full_name)')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        if (mounted) setMessages(data as any || []);
      } catch (err: any) {
        if(mounted) toast.error('Failed to load messages: ' + err.message);
      } finally {
        if(mounted) setIsLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase.channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [chatId, user?.id]);

  // Mark as read whenever messages array updates
  useEffect(() => {
    if (!chatId || !user || messages.length === 0) return;
    
    const markRead = async () => {
      if (!chatId || !user) return;
      try {
        // Find all messages from others that don't have a read record yet
        const { data: unread, error: rpcError } = await (supabase as any).rpc('get_unread_message_ids', {
          p_chat_id: chatId,
          p_user_id: user.id
        });

        if (rpcError) throw rpcError;

        if (unread && unread.length > 0) {
          const reads = unread.map((row: any) => ({
            message_id: row.id,
            user_id: user.id
          }));
          await supabase.from('message_reads').insert(reads);
        }
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    };
    markRead();
  }, [messages, chatId, user?.id]);

  const sendMessage = async (content: string) => {
    if (!chatId || !user || !content.trim()) return;
    try {
      const { error } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: user.id,
        content: content.trim(),
        type: 'text'
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error('Failed to send message: ' + err.message);
    }
  };

  return { messages, isLoading, sendMessage };
}
