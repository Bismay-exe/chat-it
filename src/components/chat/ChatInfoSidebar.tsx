import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Info, Users, Calendar, Shield, Bell,
  ImageIcon, Link as LinkIcon, X, ChevronRight, Ban, UserX
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatInfoSidebarProps {
  chatId: string;
  onClose?: () => void;
  className?: string;
}

export const ChatInfoSidebar: React.FC<ChatInfoSidebarProps> = ({ chatId, onClose, className }) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [chatType, setChatType] = useState<'direct' | 'group' | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!chatId) return;

    const fetchInfo = async () => {
      setLoading(true);
      try {
        // 1. Get basic chat type
        const { data: chatData } = await supabase
          .from('chats')
          .select('type, created_at, created_by:profiles(full_name)')
          .eq('id', chatId)
          .single();

        if (!chatData) return;
        setChatType(chatData.type as 'direct' | 'group');

        if (chatData.type === 'group') {
          // Fetch Group Details
          const { data: groupData } = await supabase
            .from('group_info')
            .select('*')
            .eq('chat_id', chatId)
            .single();

          const { data: memberData } = await supabase
            .from('chat_members')
            .select('user_id, role, profiles(username, full_name, avatar_url)')
            .eq('chat_id', chatId);

          setDetails({ ...groupData, created_at: chatData.created_at, created_by: chatData.created_by });
          setMembers(memberData || []);
        } else {
          // Fetch Remote User Details for Direct Chat
          const { data: memberData } = await supabase
            .from('chat_members')
            .select('user_id, profiles(*)')
            .eq('chat_id', chatId)
            .neq('user_id', user?.id || '')
            .single();

          if (memberData) {
            setDetails(memberData.profiles);
          }
        }
      } catch (err) {
        console.error('Failed to fetch chat info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [chatId, user?.id]);

  if (loading) {
    return (
      <div className={cn("w-full h-full bg-background border-l border-border flex flex-col pt-16 px-6 gap-6", className)}>
        <Skeleton className="w-32 h-32 rounded-full mx-auto" />
        <Skeleton className="h-6 w-48 mx-auto" />
        <div className="space-y-4 pt-10">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const name = chatType === 'group' ? details?.name : details?.full_name;
  const avatar = details?.avatar_url;
  const about = chatType === 'group' ? details?.about : details?.about;

  return (
    <div className={cn("w-full h-full bg-background border-l border-border flex flex-col relative", className)}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
        <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground opacity-60">Info</h3>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Profile Card */}
        <div className="flex flex-col items-center p-8 bg-secondary/5">
          <Avatar
            src={avatar}
            fallback={name || '?'}
            className="w-28 h-28 rounded-full shadow-lg border-2 border-background ring-1 ring-border/50"
            size="xl"
          />
          <h2 className="text-xl font-bold mt-4 text-center">{name || 'Unnamed'}</h2>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {chatType === 'group' ? `${members.length} members` : `@${details?.username || 'user'}`}
          </p>
        </div>

        <div className="p-4 space-y-4">
          {/* Quick Actions (Mini) */}
          <div className="grid grid-cols-3 gap-2 py-2">
            <ActionIcon Icon={Bell} label="Mute" />
            <ActionIcon Icon={ImageIcon} label="Media" />
            <ActionIcon Icon={LinkIcon} label="Links" />
          </div>

          {/* Description Section */}
          <div className="bg-secondary/10 p-5 rounded-3xl space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Info className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-wider">Bio / Description</span>
            </div>
            <p className="text-sm leading-relaxed">
              {about || "No description provided."}
            </p>
            {chatType === 'group' && (
              <div className="pt-3 mt-3 border-t border-border/20 flex items-center gap-2 text-[10px] text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>Created {details?.created_at ? format(new Date(details.created_at), 'MMM yyyy') : '...'}</span>
              </div>
            )}
          </div>

          {/* Members List (Group Only) */}
          {chatType === 'group' && (
            <div className="bg-background rounded-3xl border border-border/50 overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-secondary/20 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Members</span>
                <Users className="w-3.5 h-3.5 opacity-40" />
              </div>
              <div className="divide-y divide-border/20">
                {members.slice(0, 10).map(m => (
                  <div key={m.user_id} className="p-3 flex items-center gap-3 hover:bg-secondary/20 transition-colors cursor-pointer group">
                    <Avatar src={m.profiles.avatar_url} fallback={m.profiles.full_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{m.profiles.full_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate font-medium">@{m.profiles.username}</p>
                    </div>
                    {m.role === 'admin' && <Shield className="w-3 h-3 text-primary" />}
                  </div>
                ))}
                {members.length > 10 && (
                  <button className="w-full p-3 text-xs font-bold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1 uppercase tracking-widest">
                    View All {members.length} <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Dangerous Zone */}
          <div className="pt-4 space-y-2">
            <button className="w-full p-4 flex items-center gap-4 rounded-3xl hover:bg-red-500/10 text-red-500 transition-all text-left">
              <div className="p-2 bg-red-500/10 rounded-full"><Ban className="w-4 h-4" /></div>
              <span className="font-bold text-xs uppercase tracking-widest">{chatType === 'group' ? 'Leave Group' : 'Block User'}</span>
            </button>
            <button className="w-full p-4 flex items-center gap-4 rounded-3xl hover:bg-red-500/10 text-red-500 transition-all text-left">
              <div className="p-2 bg-red-500/10 rounded-full"><UserX className="w-4 h-4" /></div>
              <span className="font-bold text-xs uppercase tracking-widest">Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionIcon = ({ Icon, label }: { Icon: any; label: string }) => (
  <button className="flex flex-col items-center gap-1.5 group">
    <div className="p-3 bg-secondary/30 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-all active:scale-90">
      <Icon className="w-4 h-4" />
    </div>
    <span className="text-[9px] font-black uppercase tracking-tighter opacity-60 group-hover:opacity-100">{label}</span>
  </button>
);
