import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export interface CustomList {
  id: string;
  name: string;
  is_default: boolean;
}

export function useChatLists() {
  const { user } = useAuthStore();
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [memberships, setMemberships] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchLists = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setCustomLists((data || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        is_default: !!l.is_default
      })));
    } catch (err: any) {
      console.error('Error fetching lists:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchMemberships = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('chat_list_memberships')
        .select('list_id, chat_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const mapping: Record<string, string[]> = {};
      data?.forEach((m: any) => {
        if (m.list_id && m.chat_id) {
          if (!mapping[m.list_id]) mapping[m.list_id] = [];
          mapping[m.list_id].push(m.chat_id);
        }
      });
      setMemberships(mapping);
    } catch (err: any) {
      console.error('Error fetching memberships:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchLists();
      fetchMemberships();
    }
  }, [user, fetchLists, fetchMemberships]);

  const toggleMembership = async (chatId: string, listId: string) => {
    if (!user) return;
    
    const isMember = memberships[listId]?.includes(chatId);
    
    try {
      if (isMember) {
        const { error } = await supabase
          .from('chat_list_memberships')
          .delete()
          .eq('chat_id', chatId)
          .eq('list_id', listId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('chat_list_memberships')
          .insert({
            chat_id: chatId,
            list_id: listId,
            user_id: user.id
          });
        
        if (error) throw error;
      }
      
      // Update local state optimistically or refetch
      fetchMemberships();
    } catch (err: any) {
      toast.error('Failed to update list: ' + err.message);
    }
  };

  return {
    customLists,
    memberships,
    isLoading,
    toggleMembership,
    refetch: () => {
      fetchLists();
      fetchMemberships();
    }
  };
}
