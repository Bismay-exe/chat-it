import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Megaphone, Loader2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';

interface Announcement {
  id: string;
  title: string;
  body: string;
  expires_at: string;
  chat_id: string;
  group_info: {
    name: string;
    avatar_url: string;
  };
}

export const AnnouncementsPage = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*, group_info:chat_id(group_info(name, avatar_url))')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        // Flatten the data because of nested group_info select
        const items = data.map((item: any) => ({
          ...item,
          group_info: item.group_info[0]?.group_info
        }));
        setAnnouncements(items);
      }
      setIsLoading(false);
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="flex flex-col h-full bg-secondary/10 absolute inset-0 z-50 overflow-y-auto w-full md:w-80 lg:w-95 border-r border-border">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="md:hidden p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg leading-tight">Announcements</span>
          </div>
        }
      />
      
      <div className="flex-1 p-4 flex flex-col items-center">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : announcements.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
              <Megaphone className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-medium mb-2">Platform Updates</h2>
            <p className="text-muted-foreground text-sm max-w-62.5">
              Important announcements and updates from the Chat-It team will appear here. No unread announcements right now.
            </p>
          </div>
        ) : (
          <div className="w-full space-y-4">
             {announcements.map(ann => (
               <div key={ann.id} className="bg-background p-4 rounded-2xl shadow-sm border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar src={ann.group_info?.avatar_url} fallback={ann.group_info?.name} size="sm" />
                    <span className="text-xs font-semibold text-muted-foreground">{ann.group_info?.name}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{ann.title}</h3>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{ann.body}</p>
                  <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                     <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Expires {format(new Date(ann.expires_at), 'MMM d, h:mm a')}</span>
                     <span className="bg-green-500/10 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};
