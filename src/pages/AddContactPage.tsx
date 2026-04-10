import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Users, Search as SearchIcon, Globe, MessageSquare, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TopBar } from '@/components/layout/TopBar';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Skeleton } from 'boneyard-js/react';
import { GradualScroll } from '@/components/ui/GradualScroll';
import { AnimatedItem } from '@/components/ui/AnimatedItem';

interface SearchResult {
  id: string;
  type: 'user' | 'group';
  name: string;
  username?: string;
  avatar_url: string | null;
  member_count?: number;
}

export const AddContactPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isChatOnly = searchParams.get('type') === 'chat';
  const { user: currentUser } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim()) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      // 1. Search Users
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', currentUser?.id || '')
        .limit(10);

      if (userError) throw userError;

      // 2. Search Public Groups
      const { data: groups, error: groupError } = await supabase
        .from('group_info')
        .select(`
          chat_id, 
          name, 
          avatar_url,
          chat:chats(
            members:chat_members(count)
          )
        `)
        .ilike('name', `%${query}%`)
        .eq('is_public', true)
        .limit(10);

      if (groupError) throw groupError;

      const formattedResults: SearchResult[] = [
        ...(users?.map(u => ({
          id: u.id,
          type: 'user' as const,
          name: u.full_name,
          username: u.username,
          avatar_url: u.avatar_url
        })) || []),
        ...(groups?.map(g => ({
          id: g.chat_id || '',
          type: 'group' as const,
          name: g.name,
          avatar_url: g.avatar_url,
          member_count: (g.chat as any)?.members[0]?.count || 0
        })) || [])
      ].filter(r => r.id !== '');

      setResults(formattedResults);
    } catch (err: any) {
      console.error('Search failed:', err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = async (result: SearchResult) => {
    if (result.type === 'user') {
       // Start DM logic
       try {
         const { data: existing } = await (supabase.rpc as any)('get_direct_chat_between_users', {
            user1_id: currentUser?.id,
            user2_id: result.id
         });

         if (existing && existing.length > 0) {
           navigate(`/chats/${existing[0].chat_id}`);
         } else {
           const { data: chat } = await supabase.from('chats').insert({ type: 'direct' }).select().single();
           if (chat) {
             await supabase.from('chat_members').insert([
               { chat_id: chat.id, user_id: currentUser?.id, role: 'member' },
               { chat_id: chat.id, user_id: result.id, role: 'member' }
             ]);
             navigate(`/chats/${chat.id}`);
           }
         }
       } catch (err: any) {
         toast.error("Failed to start chat");
       }
    } else {
       // Navigate to group or group info
       navigate(`/chats/${result.id}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background absolute inset-0 z-50">
      <TopBar 
        leftElement={
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
        }
        title={<span className="font-semibold text-lg">New Chat</span>}
      />
      
      <div className="p-4 border-b border-border shadow-sm">
        <div className="relative">
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search username, name or group..."
            className="pl-10 rounded-2xl bg-secondary/30 border-none focus:ring-1 focus:ring-primary/20"
            disabled={isSearching}
          />
          <SearchIcon className={cn("w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-opacity", isSearching && "opacity-0")} />
          {isSearching && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </div>

      <GradualScroll className="flex-1" scrollClassName="pb-4">
        <Skeleton 
          name="add-contact-results" 
          loading={isSearching}
          fixture={
            <div className="p-2 space-y-1">
               {[...Array(5)].map((_, i) => (
                 <AnimatedItem key={i} index={i}>
                   <button className="w-full flex items-center gap-4 p-3 rounded-2xl text-left group">
                     <Avatar src={undefined} fallback="?" size="md" />
                     <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">Loading Name</div>
                        <div className="text-xs text-muted-foreground truncate">@loading</div>
                     </div>
                   </button>
                 </AnimatedItem>
               ))}
            </div>
          }
        >
        {results.length > 0 ? (
          <div className="p-2 space-y-1">
             <h3 className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">On Chat-It</h3>
             {results.map((r, i) => (
               <AnimatedItem key={r.id} index={i}>
                 <button 
                   onClick={() => handleSelect(r)}
                   className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-secondary/40 transition-colors text-left group"
                 >
                   <Avatar src={r.avatar_url || undefined} fallback={r.name || '?'} size="md" />
                   <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{r.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {r.type === 'user' ? `@${r.username}` : `${r.member_count} members`}
                      </div>
                   </div>
                   {r.type === 'user' ? <MessageSquare className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" /> : <Globe className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />}
                 </button>
               </AnimatedItem>
             ))}
          </div>
        ) : query.trim() ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <SearchIcon className="w-12 h-12 mb-4 opacity-20" />
            <p>No results for "{query}"</p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {!isChatOnly && (
              <div className="space-y-2">
                <h3 className="px-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-2">
                  <QuickActionButton icon={Users} label="New Group" onClick={() => navigate('/add/new-group')} sub="Create a group with friends" color="bg-primary/10 text-primary" />
                </div>
              </div>
            )}
            
            <div className="space-y-4">
               <h3 className="px-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">Recent Chats</h3>
               <p className="px-1 text-sm text-muted-foreground">Your recent contacts will appear here as you chat.</p>
            </div>
          </div>
        )}
        </Skeleton>
      </GradualScroll>
    </div>
  );
};

const QuickActionButton = ({ icon: Icon, label, sub, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-secondary/40 transition-all border border-border group active:scale-[0.98]"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} premium-transition group-hover:scale-110`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="flex-1 text-left">
      <div className="font-bold text-[15px]">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50" />
  </button>
);

