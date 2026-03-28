import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, MessageSquare, Phone, Video, Info, UserX, Ban } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar } from '@/components/ui/Avatar';
import { supabase } from '@/lib/supabase';

export const UserProfilePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (!error) setProfile(data);
    };
    fetchProfile();
  }, [id]);

  return (
    <div className="flex flex-col h-full bg-secondary/10 absolute inset-0 z-50 overflow-y-auto">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg">Contact Info</span>
          </div>
        }
      />
      
      <div className="flex flex-col items-center p-8 bg-background border-b border-border shadow-sm">
        <Avatar 
          src={profile?.avatar_url} 
          fallback={profile?.full_name || 'U'} 
          className="w-32 h-32 rounded-full mb-4 shadow-xl border-4 border-background ring-1 ring-border"
          size="xl"
        />
        <h2 className="text-2xl font-medium">{profile?.full_name || 'Loading...'}</h2>
        <p className="text-muted-foreground mt-1">@{profile?.username || '...'}</p>
      </div>

      <div className="max-w-2xl w-full mx-auto p-4 space-y-4">
        {/* Actions Grid */}
        <div className="grid grid-cols-4 gap-2 bg-background p-4 rounded-2xl shadow-sm border border-border">
          <button className="flex flex-col items-center gap-2 p-2 hover:bg-secondary rounded-xl premium-transition text-primary">
             <MessageSquare className="w-6 h-6" />
             <span className="text-[11px] font-medium">Message</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-2 hover:bg-secondary rounded-xl premium-transition text-foreground">
             <Phone className="w-6 h-6" />
             <span className="text-[11px] font-medium">Audio</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-2 hover:bg-secondary rounded-xl premium-transition text-foreground">
             <Video className="w-6 h-6" />
             <span className="text-[11px] font-medium">Video</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-2 hover:bg-secondary rounded-xl premium-transition text-foreground">
             <Info className="w-6 h-6" />
             <span className="text-[11px] font-medium">Search</span>
          </button>
        </div>

        <div className="bg-background rounded-2xl p-4 shadow-sm border border-border flex flex-col gap-1">
          <span className="text-[15px]">{profile?.about || 'Available'}</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">About</span>
        </div>

        <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden mt-6">
          <button className="w-full p-4 flex items-center gap-4 hover:bg-red-500/10 premium-transition text-left text-red-500">
            <div className="p-2 bg-red-500/10 rounded-full"><Ban className="w-5 h-5" /></div>
            <span className="font-medium text-[15px]">Block User</span>
          </button>
          <div className="w-full h-px bg-border ml-14" />
          <button className="w-full p-4 flex items-center gap-4 hover:bg-red-500/10 premium-transition text-left text-red-500">
            <div className="p-2 bg-red-500/10 rounded-full"><UserX className="w-5 h-5" /></div>
            <span className="font-medium text-[15px]">Report User</span>
          </button>
        </div>
      </div>
    </div>
  );
};
