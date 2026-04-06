import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  other_user_id: string | null;
}

export function useChats() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: chats = [], isLoading, refetch } = useQuery({
    queryKey: ['chats', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_user_chats', { p_user_id: user.id });
      if (error) throw error;
      return (data as any[]).map(c => ({
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
        other_user_id: c.res_other_user_id
      })) as ChatData[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const timeoutRef = useRef<any>(null);
  const debouncedRefetch = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => refetch(), 300);
  }, [refetch]);

  useEffect(() => {
    if (!user) return;

    const msgSub = supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new as any;
        
        queryClient.setQueryData(['chats', user.id], (prev: ChatData[] | undefined) => {
          if (!prev) return prev;
          const chatIndex = prev.findIndex(c => c.chat_id === newMessage.chat_id);
          if (chatIndex === -1) {
            debouncedRefetch();
            return prev;
          }

          const existingChat = prev[chatIndex];
          const isMe = newMessage.sender_id === user.id;

          if (!isMe && !existingChat.is_muted) {
            notificationService.play();
          }

          const updatedChat: ChatData = {
            ...existingChat,
            last_message: newMessage.content,
            last_message_time: newMessage.created_at,
            unread_count: isMe ? existingChat.unread_count : Number(existingChat.unread_count) + 1
          };

          const newChats = [...prev];
          newChats.splice(chatIndex, 1);
          return [updatedChat, ...newChats];
        });
      })
      .subscribe();

    // Only keeping critical subscriptions. Others will be handled by mutations or manual invalidation.
    const memSub = supabase.channel('public:chat_members')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_members', filter: `user_id=eq.${user.id}` }, debouncedRefetch)
      .subscribe();

    return () => {
      supabase.removeChannel(msgSub);
      supabase.removeChannel(memSub);
    };
  }, [user]);

  const toggleArchiveMutation = useMutation({
    mutationFn: async ({ chatId, isArchived }: { chatId: string; isArchived: boolean }) => {
      if (!user) return;
      if (isArchived) {
        await supabase.from('archived_chats').delete().eq('chat_id', chatId).eq('user_id', user.id);
      } else {
        await supabase.from('archived_chats').insert({ chat_id: chatId, user_id: user.id });
      }
    },
    onMutate: async ({ chatId, isArchived }) => {
      await queryClient.cancelQueries({ queryKey: ['chats', user?.id] });
      const previousChats = queryClient.getQueryData(['chats', user?.id]);
      queryClient.setQueryData(['chats', user?.id], (old: ChatData[] | undefined) => 
        old?.map(c => c.chat_id === chatId ? { ...c, is_archived: !isArchived } : c)
      );
      return { previousChats };
    },
    onSuccess: (_, { isArchived }) => {
      toast.success(isArchived ? 'Chat unarchived' : 'Chat archived');
    },
    onError: (err: any, __, context) => {
      if (context?.previousChats) {
        queryClient.setQueryData(['chats', user?.id], context.previousChats);
      }
      toast.error('Action failed: ' + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ chatId, isFavorite }: { chatId: string; isFavorite: boolean }) => {
      if (!user) return;
      if (isFavorite) {
        const { data: list } = await supabase.from('lists').select('id').eq('user_id', user.id).eq('name', 'Favorites').single();
        if (list) await supabase.from('chat_list_memberships').delete().eq('chat_id', chatId).eq('list_id', list.id);
      } else {
        let { data: list } = await supabase.from('lists').select('id').eq('user_id', user.id).eq('name', 'Favorites').single();
        if (!list) {
          const { data: newList } = await supabase.from('lists').insert({ user_id: user.id, name: 'Favorites' }).select().single();
          list = newList;
        }
        if (list) await supabase.from('chat_list_memberships').insert({ chat_id: chatId, list_id: list.id, user_id: user.id });
      }
    },
    onMutate: async ({ chatId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: ['chats', user?.id] });
      const previousChats = queryClient.getQueryData(['chats', user?.id]);
      queryClient.setQueryData(['chats', user?.id], (old: ChatData[] | undefined) => 
        old?.map(c => c.chat_id === chatId ? { ...c, is_favorite: !isFavorite } : c)
      );
      return { previousChats };
    },
    onSuccess: (_, { isFavorite }) => {
      toast.success(isFavorite ? 'Removed from Favorites' : 'Added to Favorites');
    },
    onError: (err: any, __, context) => {
      if (context?.previousChats) {
        queryClient.setQueryData(['chats', user?.id], context.previousChats);
      }
      toast.error('Action failed: ' + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
    }
  });

  const toggleMuteMutation = useMutation({
    mutationFn: async ({ chatId, isMuted }: { chatId: string; isMuted: boolean }) => {
      if (!user) return;
      const { error } = await supabase.from('chat_members').update({ is_muted: !isMuted }).eq('chat_id', chatId).eq('user_id', user.id);
      if (error) throw error;
    },
    onMutate: async ({ chatId, isMuted }) => {
      await queryClient.cancelQueries({ queryKey: ['chats', user?.id] });
      const previousChats = queryClient.getQueryData(['chats', user?.id]);
      queryClient.setQueryData(['chats', user?.id], (old: ChatData[] | undefined) => 
        old?.map(c => c.chat_id === chatId ? { ...c, is_muted: !isMuted } : c)
      );
      return { previousChats };
    },
    onSuccess: (_, { isMuted }) => {
      toast.success(isMuted ? 'Unmuted' : 'Muted');
    },
    onError: (err: any, __, context) => {
      if (context?.previousChats) {
        queryClient.setQueryData(['chats', user?.id], context.previousChats);
      }
      toast.error('Action failed: ' + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
    }
  });

  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      if (!user) return;
      const { error } = await supabase.from('chat_members').delete().eq('chat_id', chatId).eq('user_id', user.id);
      if (error) throw error;
    },
    onMutate: async (chatId) => {
      await queryClient.cancelQueries({ queryKey: ['chats', user?.id] });
      const previousChats = queryClient.getQueryData(['chats', user?.id]);
      queryClient.setQueryData(['chats', user?.id], (old: ChatData[] | undefined) => 
        old?.filter(c => c.chat_id !== chatId)
      );
      return { previousChats };
    },
    onSuccess: () => {
      toast.success('Chat removed');
    },
    onError: (err: any, __, context) => {
      if (context?.previousChats) {
        queryClient.setQueryData(['chats', user?.id], context.previousChats);
      }
      toast.error('Action failed: ' + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
    }
  });

  return { 
    chats, 
    isLoading, 
    refetch, 
    toggleArchive: (chatId: string, isArchived: boolean) => toggleArchiveMutation.mutate({ chatId, isArchived }),
    toggleFavorite: (chatId: string, isFavorite: boolean) => toggleFavoriteMutation.mutate({ chatId, isFavorite }),
    toggleMute: (chatId: string, isMuted: boolean) => toggleMuteMutation.mutate({ chatId, isMuted }),
    deleteChat: (chatId: string) => deleteChatMutation.mutate(chatId)
  };
}
