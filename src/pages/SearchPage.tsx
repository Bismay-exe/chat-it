import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Search, MessageSquare, Users, Globe } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { TopBar } from '@/components/layout/TopBar';
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
  isExisting?: boolean;
  member_count?: number;
}

export const SearchPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [localResults, setLocalResults] = useState<SearchResult[]>([]);
  const [platformResults, setPlatformResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim().length >= 2) {
        handleSearch();
      } else {
        setLocalResults([]);
        setPlatformResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      if (!currentUser) return;

      // 1. Search Local Chats (Your Chats)
      // Custom RPC or complex query to find existing chats matching name/username
      const { data: localData, error: localError } = await (supabase.rpc as any)('search_user_chats', {
        p_user_id: currentUser.id,
        p_query: query.trim()
      });

      if (!localError && localData) {
        setLocalResults(localData.map((d: any) => ({
          id: d.chat_id,
          type: d.chat_type as 'user' | 'group',
          name: d.name,
          username: d.username,
          avatar_url: d.avatar_url,
          isExisting: true
        })));
      }

      // 2. Search Platform-wide (On Chat-It)
      // Search Users
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${query.trim()}%,full_name.ilike.%${query.trim()}%`)
        .neq('id', currentUser.id)
        .limit(10);

      // Search Public Groups
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
        .ilike('name', `%${query.trim()}%`)
        .eq('is_public', true)
        .limit(10);

      if (userError) console.error('User search error:', userError);
      if (groupError) console.error('Group search error:', groupError);

      const combinedPlatform: SearchResult[] = [
        ...(users?.map((u: any) => ({
          id: u.id,
          type: 'user' as const,
          name: u.full_name,
          username: u.username,
          avatar_url: u.avatar_url,
          isExisting: false
        })) || []),
        ...(groups?.map((g: any) => ({
          id: g.chat_id || '',
          type: 'group' as const,
          name: g.name,
          avatar_url: g.avatar_url,
          member_count: (g.chat as any)?.members[0]?.count || 0,
          isExisting: false
        })) || [])
      ].filter((r: SearchResult) => !localResults.some((lr: SearchResult) => lr.id === r.id || (r.type === 'user' && lr.type === 'user' && lr.id === r.id)));

      setPlatformResults(combinedPlatform);

    } catch (err: any) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = async (result: SearchResult) => {
    if (result.isExisting) {
      navigate(`/chats/${result.id}`);
      return;
    }

    if (result.type === 'user') {
      // Create or toggle logic
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
      } catch (err) {
        toast.error("Failed to start chat");
      }
    } else {
      // Public group join/view
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
        title={<span className="font-semibold text-lg">Search</span>}
      />
      
      <div className="p-4 border-b border-border shadow-sm">
        <div className="relative">
          <Input 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats, people or groups..."
            className="pl-10 pr-10 rounded-2xl bg-secondary/30 border-none focus:ring-1 focus:ring-primary/20"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          {isSearching && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </div>

      <GradualScroll className="flex-1" scrollClassName="pb-4">
        <Skeleton 
          name="search-results" 
          loading={isSearching} 
          fixture={
            <div className="p-2 space-y-1">
              {[...Array(5)].map((_, i) => (
                <SearchResultItem 
                  key={i} 
                  result={{ id: `${i}`, type: 'user', name: 'Loading User Name...', username: 'loading...', avatar_url: null }} 
                  onClick={() => {}} 
                />
              ))}
            </div>
          }
        >
          {!isSearching && localResults.length > 0 && (
            <div className="p-2 space-y-1">
              <h3 className="px-4 py-3 text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-60">Your Chats</h3>
              {localResults.map((r, i) => (
                <AnimatedItem key={r.id} index={i}>
                  <SearchResultItem result={r} onClick={() => handleSelect(r)} />
                </AnimatedItem>
              ))}
            </div>
          )}
          {!isSearching && platformResults.length > 0 && (
            <div className="p-2 space-y-1">
              <h3 className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">On Chat-It</h3>
              {platformResults.map((r, i) => (
                <AnimatedItem key={r.id} index={i}>
                  <SearchResultItem result={r} onClick={() => handleSelect(r)} />
                </AnimatedItem>
              ))}
            </div>
          )}
        </Skeleton>

        {!isSearching && query.trim().length > 0 && localResults.length === 0 && platformResults.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Search className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-sm font-medium">No results found for "{query}"</p>
          </div>
        )}
        {!query.trim() && (
          <div className="flex flex-col items-center justify-center p-12 text-center opacity-40 grayscale">
             <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mb-6">
                <Search className="w-10 h-10" />
             </div>
             <p className="text-sm font-bold tracking-widest uppercase">Global Search</p>
             <p className="text-[10px] mt-1 max-w-45">Type at least 2 characters to search across all chats and people.</p>
          </div>
        )}
      </GradualScroll>
    </div>
  );
};

const SearchResultItem = ({ result, onClick }: { result: SearchResult; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-secondary/40 transition-all text-left group active:scale-[0.98]"
  >
    <Avatar src={result.avatar_url || undefined} fallback={result.name || '?'} size="md" className="shadow-sm border border-border/10" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <div className="font-bold text-[15px] truncate text-foreground">{result.name}</div>
        {result.isExisting && <div className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm border border-primary/10 leading-none">CHAT</div>}
      </div>
      <div className="text-xs text-muted-foreground font-medium truncate mt-0.5">
        {result.type === 'user' ? `@${result.username}` : (
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            <span>{result.member_count} members</span>
          </div>
        )}
      </div>
    </div>
    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
      {result.type === 'user' ? <MessageSquare className="w-4 h-4 text-primary" /> : <Globe className="w-4 h-4 text-accent" />}
    </div>
  </button>
);
