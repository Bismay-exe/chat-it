import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Bell, Image as ImageIcon, Search, Lock, UserPlus, LogOut, Loader2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar } from '@/components/ui/Avatar';
import { useChats } from '@/hooks/useChats';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface Member {
  user_id: string;
  role: 'admin' | 'member';
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export const GroupInfoPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { chats } = useChats();
  const chatInfo = chats.find(c => c.chat_id === id);
  
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('chat_members')
        .select('user_id, role, profiles(username, full_name, avatar_url)')
        .eq('chat_id', id);
        
      if (error) {
        toast.error('Failed to load members');
      } else {
        setMembers(data as any || []);
      }
      setIsLoading(false);
    };
    fetchMembers();
  }, [id]);

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
      />
      
      <div className="flex flex-col items-center p-8 bg-background border-b border-border shadow-sm">
        <Avatar 
          src={chatInfo?.avatar_url} 
          fallback={chatInfo?.name || 'G'} 
          className="w-32 h-32 rounded-full mb-4 shadow-xl border-4 border-background ring-1 ring-border"
          size="xl"
        />
        <h2 className="text-2xl font-medium">{chatInfo?.name || 'Loading...'}</h2>
        <p className="text-muted-foreground mt-1">Group · {members.length} participant{members.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="max-w-2xl w-full mx-auto p-4 space-y-4">
        {/* Actions Grid */}
        <div className="grid grid-cols-4 gap-2 bg-background p-4 rounded-2xl shadow-sm border border-border">
          <button className="flex flex-col items-center gap-2 p-2 hover:bg-secondary rounded-xl premium-transition text-primary">
             <Bell className="w-6 h-6" />
             <span className="text-[11px] font-medium">Mute</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-2 hover:bg-secondary rounded-xl premium-transition text-foreground">
             <Search className="w-6 h-6" />
             <span className="text-[11px] font-medium">Search</span>
          </button>
          <button 
            onClick={() => navigate(`/chats/${id}/media`)}
            className="flex flex-col items-center gap-2 p-2 hover:bg-secondary rounded-xl premium-transition text-foreground"
          >
             <ImageIcon className="w-6 h-6" />
             <span className="text-[11px] font-medium">Media</span>
          </button>
          <button 
            onClick={handleLeaveGroup}
            className="flex flex-col items-center gap-2 p-2 hover:bg-red-500/10 rounded-xl premium-transition text-red-500"
          >
             <LogOut className="w-6 h-6" />
             <span className="text-[11px] font-medium">Leave</span>
          </button>
        </div>

        <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
          <button className="w-full p-4 flex items-center gap-4 hover:bg-secondary/50 premium-transition text-left text-primary">
            <div className="p-2 bg-primary/10 rounded-full"><UserPlus className="w-5 h-5" /></div>
            <span className="font-medium text-[15px]">Add members</span>
          </button>
          <div className="w-full h-px bg-border ml-14" />
          <button className="w-full p-4 flex items-center gap-4 hover:bg-secondary/50 premium-transition text-left text-primary">
            <div className="p-2 bg-primary/10 rounded-full"><Lock className="w-5 h-5" /></div>
            <span className="font-medium text-[15px]">Invite via link</span>
          </button>
        </div>

        <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden pb-4">
           <div className="p-4 bg-secondary/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
             Participants
           </div>
           
           {isLoading ? (
             <div className="p-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
           ) : (
             <div className="divide-y divide-border">
               {members.map(member => (
                 <div key={member.user_id} className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 premium-transition text-left cursor-pointer">
                    <Avatar src={member.profiles.avatar_url} fallback={member.profiles.full_name} size="md" />
                    <div className="flex-1">
                      <h3 className="font-medium text-[15px]">{member.user_id === user?.id ? 'You' : member.profiles.full_name}</h3>
                      <p className="text-xs text-muted-foreground">@{member.profiles.username}</p>
                    </div>
                    {member.role === 'admin' && (
                       <span className="text-[10px] text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full font-bold uppercase">Admin</span>
                    )}
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
