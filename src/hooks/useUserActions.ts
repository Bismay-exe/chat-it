import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function useUserActions() {
  const { user } = useAuthStore();
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBlockedUsers = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id);
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('not found')) {
            console.warn('blocked_users table not found yet');
            setBlockedUsers([]);
            return;
        }
        throw error;
      }
      setBlockedUsers(data?.map((b: any) => b.blocked_id) || []);
    } catch (err: any) {
      console.warn('Failed to fetch blocked users:', err.message);
    }
  }, [user]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const blockUser = async (targetId: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('blocked_users')
        .insert({ blocker_id: user.id, blocked_id: targetId });
      
      if (error) throw error;
      setBlockedUsers(prev => [...prev, targetId]);
      toast.success('User blocked');
    } catch (err: any) {
      toast.error('Failed to block user: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const unblockUser = async (targetId: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetId);
      
      if (error) throw error;
      setBlockedUsers(prev => prev.filter(id => id !== targetId));
      toast.success('User unblocked');
    } catch (err: any) {
      toast.error('Failed to unblock user: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const reportUser = async (targetId: string, reason: string, chatId?: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_id: targetId,
          reason,
          chat_id: chatId
        });
      
      if (error) throw error;
      toast.success('User reported. Thank you for keeping Chat-It safe!');
    } catch (err: any) {
      toast.error('Failed to report user: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isBlocked = (targetId: string) => blockedUsers.includes(targetId);

  return {
    blockedUsers,
    isLoading,
    blockUser,
    unblockUser,
    reportUser,
    isBlocked,
    refreshBlocks: fetchBlockedUsers
  };
}
