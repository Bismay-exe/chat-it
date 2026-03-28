import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { notificationService } from '@/utils/notifications';

export interface ChatData {
  chat_id: string;
  chat_type: 'direct' | 'group';
  name: string;
  avatar_url: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  is_muted: boolean;
  is_archived: boolean;
  is_favorite: boolean;
}

export function useChats() {
  const { user } = useAuthStore();
  const [chats, setChats] = useState<ChatData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChats = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('get_user_chats', {
        p_user_id: user.id
      });
      if (error) throw error;
      setChats((data as ChatData[]) || []);
    } catch (err: any) {
      toast.error('Failed to load chats: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();

    if (!user) return;

    // Realtime subscription for messages dropping in to update last_message
    const msgSub = supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new;
        if (newMessage.sender_id !== user.id) {
          // Check if this chat is muted in our current state
          setChats(prev => {
             const chat = prev.find(c => c.chat_id === newMessage.chat_id);
             if (!chat || !chat.is_muted) {
               notificationService.play();
             }
             return prev;
          });
        }
        fetchChats();
      })
      .subscribe();

    const memSub = supabase.channel('public:chat_members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_members', filter: `user_id=eq.${user.id}` }, fetchChats)
      .subscribe();

    const readSub = supabase.channel('public:message_reads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reads', filter: `user_id=eq.${user.id}` }, fetchChats)
      .subscribe();

    const archSub = supabase.channel('public:archived_chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'archived_chats', filter: `user_id=eq.${user.id}` }, fetchChats)
      .subscribe();

    const listSub = supabase.channel('public:chat_list_memberships')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_list_memberships', filter: `user_id=eq.${user.id}` }, fetchChats)
      .subscribe();

    return () => {
      supabase.removeChannel(msgSub);
      supabase.removeChannel(memSub);
      supabase.removeChannel(readSub);
      supabase.removeChannel(archSub);
      supabase.removeChannel(listSub);
    };
  }, [user]);

  const toggleArchive = async (chatId: string, isArchived: boolean) => {
    if (!user) return;
    try {
      if (isArchived) {
        await supabase.from('archived_chats').delete().eq('chat_id', chatId).eq('user_id', user.id);
        toast.success('Chat unarchived');
      } else {
        await supabase.from('archived_chats').insert({ chat_id: chatId, user_id: user.id });
        toast.success('Chat archived');
      }
      fetchChats();
    } catch (err: any) {
      toast.error('Action failed: ' + err.message);
    }
  };

  const toggleFavorite = async (chatId: string, isFavorite: boolean) => {
    if (!user) return;
    try {
      if (isFavorite) {
        // Find the Favorites list ID first
        const { data: list } = await supabase.from('lists').select('id').eq('user_id', user.id).eq('name', 'Favorites').single();
        if (list) {
          await supabase.from('chat_list_memberships').delete().eq('chat_id', chatId).eq('list_id', list.id);
        }
        toast.success('Removed from Favorites');
      } else {
        // Find or create Favorites list
        let { data: list } = await supabase.from('lists').select('id').eq('user_id', user.id).eq('name', 'Favorites').single();
        if (!list) {
          const { data: newList } = await supabase.from('lists').insert({ user_id: user.id, name: 'Favorites' }).select().single();
          list = newList;
        }
        if (list) {
          await supabase.from('chat_list_memberships').insert({ chat_id: chatId, list_id: list.id, user_id: user.id });
        }
        toast.success('Added to Favorites');
      }
      fetchChats();
    } catch (err: any) {
      toast.error('Action failed: ' + err.message);
    }
  };

  const toggleMute = async (chatId: string, isMuted: boolean) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('chat_members')
        .update({ is_muted: !isMuted })
        .eq('chat_id', chatId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      toast.success(isMuted ? 'Unmuted' : 'Muted');
      fetchChats();
    } catch (err: any) {
      toast.error('Action failed: ' + err.message);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!user) return;
    try {
      // For now, "Delete Chat" means leaving the chat (removing membership)
      const { error } = await supabase
        .from('chat_members')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      toast.success('Chat removed');
      fetchChats();
    } catch (err: any) {
      toast.error('Action failed: ' + err.message);
    }
  };

  return { chats, isLoading, refetch: fetchChats, toggleArchive, toggleFavorite, toggleMute, deleteChat };
}
