import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Search, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { TopBar } from '@/components/layout/TopBar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

export const SearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProfileData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .ilike('username', `%${query.trim()}%`)
        .limit(20);

      if (error) throw error;
      setResults(data || []);
      if (data?.length === 0) toast('No users found with that username.');
    } catch (err: any) {
      toast.error('Search failed: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const myId = userData.user.id;

      // Check if direct chat already exists
      const { data: existingChats, error: searchError } = await (supabase.rpc as any)('get_direct_chat_between_users', {
        user1_id: myId,
        user2_id: userId
      });

      if (searchError) throw searchError;

      if (existingChats && existingChats.length > 0) {
        navigate(`/chats/${existingChats[0].chat_id}`);
        return;
      }

      // Create new direct chat
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({ type: 'direct' })
        .select()
        .single();
        
      if (chatError) throw chatError;

      // Add members (myself and other user)
      const { error: membersError } = await supabase
        .from('chat_members')
        .insert([
          { chat_id: chatData.id, user_id: myId, role: 'member' },
          { chat_id: chatData.id, user_id: userId, role: 'member' }
        ]);

      if (membersError) throw membersError;

      navigate(`/chats/${chatData.id}`);
    } catch (err: any) {
      toast.error('Failed to start chat: ' + err.message);
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
        title={<span className="font-semibold text-lg">Search Users</span>}
      />
      
      <div className="p-4 border-b border-border">
        <form onSubmit={handleSearch} className="relative">
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            className="pl-10 rounded-full bg-secondary/30 border-transparent focus:border-primary/50 focus:bg-background"
            disabled={isSearching}
          />
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <button type="submit" className="hidden" disabled={isSearching}>Search</button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {results.map(user => (
          <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 premium-transition cursor-pointer" onClick={() => handleStartChat(user.id)}>
            <Avatar src={user.avatar_url} fallback={user.full_name} size="md" />
            <div className="flex-1">
              <h3 className="font-medium text-[15px]">{user.full_name}</h3>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
            <button className="p-2 text-primary hover:bg-primary/10 rounded-full premium-transition">
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
        ))}

        {results.length === 0 && !isSearching && query.length > 0 && (
          <div className="text-center p-8 text-muted-foreground">
            Press Enter to search
          </div>
        )}
      </div>
    </div>
  );
};
