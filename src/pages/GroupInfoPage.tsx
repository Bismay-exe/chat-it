import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Bell, BellOff, MessageSquare, UserPlus, LogOut, ShieldCheck, Trash2, Calendar, Info, Search, Shield, Link, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar } from '@/components/ui/Avatar';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { QRCodeSVG } from 'qrcode.react';
import { useChatPermissions } from '@/hooks/useChatPermissions';
import type { GroupPermissions } from '@/hooks/useChatPermissions';
import { Skeleton } from '@/components/ui/Skeleton';

interface Member {
  user_id: string;
  role: 'admin' | 'member';
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

interface GroupDetails {
  id: string;
  name: string;
  avatar_url: string | null;
  about: string;
  is_public: boolean;
  created_at: string;
  created_by: {
    full_name: string;
  } | null;
}

export const GroupInfoPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [recentContacts, setRecentContacts] = useState<any[]>([]);
  
  const inviteUrl = `${window.location.origin}/chats/${id}`;
  const { permissions, isAdmin, canAdd, canEdit, isLoading: permsLoading } = useChatPermissions(id);

  useEffect(() => {
    if (!id || !user) return;
    
    const fetchData = async () => {
      // Fetch Group Info + Chat Creator
      const { data: chatData } = await supabase
        .from('chats')
        .select(`
          created_at,
          created_by:profiles(full_name),
          group_info(id, name, avatar_url, about, is_public)
        `)
        .eq('id', id)
        .single();

      if (chatData) {
        const info = (chatData.group_info as any)?.[0] || {};
        setGroupDetails({
          id: id || '',
          name: info.name || 'Unknown Group',
          avatar_url: info.avatar_url || null,
          about: info.about || '',
          is_public: !!info.is_public,
          created_at: chatData.created_at || new Date().toISOString(),
          created_by: chatData.created_by as any || null
        });
      }

      // Fetch Members
      const { data: memberData } = await supabase
        .from('chat_members')
        .select('user_id, role, is_muted, profiles(username, full_name, avatar_url)')
        .eq('chat_id', id);
        
      if (memberData) {
        setMembers(memberData as any[]);
        const currentUserMember = memberData.find(m => m.user_id === user.id);
        if (currentUserMember) setIsMuted(!!currentUserMember.is_muted);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [id, user]);

  useEffect(() => {
    if (showAddMember && user) {
      const fetchRecent = async () => {
        const { data } = await (supabase.rpc as any)('get_recent_contacts', { p_user_id: user.id });
        if (data) setRecentContacts(data);
      };
      fetchRecent();
    }
  }, [showAddMember, user]);

  const handleAddMember = async (userId: string) => {
    if (!id) return;
    try {
      const { error } = await supabase.from('chat_members').insert({
        chat_id: id,
        user_id: userId,
        role: 'member'
      });
      if (error) throw error;
      
      const { data: updatedMembers } = await supabase
        .from('chat_members')
        .select('user_id, role, profiles(username, full_name, avatar_url)')
        .eq('chat_id', id);
      
      if (updatedMembers) setMembers(updatedMembers as any);
      
      toast.success("Member added");
      setShowAddMember(false);
    } catch (err: any) {
      toast.error("Failed to add: " + err.message);
    }
  };

  const handleToggleMute = async () => {
    if (!id || !user) return;
    const newMuteState = !isMuted;
    try {
      const { error } = await supabase
        .from('chat_members')
        .update({ is_muted: newMuteState })
        .eq('chat_id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      setIsMuted(newMuteState);
      toast.success(newMuteState ? "Group muted" : "Group unmuted");
    } catch (err: any) {
      toast.error("Failed to update mute: " + err.message);
    }
  };

  const handleUpdatePermissions = async (newPerms: Partial<GroupPermissions>) => {
    if (!id || !isAdmin) return;
    try {
      const { error } = await supabase
        .from('group_permissions')
        .update(newPerms)
        .eq('chat_id', id);
      if (error) throw error;
      toast.success("Permissions updated");
    } catch (err: any) {
      toast.error("Update failed: " + err.message);
    }
  };

  const handleLeaveGroup = async () => {
    if (!id || !user) return;
    const confirm = window.confirm("Are you sure you want to leave this group?");
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('chat_members')
        .delete()
        .eq('chat_id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      toast.success("Left group");
      navigate('/chats');
    } catch (err: any) {
      toast.error("Failed to leave: " + err.message);
    }
  };

  const handleDeleteGroup = async () => {
    if (!id || !isAdmin) return;
    const confirm = window.confirm("DELETE GROUP? This cannot be undone.");
    if (!confirm) return;

    try {
      const { error } = await supabase.from('chats').delete().eq('id', id);
      if (error) throw error;
      toast.success("Group deleted");
      navigate('/chats');
    } catch (err: any) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  if (isLoading || permsLoading) {
    return (
      <div className="flex flex-col h-full bg-background absolute inset-0 z-50 overflow-y-auto">
        <TopBar leftElement={<div className="w-20" />} />
        <div className="flex flex-col items-center p-8 bg-background border-b border-border">
          <Skeleton className="w-32 h-32 rounded-full" />
          <Skeleton className="h-8 w-48 mt-4" />
          <Skeleton className="h-4 w-24 mt-2" />
        </div>
        <div className="max-w-2xl w-full mx-auto p-4 space-y-4">
          <div className="flex justify-around bg-background p-4 rounded-3xl border border-border">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-16 h-16 rounded-2xl" />)}
          </div>
          <Skeleton className="h-20 w-full rounded-3xl" />
          <div className="bg-background rounded-3xl p-5 border border-border space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-secondary/10 absolute inset-0 z-50 overflow-y-auto">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg">Group Info</span>
          </div>
        }
        rightElement={
          <div className="flex items-center gap-1">
            {groupDetails?.is_public && (
              <button 
                onClick={() => setShowInvite(true)}
                className="p-2 hover:bg-secondary rounded-full premium-transition text-primary"
              >
                <Link className="w-5 h-5" />
              </button>
            )}
            {isAdmin && (
              <DropdownMenu 
                items={[
                  { label: 'Group Permissions', icon: <ShieldCheck className="w-4 h-4" />, onClick: () => setShowPermissions(true) },
                  { label: 'Delete Group', icon: <Trash2 className="w-4 h-4" />, onClick: handleDeleteGroup, textClass: 'text-red-500' }
                ]}
              />
            )}
          </div>
        }
      />
      
      <div className="flex flex-col items-center p-8 bg-background border-b border-border shadow-sm">
        <div className="relative group">
          <Avatar 
            src={groupDetails?.avatar_url || undefined} 
            fallback={groupDetails?.name || 'G'} 
            className="w-32 h-32 rounded-full shadow-xl border-4 border-background ring-1 ring-border"
            size="xl"
          />
          {canEdit && (
            <button className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full shadow-lg border-2 border-background active:scale-95 transition-transform">
              <UserPlus className="w-4 h-4" />
            </button>
          )}
        </div>
        <h2 className="text-2xl font-bold mt-4 tracking-tight">{groupDetails?.name || 'Unknown Group'}</h2>
        <p className="text-muted-foreground mt-1 font-medium">{members.length} members</p>
      </div>

      <div className="max-w-2xl w-full mx-auto p-4 space-y-4 pb-20">
        <div className="flex justify-around bg-background p-4 rounded-3xl shadow-sm border border-border">
          <ActionButton Icon={MessageSquare} label="Message" onClick={() => navigate(`/chats/${id}`)} color="text-primary" />
          <ActionButton 
            Icon={isMuted ? BellOff : Bell} 
            label={isMuted ? "Unmute" : "Mute"} 
            onClick={handleToggleMute} 
          />
          {canAdd && <ActionButton Icon={UserPlus} label="Add" onClick={() => setShowAddMember(true)} />}
          <ActionButton Icon={LogOut} label="Leave" onClick={handleLeaveGroup} color="text-red-500" />
        </div>

        <button 
          onClick={() => navigate(`/chats/${id}/media`)}
          className="w-full bg-background p-5 rounded-3xl shadow-sm border border-border flex items-center justify-between hover:bg-secondary/20 premium-transition group"
        >
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2 text-primary">
              <ImageIcon className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Shared Content</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Media, Links and Docs</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="bg-background p-5 rounded-3xl shadow-sm border border-border space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Info className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Description</span>
          </div>
          <p className="text-[15px] leading-relaxed">
            {groupDetails?.about || "No description provided."}
          </p>
          <div className="pt-4 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Created by {groupDetails?.created_by?.full_name || 'System'}, {groupDetails?.created_at ? format(new Date(groupDetails.created_at), 'MMM dd, yyyy') : ''}
            </span>
          </div>
        </div>

        <div className="bg-background rounded-3xl shadow-sm border border-border overflow-hidden">
           <div className="px-5 py-4 bg-secondary/20 text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between items-center">
             <span>{members.length} Participants</span>
             <Search className="w-4 h-4" />
           </div>
           
           <div className="divide-y divide-border/50">
             {members.map(member => (
                <div key={member.user_id} className="w-full p-4 flex items-center gap-4 hover:bg-secondary/30 premium-transition">
                  <Avatar src={member.profiles.avatar_url} fallback={member.profiles.full_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{member.user_id === user?.id ? 'You' : member.profiles.full_name}</h3>
                    <p className="text-xs text-muted-foreground truncate">@{member.profiles.username}</p>
                  </div>
                  {member.role === 'admin' && (
                    <span className="shrink-0 text-[9px] font-black text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20">ADMIN</span>
                  )}
                </div>
             ))}
           </div>
        </div>
      </div>

      <BottomSheet isOpen={showInvite} onClose={() => setShowInvite(false)} title="Group Invite">
        <div className="p-8 flex flex-col items-center gap-6">
          <div className="bg-white p-4 rounded-3xl shadow-inner border border-border">
            <QRCodeSVG value={inviteUrl} size={200} />
          </div>
          <div className="w-full space-y-4">
             <div className="p-4 bg-secondary/30 rounded-2xl border border-border/50 text-xs font-mono break-all text-center">
               {inviteUrl}
             </div>
             <button 
               onClick={() => {
                 navigator.clipboard.writeText(inviteUrl);
                 toast.success("Link copied!");
               }}
               className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold premium-transition active:scale-95"
             >
               Copy Link
             </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showPermissions} onClose={() => setShowPermissions(false)} title="Group Permissions">
        <div className="p-4 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Members can:</h3>
            <PermissionToggle label="Edit group settings" icon={Shield} value={permissions.can_edit_group_settings} onChange={(v) => handleUpdatePermissions({ ...permissions, can_edit_group_settings: v })} />
            <PermissionToggle label="Send new messages" icon={MessageSquare} value={permissions.can_send_messages} onChange={(v) => handleUpdatePermissions({ ...permissions, can_send_messages: v })} />
            <PermissionToggle label="Add other members" icon={UserPlus} value={permissions.can_add_members} onChange={(v) => handleUpdatePermissions({ ...permissions, can_add_members: v })} />
            <PermissionToggle label="Invite via link or QR code" icon={Link} value={permissions.can_invite_via_link} onChange={(v) => handleUpdatePermissions({ ...permissions, can_invite_via_link: v })} />
          </div>
          
          <div className="space-y-4 pt-4 border-t border-border">
             <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Admin Controls:</h3>
             <PermissionToggle label="Approve new members" icon={ShieldCheck} value={permissions.require_admin_approval} onChange={(v) => handleUpdatePermissions({ ...permissions, require_admin_approval: v })} />
          </div>

          <button onClick={() => setShowPermissions(false)} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium mt-4">Done</button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Members">
        <div className="flex flex-col h-[70vh]">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Input placeholder="Search contacts..." className="pl-10 rounded-xl bg-secondary/30 border-none" />
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {recentContacts.length > 0 ? (
              recentContacts.map(contact => {
                const isAlreadyMember = members.some(m => m.user_id === contact.id);
                return (
                  <button 
                    key={contact.id}
                    disabled={isAlreadyMember}
                    onClick={() => handleAddMember(contact.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-3 rounded-2xl transition-colors text-left",
                      isAlreadyMember ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary/40"
                    )}
                  >
                    <Avatar src={contact.avatar_url} fallback={contact.full_name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{contact.full_name}</div>
                      <div className="text-xs text-muted-foreground truncate">@{contact.username}</div>
                    </div>
                    {isAlreadyMember ? (
                      <span className="text-[10px] font-bold text-muted-foreground text-right shrink-0">ALREADY IN GROUP</span>
                    ) : (
                      <UserPlus className="w-4 h-4 text-primary" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-center p-8 text-muted-foreground text-sm">No contacts found.</div>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

const PermissionToggle = ({ label, icon: Icon, value, onChange }: { label: string; icon: any; value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-muted-foreground" />
      <span className="text-[15px]">{label}</span>
    </div>
    <button 
      onClick={() => onChange(!value)}
      className={cn("w-10 h-5 rounded-full transition-colors relative", value ? "bg-primary" : "bg-muted-foreground/30")}
    >
      <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform", value && "translate-x-5")} />
    </button>
  </div>
);

const ActionButton = ({ Icon, label, onClick, color = "text-foreground" }: { Icon: any, label: string; onClick: () => void; color?: string }) => (
  <button 
    onClick={onClick}
    className={cn("flex flex-col items-center gap-2 flex-1 p-2 hover:bg-secondary rounded-2xl transition-all active:scale-95", color)}
  >
    <div className="p-3 bg-secondary/50 rounded-2xl">
      <Icon className="w-5 h-5" />
    </div>
    <span className="text-[11px] font-bold">{label}</span>
  </button>
);
