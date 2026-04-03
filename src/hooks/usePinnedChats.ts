import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export interface PinnedChat {
  id: string;
  chat_id: string;
  list_key: string;
}

export function usePinnedChats() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: pins = [], isLoading } = useQuery({
    queryKey: ['pinned_chats', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('pinned_chats')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as PinnedChat[];
    },
    enabled: !!user,
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ chatId, listKey, isPinned }: { chatId: string; listKey: string; isPinned: boolean }) => {
      if (!user) return;

      if (isPinned) {
        const { error } = await (supabase as any)
          .from('pinned_chats')
          .delete()
          .eq('user_id', user.id)
          .eq('chat_id', chatId)
          .eq('list_key', listKey);
        if (error) throw error;
      } else {
        // Enforce Max 5 Limit
        const currentListPins = pins.filter(p => p.list_key === listKey);
        if (currentListPins.length >= 5) {
          throw new Error('You can only pin up to 5 chats in this list.');
        }

        const { error } = await (supabase as any)
          .from('pinned_chats')
          .insert({
            user_id: user.id,
            chat_id: chatId,
            list_key: listKey
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, { isPinned, listKey }) => {
      toast.success(isPinned ? `Unpinned from ${listKey}` : `Pinned to ${listKey}`);
      queryClient.invalidateQueries({ queryKey: ['pinned_chats', user?.id] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Action failed');
    }
  });

  return {
    pins,
    isLoading,
    togglePin: (chatId: string, listKey: string, isPinned: boolean) => 
      togglePinMutation.mutate({ chatId, listKey, isPinned }),
    isPinning: togglePinMutation.isPending,
  };
}
