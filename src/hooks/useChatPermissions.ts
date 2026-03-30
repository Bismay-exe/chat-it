import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export interface GroupPermissions {
  can_edit_group_settings: boolean;
  can_send_messages: boolean;
  can_add_members: boolean;
  can_invite_via_link: boolean;
  require_admin_approval: boolean;
}

export function useChatPermissions(chatId: string | undefined) {
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState<GroupPermissions>({
    can_edit_group_settings: false,
    can_send_messages: true,
    can_add_members: true,
    can_invite_via_link: true,
    require_admin_approval: false
  });
  const [role, setRole] = useState<'admin' | 'member' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chatId || !user) return;

    const fetchPermissions = async () => {
      try {
        // Fetch permissions
        const { data: permData } = await supabase
          .from('group_permissions')
          .select('*')
          .eq('chat_id', chatId)
          .single();

        if (permData) {
          setPermissions({
            can_edit_group_settings: !!permData.can_edit_group_settings,
            can_send_messages: !!permData.can_send_messages,
            can_add_members: !!permData.can_add_members,
            can_invite_via_link: !!permData.can_invite_via_link,
            require_admin_approval: !!permData.require_admin_approval,
          });
        }

        // Fetch user role
        const { data: memberData } = await supabase
          .from('chat_members')
          .select('role')
          .eq('chat_id', chatId)
          .eq('user_id', user.id)
          .single();

        if (memberData) setRole(memberData.role as 'admin' | 'member');
      } catch (err) {
        console.error('Error fetching permissions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();

    // Subscribe to permission changes
    const permChannel = supabase.channel(`group_permissions:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'group_permissions', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setPermissions(payload.new as GroupPermissions);
        }
      )
      .subscribe();

    // Subscribe to member role changes
    const roleChannel = supabase.channel(`chat_members:${chatId}:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_members', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          if (payload.new.user_id === user.id) {
            setRole(payload.new.role as 'admin' | 'member');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(permChannel);
      supabase.removeChannel(roleChannel);
    };
  }, [chatId, user?.id]);

  const isAdmin = role === 'admin';
  const canSend = isAdmin || permissions.can_send_messages;
  const canAdd = isAdmin || permissions.can_add_members;
  const canEdit = isAdmin || permissions.can_edit_group_settings;
  const canInvite = isAdmin || permissions.can_invite_via_link;

  return { permissions, role, isAdmin, canSend, canAdd, canEdit, canInvite, isLoading };
}
