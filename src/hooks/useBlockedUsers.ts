import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export function useBlockedUsers() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['blocked_users', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id);
      
      if (error) throw error;
      return (data as any[]).map(b => b.blocked_id);
    },
    enabled: !!user,
    staleTime: Infinity, // Blocked users don't change often
  });
}
